/// <reference lib="deno.ns" />
import * as path from 'std/path/mod.ts';
import {Application} from "oak";
import {Router} from "oak/router";
import {send} from "oak/send";
import RouterMW from "./middleware/controllerEngine.ts";

// 导入Deno标准库日志模块
import * as log from 'std/log/mod.ts';

import config from "./config.ts";
import handleError from "./middleware/handleError.ts";
import SqliteUtil from './util/SqliteHelper.ts';
import qbService from "./service/QbService.ts";
import * as i18n from './i18n/index.ts';
import ProcesHelper from "./util/ProcesHelper.ts";

// 配置Deno日志
log.setup({
    handlers: {
        console: new log.handlers.ConsoleHandler("DEBUG", {
            formatter: "[{levelName}] {msg}",
        }),
    },
    loggers: {
        default: {
            level: "DEBUG",
            handlers: ["console"],
        },
    },
});

const start = Date.now();
log.info(JSON.stringify(config));

const app = new Application();

const router = new Router({
    prefix: config.urlPrefix
});

// 静态文件服务
app.use(async (ctx, next) => {
    const url = ctx.request.url.pathname;
    if (url.startsWith('/static/')) {
        const fileUrl = url.replace('/static/', '');
        try {
            await send(ctx, fileUrl, {
                root: path.join(config.rootPath, 'static')
            });
        } catch {
            await next();
        }
    } else {
        await next();
    }
});

// 表单解析 - 在 Oak v12 中，请求体解析由 ctx.request.body() 处理
// 不再需要单独的 bodyParser 中间件

// 错误处理
app.use(handleError);

// 异步注册路由，直接处理 api/ 目录下的 .ts 文件
app.use(await RouterMW(router, path.join(config.rootPath, "openRenamerBackend/api")));

(async () => {
    const pidPath = path.join(config.dataPath, 'pid');
    // 检查目录是否存在，不存在则创建
    try {
        await Deno.stat(config.dataPath);
    } catch {
        await Deno.mkdir(config.dataPath, { recursive: true });
    }
    
    // 尝试杀死历史进程
    try {
        const pidContent = await Deno.readTextFile(pidPath);
        const pid = parseInt(pidContent);
        ProcesHelper.kill(pid);
    } catch {
        // 文件不存在，忽略错误
    }
    
    await SqliteUtil.createPool();
    await qbService.init();
    i18n.init();
    
    await app.listen({
        port: config.port,
        hostname: "0.0.0.0"
    });
    
    log.info(`server listened ${config.port},cost:${Date.now() - start}ms`);
    
    // 写启动端口
    await Deno.writeTextFile(path.join(config.dataPath, 'port'), config.port.toString());
    
    // 写进程号
    await Deno.writeTextFile(pidPath, Deno.pid.toString());
    
    // 如果为桌面环境，打开浏览器
    if (config.env == 'desktop') {
        openBrowser(`http://localhost:${config.port}`);
    }
})();

app.addEventListener("error", (event) => {
    // Oak v12 中，错误事件直接包含错误对象
    log.error("应用程序错误:", event);
});

// 使用 Deno.Command 替代 execSync
function openBrowser(url: string) {
    const cmd = config.isWindows 
        ? ['cmd.exe', '/c', `start "" "${url}"`]
        : config.isMac 
            ? ['open', url]
            : ['xdg-open', url];
    
    new Deno.Command(cmd[0], {
        args: cmd.slice(1),
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
    }).spawn();
}
