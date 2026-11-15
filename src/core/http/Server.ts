import * as net from "net";
import { HttpRouter } from "./Router.ts";
import { HttpResponse } from "./Response.ts";
import { HttpRequest } from "./Request.ts";
import { RouteBuilder } from "./Route.ts";
import { Middleware } from "./types.ts";

export class HttpServer {
  private p_server: net.Server;
  private p_port: number;
  private p_router: HttpRouter;

  private p_global_middlewares: Middleware[] = [];

  constructor(port: number) {
    this.p_router = HttpRouter.instance;
    this.p_port = port;

    this.p_server = net.createServer((socket) => {
      const response = new HttpResponse(socket);
      socket.on("data", (_data) => {
        console.log("RECEIVED DATA::::::\r\n" + _data.toString());
        console.log("\r\n\r\n");
        const request = new HttpRequest(_data.toString());
        const route = this.p_router.search(request);

        if (!route.found) response.status(404).send();
        else if (!route.handle) response.status(405).send();
        else route.handle(request, response);
        socket.end();
        socket.destroy();
      });

      socket.on("close", () => {
        console.log("Closing!\r\n\r\n:::::::::\r\n");
        socket.end();
      });

      socket.on("end", () => {
        console.log("EOF.");
      });
    });
  }

  init(cb?: () => void) {
    this.p_server.listen(this.p_port, "localhost", cb);
  }

  route(route: string): RouteBuilder {
    return this.p_router.route(route);
  }

  private p_handleDataReceived(_data: Buffer) {}

  addGlobalMiddleware(input: Middleware | Middleware[]): void {}
}
