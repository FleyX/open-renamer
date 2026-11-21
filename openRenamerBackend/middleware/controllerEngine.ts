import Logger from "../util/Logger.ts";
import { Router } from "oak/router";
import { Context } from "oak";

import ApplicationRuleApi from "../api/ApplicationRuleApi.ts";
import FileApi from "../api/FileApi.ts";
import GlobalConfigApi from "../api/GlobalConfigApi.ts";
import PublicApi from "../api/PublicApi.ts";
import RenamerApi from "../api/RenamerApi.ts";
import type { ApiHandler, RouterDefinition } from "../api/types.ts";
import type { OakRouterDefinition } from "../api/oakTypes.ts";

type OakRouteHandler = (ctx: Context) => Promise<void>;

const sharedApiModules: Array<{ name: string; module: RouterDefinition }> = [
  { name: "ApplicationRuleApi.ts", module: ApplicationRuleApi },
  { name: "GlobalConfigApi.ts", module: GlobalConfigApi },
];

const oakApiModules: Array<{ name: string; module: OakRouterDefinition }> = [
  { name: "FileApi.ts", module: FileApi },
  { name: "PublicApi.ts", module: PublicApi },
  { name: "RenamerApi.ts", module: RenamerApi },
];

async function readJsonBody(ctx: Context): Promise<unknown> {
  const body = ctx.request.body();
  return body.value;
}

function adaptOakHandler(handler: ApiHandler): OakRouteHandler {
  return async (ctx: Context) => {
    const apiContext = {
      request: {
        method: ctx.request.method,
        url: ctx.request.url,
        headers: ctx.request.headers,
        body: ctx.request.hasBody ? await readJsonBody(ctx) : undefined,
        params:
          (ctx as Context & { params?: Record<string, string> }).params ?? {},
      },
      response: {} as { status?: number; body?: unknown },
    };

    await handler(apiContext);

    if (apiContext.response.status !== undefined) {
      ctx.response.status = apiContext.response.status;
    }
    ctx.response.body = apiContext.response.body as never;
  };
}

function addMapping(
  router: Router,
  name: string,
  mapping: Record<string, OakRouteHandler>,
) {
  Logger.info(`\n--开始处理: ${name}路由`);
  for (const url of Object.keys(mapping)) {
    const handler = mapping[url];
    if (url.startsWith("GET ")) {
      const temp = url.substring(4);
      router.get(temp, handler);
      Logger.info(`----GET：${temp}`);
    } else if (url.startsWith("POST ")) {
      const temp = url.substring(5);
      router.post(temp, handler);
      Logger.info(`----POST：${temp}`);
    } else if (url.startsWith("PUT ")) {
      const temp = url.substring(4);
      router.put(temp, handler);
      Logger.info(`----PUT：${temp}`);
    } else if (url.startsWith("DELETE ")) {
      const temp = url.substring(7);
      router.delete(temp, handler);
      Logger.info(`----DELETE: ${temp}`);
    } else {
      Logger.info(`xxxxx无效路径：${url}`);
    }
  }
}

function addControllers(router: Router) {
  for (const { name, module } of sharedApiModules) {
    const adapted: OakRouterDefinition = {};
    for (const route of Object.keys(module)) {
      adapted[route] = adaptOakHandler(module[route]);
    }
    addMapping(router, name, adapted);
  }
  for (const { name, module } of oakApiModules) {
    addMapping(router, name, module);
  }
}

export default function engine(router: Router) {
  addControllers(router);
  return router.routes();
}
