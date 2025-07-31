import fs, {writeFileSync, readFileSync, pathExistsSync} from 'fs-extra';
import koa from "koa";
import Router from "koa-router";
import koaBody from "koa-body";
import * as path from "path";
import RouterMW from "./middleware/controllerEngine";

import config from "./config";
import handleError from "./middleware/handleError";
import SqliteUtil from './util/SqliteHelper';
import log from './util/LogUtil';
import qbService from "./service/QbService";
import * as i18n from './i18n';
import * as process from "process";
import ProcesHelper from "./util/ProcesHelper";
import {execSync} from 'child_process';

let start = Date.now();
console.log(config);

const app = new koa();

let router = new Router({
    prefix: config.urlPrefix
});

app.use(require('koa-static')(path.join(config.rootPath, 'static')));

//表单解析
app.use(koaBody(config.bodyLimit));
//错误处理
app.use(handleError);

app.use(RouterMW(router, path.join(config.rootPath, "dist/api")));
(async () => {
    let pidPath = path.join(config.dataPath, 'pid');
    //尝试杀死历史进程
    if (pathExistsSync(pidPath)) {
        let pid = readFileSync(pidPath, 'utf-8');
        ProcesHelper.kill(parseInt(pid));
    }
    await SqliteUtil.createPool();
    await qbService.init();
    i18n.init();
    app.listen(config.port);
    log.info(`server listened ${config.port},cost:${Date.now() - start}ms`);
    //写启动端口
    writeFileSync(path.join(config.dataPath, 'port'), config.port.toString());
    //写进程号
    writeFileSync(pidPath, process.pid.toString());
    //如果为桌面环境，打开浏览器
    if (config.env == 'desktop') {
        await openBrowser(`http://localhost:${config.port}`);
    }
})();

app.on("error", (error) => {
    console.error(error);
})


async function openBrowser(url: string) {
    execSync(config.isWindows ? `start "" "${url}"` : config.isMac ? `open '${url}'` : `xdg-open ${url}`);
}
