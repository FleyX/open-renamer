import * as path from 'std/path/mod.ts';
import Logger from '../util/Logger.ts';
import { Router } from "oak/router";
import { Context } from "oak";

type RouteHandler = (ctx: Context) => Promise<void>;

async function addMapping(router: Router, filePath: string) {
  const mapping = await import(filePath);
  for (const url of Object.keys(mapping.default)) {
    if (url.startsWith('GET ')) {
      const temp = url.substring(4);
      router.get(temp, mapping.default[url] as RouteHandler);
      Logger.info(`----GET：${temp}`);
    } else if (url.startsWith('POST ')) {
      const temp = url.substring(5);
      router.post(temp, mapping.default[url] as RouteHandler);
      Logger.info(`----POST：${temp}`);
    } else if (url.startsWith('PUT ')) {
      const temp = url.substring(4);
      router.put(temp, mapping.default[url] as RouteHandler);
      Logger.info(`----PUT：${temp}`);
    } else if (url.startsWith('DELETE ')) {
      const temp = url.substring(7);
      router.delete(temp, mapping.default[url] as RouteHandler);
      Logger.info(`----DELETE: ${temp}`);
    } else {
      Logger.info(`xxxxx无效路径：${url}`);
    }
  }
}

async function addControllers(router: Router, filePath: string) {
  for await (const entry of Deno.readDir(filePath)) {
    const temp = path.join(filePath, entry.name);
    const state = await Deno.stat(temp);

    if (state.isDirectory) {
      await addControllers(router, temp);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('Helper.ts') && !entry.name.startsWith('types')) {
      Logger.info(`\n--开始处理: ${entry.name}路由`);
      await addMapping(router, temp);
    }
  }
}

export default async function engine(router: Router, folder: string) {
  await addControllers(router, folder);
  return router.routes();
}
