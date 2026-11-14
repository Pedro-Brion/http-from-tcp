# http-from-tcp

An HTTP/1.1 server written in TypeScript on top of Node's raw `net` module. It doesn't use `http`, Express or any other framework: it reads bytes from a TCP socket, parses the request itself, routes it, and writes the response by hand.

Loosely based on the CodeCrafters ["Build Your Own HTTP server"](https://app.codecrafters.io/) challenge. The implementation is in TypeScript, and the features that come next are chosen independently of the course.

The goal is to explore how HTTP works at the socket level rather than to ship a production server. It may eventually grow into a small library other projects can build on.

> **Status: work in progress.** The core request/response cycle works, and the project is growing one piece at a time. See [Current scope](#current-scope) and the [Roadmap](#roadmap).

## Features

- Request parsing: method, path, headers and body
- Fluent route registration with `GET` and `POST`
- Path parameters (`/echo/:str`) available on `req.params`
- Trie route tree that matches by path segment
- `404 Not Found` for unknown paths, `405 Method Not Allowed` for known paths with an unregistered method
- Responses with `Content-Length` computed from the UTF-8 byte size of the body

## Getting started

Requirements: a recent Node.js (the code relies on the global `Blob`, available since Node 18) and [pnpm](https://pnpm.io/).

```sh
pnpm install
pnpm dev        # run from source with auto-restart
```

or compile and run:

```sh
pnpm start      # builds into ./build, then runs build/index.js
```

The server listens on `http://localhost:3000`.

```sh
curl -i http://localhost:3000/health
curl -i http://localhost:3000/echo/hello
```

### Scripts

| Script       | What it does                                               |
| ------------ | ---------------------------------------------------------- |
| `pnpm dev`   | Runs `src/index.ts` with `tsx` and restarts on change |
| `pnpm build` | Compiles TypeScript into `build/` (`build.mjs` calls `tsc`) |
| `pnpm start` | Builds, then runs `build/index.js`                          |

## Usage

Routes are registered through a fluent builder:

```ts
import { HttpServer } from "./core/http/Server.ts";

const http = new HttpServer(3000);

http.route("/health").get((_req, res) => res.status(200).send("ok"));

http.route("/echo/:str").get((req, res) => {
  res.status(200).send(req.params.str);
});

http.init(() => console.log("listening"));
```

A handler receives an `HttpRequest` and an `HttpResponse`:

| `HttpRequest`      | Description                                  |
| ------------------ | -------------------------------------------- |
| `method`           | `"GET"` or `"POST"`                          |
| `path`             | Request target, e.g. `/echo/hello`           |
| `params`           | Path parameters, e.g. `{ str: "hello" }`     |
| `headers`          | Parsed request headers                       |
| `body`             | Raw request body as a string                 |

| `HttpResponse`     | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `status(code)`     | Sets the status code (number or string), returns `this`  |
| `headers`          | Response headers (defaults: `Content-type`, `Server`)    |
| `send(body?)`      | Serializes the response and writes it to the socket      |

## How it works

1. `HttpServer` creates a `net.Server`. Each connection gets an `HttpResponse` bound to its socket.
2. When data arrives, the raw text is parsed by `HttpRequest` into method, path, headers and body.
3. `HttpRouter.search(request)` walks the path segment by segment through a tree of `RouteNode`s. A `:name` segment is stored as a wildcard child that records the parameter name; matched values are written to `request.params`.
4. The result decides what happens: no node, `404`; a node without a handler for the method, `405`; otherwise the registered handler runs.
5. The socket is closed after the response (one request per connection).

### Project structure

```
src/
├── index.ts               Entry point: creates the server and registers routes
└── core/http/
    ├── Server.ts          HttpServer: net server, per-connection handling, dispatch
    ├── Request.ts         HttpRequest: raw text -> method, path, headers, body
    ├── Response.ts        HttpResponse: status, headers, serialization
    ├── Router.ts          HttpRouter: singleton route tree, addRoute / search / route
    ├── Route.ts           RouteNode (tree node) and RouteBuilder (fluent .get/.post)
    ├── utils.ts           byteSize() used for Content-Length
    └── types.d.ts         RouteHandler, RouteParams, HttpMethod, Middleware
build.mjs                  Build script (reads outDir from tsconfig.json, runs tsc)
```

## Current scope

What the server covers today, and what is still ahead:

- Methods: `GET` and `POST`.
- Each request is read from a single TCP chunk (full stream handling is on the [roadmap](#roadmap)).
- One request per connection; keep-alive comes later.
- Responses are plain text by default.
- Request bodies are kept as a raw string.
- Query strings are part of the path for now.
- Automated tests are not in place yet.

## Roadmap

### TCP stream handling

Today each `data` event is treated as one complete HTTP request. TCP is a byte stream with no message boundaries, so a request can arrive split across several chunks, and several requests can arrive in one chunk. Planned work:

- [ ] Buffer incoming bytes per connection
- [ ] Detect the end of the header block (`\r\n\r\n`)
- [ ] Read bodies using `Content-Length`, including bodies that span several chunks
- [ ] Support chunked transfer encoding
- [ ] Keep-alive: handle multiple sequential requests on one connection

### Middleware

The `Middleware` type and the `addGlobalMiddleware()` entry point on `HttpServer` exist as scaffolding, but nothing runs them yet. Planned work:

- [ ] Global middleware, executed in registration order before routing
- [ ] A `next` mechanism to pass control down the chain or stop it
- [ ] Per-route middleware
- [ ] Error-handling middleware
