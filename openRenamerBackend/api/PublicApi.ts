import { Context } from "oak";
import config from "../config.ts";
import type { RouterDefinition } from "./types.ts";

const router: RouterDefinition = {};

/**
 * 判断token是否正确
 */
router["POST /public/checkToken"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    ctx.response.body = body.token === config.token;
};

export default router;
