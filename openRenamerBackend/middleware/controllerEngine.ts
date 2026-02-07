import * as path from 'std/path/mod.ts';
// 导入Deno标准库日志模块
import * as log from 'std/log/mod.ts';

async function addMapping(router, filePath: string) {
  let mapping = await import(filePath);
  for (let url in mapping.default) {
    if (url.startsWith('GET ')) {
      let temp = url.substring(4);
      router.get(temp, mapping.default[url]);
      log.info(`----GET：${temp}`);
    } else if (url.startsWith('POST ')) {
      let temp = url.substring(5);
      router.post(temp, mapping.default[url]);
      log.info(`----POST：${temp}`);
    } else if (url.startsWith('PUT ')) {
      let temp = url.substring(4);
      router.put(temp, mapping.default[url]);
      log.info(`----PUT：${temp}`);
    } else if (url.startsWith('DELETE ')) {
      let temp = url.substring(7);
      router.delete(temp, mapping.default[url]);
      log.info(`----DELETE: ${temp}`);
    } else {
      log.info(`xxxxx无效路径：${url}`);
    }
  }
}

async function addControllers(router, filePath: string) {
  for await (const entry of Deno.readDir(filePath)) {
    const temp = path.join(filePath, entry.name);
    const state = await Deno.stat(temp);
    
    if (state.isDirectory) {
      await addControllers(router, temp);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('Helper.ts')) {
      log.info(`\n--开始处理: ${entry.name}路由`);
      await addMapping(router, temp);
    }
  }
}

export default async function engine(router, folder: string) {
  await addControllers(router, folder);
  return router.routes();
}
