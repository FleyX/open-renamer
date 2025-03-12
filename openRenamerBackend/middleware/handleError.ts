import log from '../util/LogUtil';
import config from "../config";
import {getMessage} from "../i18n";

let f = async (ctx, next) => {
    let lang = ctx.request.headers['lang'];
    try {
        //检查是否有密码
        if (checkToken(ctx)) {
            await next();
        } else {
            ctx.status = 401;
            ctx.body = getMessage(lang, "key-error");
        }
    } catch (error: any) {
        if (error.status != undefined) {
            ctx.status = error.status;
        } else {
            ctx.status = 500;
        }
        ctx.body = getMessage(lang, error.message);
        log.error(error);
    }
}

function checkToken(ctx) {
    if (!config.token) {
        return true;
    }
    let requestPath = ctx.method + ctx.path.replace(config.urlPrefix, "");
    if (config.publicPath.has(requestPath)) {
        return true;
    }
    return config.token == ctx.headers.token;

}

export default f;