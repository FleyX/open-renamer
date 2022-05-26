import { Context } from "koa";
import config from "../config";

const router = {};

/**
 * 判断token是否正确
 */
router["POST /public/checkToken"] = async function (ctx: Context) {
	ctx.body = ctx.request.body.token === config.token;
};

export default router;
