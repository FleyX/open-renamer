// 导入Deno标准库日志模块
import * as log from 'std/log/mod.ts';
import config from "../config.ts";
import {getMessage} from "../i18n/index.ts";

// Oak 中间件，处理错误和身份验证
let f = async (ctx, next) => {
    // 在 Oak 中，headers 是一个 Headers 对象，使用 get() 方法获取
    let lang = ctx.request.headers.get('lang');
    try {
        //检查是否有密码
        if (checkToken(ctx)) {
            await next();
        } else {
            ctx.response.status = 401;
            ctx.response.body = getMessage(lang, "key-error");
        }
    } catch (error: any) {
        if (error.status != undefined) {
            ctx.response.status = error.status;
        } else {
            ctx.response.status = 500;
        }
        ctx.response.body = getMessage(lang, error.message);
        log.error(error);
    }
}

function checkToken(ctx) {
    if (!config.token) {
        return true;
    }
    
    // 在 Oak 中，路径和方法的获取方式
    let requestPath = ctx.request.method + ctx.request.url.pathname.replace(config.urlPrefix, "");
    if (config.publicPath.has(requestPath)) {
        return true;
    }
    
    // 在 Oak 中，获取 headers
    return config.token == ctx.request.headers.get('token');
}

export default f;