import * as path from "std/path/mod.ts";
import { Application } from "oak";
import { Router } from "oak/router";
import { send } from "oak/send";
import RouterMW from "./middleware/controllerEngine.ts";
import * as log from "std/log/mod.ts";
import config from "./config.ts";
import handleError from "./middleware/handleError.ts";
import SqliteUtil from "./util/SqliteHelper.ts";
import * as i18n from "./i18n/index.ts";
import ProcesHelper from "./util/ProcesHelper.ts";

const isDesktop = config.env == "desktop";
const start = Date.now();
log.info(JSON.stringify(config));

const app = new Application();

const router = new Router({
  prefix: config.urlPrefix,
});

// 静态文件服务 - 优先从 static 目录提供文件
app.use(async (ctx, next) => {
  const url = ctx.request.url.pathname;
  // 移除开头的斜杠，得到文件路径
  const filePath = url === "/" ? "index.html" : url.replace(/^\//, "");

  try {
    await send(ctx, filePath, {
      root: path.join(config.rootPath, "static"),
    });
  } catch {
    // 文件不存在，继续执行后续中间件（如 API 路由）
    await next();
  }
});

// 错误处理（包含 token 校验）
app.use(handleError);

// 注册路由
app.use(RouterMW(router));

// 初始化
const pidPath = path.join(config.dataPath, "pid");

try {
  await Deno.stat(config.dataPath);
} catch {
  await Deno.mkdir(config.dataPath, { recursive: true });
}

//尝试杀死历史进程
try {
  if (isDesktop) {
    const pidContent = await Deno.readTextFile(pidPath);
    const pid = parseInt(pidContent);
    ProcesHelper.kill(pid);
  }
} catch {
  // 文件不存在，忽略
}

await SqliteUtil.createPool();
i18n.init();

app.listen({
  port: config.port,
  hostname: "0.0.0.0",
});

log.info(`server listened ${config.port},cost:${Date.now() - start}ms`);

// 写启动端口
await Deno.writeTextFile(
  path.join(config.dataPath, "port"),
  config.port.toString(),
);

// 写进程号
await Deno.writeTextFile(pidPath, Deno.pid.toString());

// 如果为桌面环境，打开浏览器
if (isDesktop) {
  log.info(
    "如果未自动打开浏览器，可手动访问 http://localhost:" + config.port,
  );
  openBrowser(`http://localhost:${config.port}`);
}

app.addEventListener("error", (event) => {
  log.error("应用程序错误:", event);
});

function openBrowser(url: string) {
  const cmd = config.isWindows
    ? ["explorer", url]
    : config.isMac
    ? ["open", url]
    : ["xdg-open", url];

  new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdin: "null",
    stdout: "null",
    stderr: "null",
  }).spawn();
}
