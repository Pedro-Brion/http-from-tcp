import { HttpRequest } from "./Request.ts";
import { HttpResponse } from "./Response.ts";

export type RouteHandler = (req: HttpRequest, res: HttpResponse) => void;
export type RouteParams = { [key: string]: string };
export type HttpMethod = "GET" | "POST";
export type Middleware = (
  req: HttpRequest,
  res: HttpResponse,
  next?: Middleware | RouteHandler
) => void;
