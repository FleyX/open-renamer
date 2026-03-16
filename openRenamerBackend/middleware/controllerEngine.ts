import Logger from '../util/Logger.ts';
import { Router } from "oak/router";
import { Context } from "oak";

// 静态导入所有 API 模块（修复 Windows 下 deno compile 后动态导入失败的问题）
import ApplicationRuleApi from '../api/ApplicationRuleApi.ts';
import FileApi from '../api/FileApi.ts';
import GlobalConfigApi from '../api/GlobalConfigApi.ts';
import PublicApi from '../api/PublicApi.ts';
import RenamerApi from '../api/RenamerApi.ts';

type RouteHandler = (ctx: Context) => Promise<void>;

const apiModules = [
  { name: 'ApplicationRuleApi.ts', module: ApplicationRuleApi },
  { name: 'FileApi.ts', module: FileApi },
  { name: 'GlobalConfigApi.ts', module: GlobalConfigApi },
  { name: 'PublicApi.ts', module: PublicApi },
  { name: 'RenamerApi.ts', module: RenamerApi },
];

function addMapping(router: Router, name: string, mapping: Record<string, RouteHandler>) {
  Logger.info(`\n--开始处理: ${name}路由`);
  for (const url of Object.keys(mapping)) {
    if (url.startsWith('GET ')) {
      const temp = url.substring(4);
      router.get(temp, mapping[url] as RouteHandler);
      Logger.info(`----GET：${temp}`);
    } else if (url.startsWith('POST ')) {
      const temp = url.substring(5);
      router.post(temp, mapping[url] as RouteHandler);
      Logger.info(`----POST：${temp}`);
    } else if (url.startsWith('PUT ')) {
      const temp = url.substring(4);
      router.put(temp, mapping[url] as RouteHandler);
      Logger.info(`----PUT：${temp}`);
    } else if (url.startsWith('DELETE ')) {
      const temp = url.substring(7);
      router.delete(temp, mapping[url] as RouteHandler);
      Logger.info(`----DELETE: ${temp}`);
    } else {
      Logger.info(`xxxxx无效路径：${url}`);
    }
  }
}

function addControllers(router: Router) {
  for (const { name, module } of apiModules) {
    addMapping(router, name, module);
  }
}

export default function engine(router: Router) {
  addControllers(router);
  return router.routes();
}
