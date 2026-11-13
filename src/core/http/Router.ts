import { HttpRequest } from "./Request.ts";
import { RouteBuilder, RouteNode } from "./Route.ts";
import { HttpMethod, RouteHandler, RouteParams } from "./types.ts";

export class HttpRouter {
  private root: RouteNode;
  private static _instance: HttpRouter;

  private constructor() {
    this.root = new RouteNode();
  }

  public static get instance(): HttpRouter {
    if (!HttpRouter._instance) {
      HttpRouter._instance = new HttpRouter();
    }

    return HttpRouter._instance;
  }

  addRoute(path: string, method: HttpMethod, handle: RouteHandler) {
    let currentRouteNode: RouteNode | null = this.root;
    const segments = path.split("/").filter(Boolean);

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const nextRoute: RouteNode | null = currentRouteNode!.find(segment);
      if (!nextRoute) {
        currentRouteNode = currentRouteNode?.addNode(segment);
      } else {
        currentRouteNode = nextRoute;
      }
    }
    currentRouteNode.addMethod(method, handle);
  }

  search(req: HttpRequest): {
    handle: RouteHandler | null;
    params: RouteParams;
    found: boolean;
  } {
    let currentRouteNode: RouteNode | null = this.root;
    const segments = req.path.split("/").filter(Boolean);
    const params: RouteParams = {};

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentRouteNode = currentRouteNode.find(segment);
      if (!currentRouteNode) break;
      if (currentRouteNode?.paramName)
        params[currentRouteNode?.paramName] = segment;
    }

    req.params = params;
    return {
      handle: currentRouteNode?.handle(req.method) ?? null,
      params,
      found: !!currentRouteNode,
    };
  }

  route(path: string): RouteBuilder {
    return new RouteBuilder(this, path);
  }
}
