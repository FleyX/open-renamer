import { Context } from "oak";
import config from "../config.ts";

const router = {};

/**
 * 判断token是否正确
 */
(router as Record<string, (ctx: Context) => Promise<void>>)["POST /public/checkToken"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
	ctx.response.body = body.token === config.token;
};

export default router;
