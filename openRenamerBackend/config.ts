import * as path from 'std/path/mod.ts';
import {getPort} from './util/NetUtil.ts';
import * as logger from 'std/log/mod.ts';

// 使用 import.meta.url 获取当前文件路径
const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

//后台所在绝对路径
const rootPath = path.resolve(__dirname, '..');
let map = {};
logger.info(Deno.args);
//argv 传递 port，dataPath,env,token
for (let i = 0; i < Deno.args.length; i++) {
    if (Deno.args[i] != null && Deno.args[i] != '') {
        let strings = Deno.args[i].split(":");
        map[strings[0]] = strings[1];
    }
}
//dev,prod,desktop
let env = map['env'] ? map['env'] : Deno.env.get('ENV') ? Deno.env.get('ENV') : "dev";
let basePort = map['port'] ? parseInt(map['port']) : Deno.env.get('PORT') ? parseInt(Deno.env.get('PORT')) : 8089;

let config = {
    rootPath,
    dataPath: map['dataPath'] ? map['dataPath'] : Deno.env.get('DATA_PATH') ? Deno.env.get('DATA_PATH') :
        env == 'desktop' ? path.join(Deno.execPath(), "..", 'data') : path.join(rootPath, 'data'),
    port: env == 'desktop' ? getPort(20000, 50000) : basePort,
    token: map['token'] ? map['token'] : Deno.env.get('TOKEN') ? Deno.env.get('TOKEN') : null,
    env,
    urlPrefix: '/openRenamer/api',
    //是否为windows平台
    isWindows: Deno.build.os === "windows",
    isMac: Deno.build.os === "darwin",
    bodyLimit: {
        formLimit: '200mb',
        jsonLimit: '200mb',
        urlencoded: true,
        multipart: true,
        formidable: {
            uploadDir: path.join(rootPath, 'files', 'temp', 'uploads'),
            keepExtenstions: true,
            maxFieldsSize: 1024 * 1024 * 200
        }
    },
    publicPath: new Set(["POST/public/checkToken"])
};

export default config;