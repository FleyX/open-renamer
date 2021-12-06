import * as fs from 'fs-extra';
import * as path from 'path';
import log from '../util/LogUtil';

async function addMapping(router, filePath: string) {
  let mapping = require(filePath).default;
  for (let url in mapping) {
    if (url.startsWith('GET ')) {
      let temp = url.substring(4);
      router.get(temp, mapping[url]);
      log.info(`----GET：${temp}`);
    } else if (url.startsWith('POST ')) {
      let temp = url.substring(5);
      router.post(temp, mapping[url]);
      log.info(`----POST：${temp}`);
    } else if (url.startsWith('PUT ')) {
      let temp = url.substring(4);
      router.put(temp, mapping[url]);
      log.info(`----PUT：${temp}`);
    } else if (url.startsWith('DELETE ')) {
      let temp = url.substring(7);
      router.delete(temp, mapping[url]);
      log.info(`----DELETE: ${temp}`);
    } else {
      log.info(`xxxxx无效路径：${url}`);
    }
  }
}

function addControllers(router, filePath) {
  let files = fs.readdirSync(filePath).filter(item => item.endsWith('.js'));
  for (let index in files) {
    let element = files[index];
    let temp = path.join(filePath, element);
    let state = fs.statSync(temp);
    if (state.isDirectory()) {
      addControllers(router, temp);
    } else {
      if (!temp.endsWith('Helper.js')) {
        log.info('\n--开始处理: ' + element + '路由');
        addMapping(router, temp);
      }
    }
  }
}

export default function engine(router, folder) {
  addControllers(router, folder);
  return router.routes();
}
