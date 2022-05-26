import log from '../util/LogUtil';
import config from "../config";

let f = async (ctx, next) => {
	try {
		//检查是否有密码
		if (checkToken(ctx)) {
			await next();
		} else {
			ctx.status = 401;
			ctx.body = "密钥验证错误";
		}
	} catch (error: any) {
		if (error.status != undefined) {
			ctx.status = error.status;
		} else {
			ctx.status = 500;
		}
		ctx.body = error.message;
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