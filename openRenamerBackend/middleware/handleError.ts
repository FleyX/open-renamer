import Logger from "../util/Logger.ts";
import config from "../config.ts";
import { getCtxMessage } from "../i18n/index.ts";
import { Context, Next } from "oak";

export default async function handleError(ctx: Context, next: Next) {
  try {
    if (checkToken(ctx)) {
      await next();
    } else {
      ctx.response.status = 401;
      ctx.response.body = getCtxMessage(ctx, "key-error");
    }
  } catch (error) {
    const err = error as Error & { status?: number };
    if (err.status != undefined) {
      ctx.response.status = err.status;
    } else {
      ctx.response.status = 500;
    }
    ctx.response.body = getCtxMessage(ctx, err.message);
    Logger.error("请求处理出错: {},{}", err.message, err.stack);
  }
}

function checkToken(ctx: Context): boolean {
  if (!config.token) {
    return true;
  }

  const pathname = ctx.request.url.pathname;
  
  // 静态文件请求不需要 token 校验
  // 根路径和没有前缀的路径（如 /index.html, /js/app.js）都视为静态文件请求
  if (pathname === "/" || !pathname.startsWith(config.urlPrefix)) {
    return true;
  }

  const requestPath = ctx.request.method + pathname.replace(config.urlPrefix, "");
  if (config.publicPath.has(requestPath)) {
    return true;
  }

  return config.token == ctx.request.headers.get("token");
}
