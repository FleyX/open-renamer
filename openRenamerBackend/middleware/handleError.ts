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

  const requestPath = ctx.request.method +
    ctx.request.url.pathname.replace(config.urlPrefix, "");
  if (config.publicPath.has(requestPath)) {
    return true;
  }

  return config.token == ctx.request.headers.get("token");
}
