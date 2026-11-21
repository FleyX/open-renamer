import { Context } from "oak";
import config from "../config.ts";
import type { OakRouterDefinition } from "./oakTypes.ts";

const router: OakRouterDefinition = {};

/**
 * 判断token是否正确
 */
router["POST /public/checkToken"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    ctx.response.body = body.token === config.token;
};

export default router;
