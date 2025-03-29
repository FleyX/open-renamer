import * as path from 'path';
import * as process from "process";
import {getPort} from './util/NetUtil';

//后台所在绝对路径
const rootPath = path.resolve(__dirname, '..');
let map = {};
console.log(process.argv);
//argv 传递 port，dataPath,env,token
for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] != null && process.argv[i] != '') {
        let strings = process.argv[i].split(":");
        map[strings[0]] = strings[1];
    }
}
//dev,prod,desktop
let env = map['env'] ? map['env'] : process.env.ENV ? process.env.ENV : "dev";
let basePort = map['port'] ? parseInt(map['port']) : process.env.PORT ? parseInt(process.env.PORT) : 8089;

let config = {
    rootPath,
    dataPath: map['dataPath'] ? map['dataPath'] : process.env.DATA_PATH ? process.env.DATA_PATH : path.join(rootPath, 'data'),
    port: env == 'desktop' ? getPort(20000, 50000) : basePort,
    token: map['token'] ? map['token'] : process.env.TOKEN ? process.env.TOKEN : null,
    env,
    urlPrefix: '/openRenamer/api',
    //是否为windows平台
    isWindows: process.platform.toLocaleLowerCase().includes("win32"),
    isMac: process.platform.toLocaleLowerCase().includes("darwin"),
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
