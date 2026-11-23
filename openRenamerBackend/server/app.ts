import { mkdir } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import path from "node:path";
import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
  type Router,
} from "express";
import ApplicationRuleApi from "../api/ApplicationRuleApi.ts";
import createAiRenameRoutes from "../api/AiRenameApi.ts";
import createFileRoutes from "../api/FileApi.ts";
import GlobalConfigApi from "../api/GlobalConfigApi.ts";
import createRenamerRoutes from "../api/RenamerApi.ts";
import type {
  ApiContext,
  ApiHeaders,
  RouterDefinition,
} from "../api/types.ts";
import { getNodeMessage, loadGlobalMessages } from "../i18n/nodeI18n.ts";
import { openNodeDatabase } from "./nodeSqlite.ts";

const API_PREFIX = "/openRenamer/api";
const PUBLIC_ROUTES = new Set([
  "POST /public/checkToken",
  "GET /file/isWindows",
]);

export interface NodeServerOptions {
  host?: string;
  port?: number;
  dataPath?: string;
  resourceRootPath?: string;
  token?: string | null;
}

export interface RunningNodeServer {
  host: string;
  port: number;
  url: string;
  close(): Promise<void>;
}

interface ResolvedOptions {
  host: string;
  port: number;
  dataPath: string;
  resourceRootPath: string;
  token: string | null;
  isWindows: boolean;
}

function resolveOptions(options: NodeServerOptions): ResolvedOptions {
  const resourceRootPath = path.resolve(
    options.resourceRootPath ?? path.join(import.meta.dirname, ".."),
  );
  const envPort = process.env.PORT ? Number(process.env.PORT) : 8089;
  const port = options.port ?? envPort;
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`无效端口: ${port}`);
  }

  return {
    host: options.host ?? process.env.HOST ?? "0.0.0.0",
    port,
    dataPath: path.resolve(
      options.dataPath ??
        process.env.DATA_PATH ??
        path.join(resourceRootPath, "data"),
    ),
    resourceRootPath,
    token:
      options.token !== undefined
        ? options.token
        : process.env.TOKEN || null,
    isWindows: process.platform === "win32",
  };
}

function apiRouteKey(request: Request): string {
  const pathname = (request.originalUrl || request.url).split("?")[0];
  return `${request.method} ${pathname.slice(API_PREFIX.length)}`;
}

function getHeader(headers: Request["headers"], name: string): string | null {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

async function runRoute(
  handler: RouterDefinition[string],
  request: Request,
  response: Response,
): Promise<void> {
  const apiContext: ApiContext = {
    request: {
      method: request.method,
      url: new URL(request.originalUrl, "http://localhost"),
      headers: {
        get: (name) => getHeader(request.headers, name),
      } satisfies ApiHeaders,
      body: request.body,
      params: request.params as Record<string, string>,
    },
    response: {},
  };

  await handler(apiContext);

  const body = apiContext.response.body;
  response.status(apiContext.response.status ?? (body == null ? 204 : 200));
  if (body == null) {
    response.end();
  } else if (typeof body === "string") {
    response.type("text/plain").send(body);
  } else {
    response.json(body);
  }
}

function mountRoutes(router: Router, routes: RouterDefinition): void {
  for (const route of Object.keys(routes)) {
    const separator = route.indexOf(" ");
    const method = route.slice(0, separator).toLowerCase();
    const routePath = route.slice(separator + 1);
    const handler: express.RequestHandler = async (request, response, next) => {
      try {
        await runRoute(routes[route], request, response);
      } catch (error) {
        next(error);
      }
    };
    switch (method) {
      case "get":
        router.get(routePath, handler);
        break;
      case "post":
        router.post(routePath, handler);
        break;
      case "put":
        router.put(routePath, handler);
        break;
      case "delete":
        router.delete(routePath, handler);
        break;
      default:
        throw new Error(`不支持的 HTTP 方法: ${method}`);
    }
  }
}

export async function startNodeServer(
  options: NodeServerOptions = {},
): Promise<RunningNodeServer> {
  const config = resolveOptions(options);
  await mkdir(config.dataPath, { recursive: true });
  await loadGlobalMessages(config.resourceRootPath);

  const database = await openNodeDatabase(
    config.dataPath,
    config.resourceRootPath,
  );
  const app = express();
  app.disable("x-powered-by");

  const staticPath = path.join(config.resourceRootPath, "static");
  app.use(express.static(staticPath, { index: "index.html" }));

  app.use(API_PREFIX, (request, response, next) => {
    if (!config.token) {
      next();
      return;
    }
    if (PUBLIC_ROUTES.has(apiRouteKey(request))) {
      next();
      return;
    }
    if (request.get("token") === config.token) {
      next();
      return;
    }
    response
      .status(401)
      .type("text/plain")
      .send(getNodeMessage(request.get("lang"), "key-error"));
  });

  app.use(express.json({ limit: "50mb" }));

  const apiRouter = express.Router();
  mountRoutes(apiRouter, ApplicationRuleApi);
  mountRoutes(apiRouter, GlobalConfigApi);
  mountRoutes(apiRouter, createFileRoutes(() => config.isWindows));
  mountRoutes(apiRouter, createRenamerRoutes(getNodeMessage));
  mountRoutes(apiRouter, createAiRenameRoutes(getNodeMessage));
  apiRouter.post("/public/checkToken", (request, response) => {
    response.json(request.body?.token === config.token);
  });
  app.use(API_PREFIX, apiRouter);
  app.use(API_PREFIX, (_request, response) => {
    response.status(404).type("text/plain").send("Not Found");
  });

  app.use((request, response, next) => {
    if (
      request.method === "GET" &&
      request.accepts("html") &&
      !path.extname(request.path)
    ) {
      response.sendFile(path.join(staticPath, "index.html"), (error) => {
        if (error) next();
      });
      return;
    }
    next();
  });

  const errorHandler: ErrorRequestHandler = (
    error,
    request,
    response,
    _next,
  ) => {
    if (response.headersSent) {
      return;
    }
    const status =
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    response
      .status(status)
      .type("text/plain")
      .send(getNodeMessage(request.get("lang"), message));
  };
  app.use(errorHandler);

  const server = createServer(app);
  try {
    await listen(server, config.port, config.host);
  } catch (error) {
    database.close();
    throw error;
  }

  const address = server.address();
  const port =
    typeof address === "object" && address !== null ? address.port : config.port;
  const urlHost =
    config.host === "0.0.0.0" || config.host === "::" ? "localhost" : config.host;
  let closing: Promise<void> | undefined;

  return {
    host: config.host,
    port,
    url: `http://${urlHost}:${port}`,
    close: () => closing ??= closeServer(server).finally(() => database.close()),
  };
}

function listen(server: Server, port: number, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
