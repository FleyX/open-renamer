import { Context } from "oak";
import service from "../service/QbService.ts";
import type { RouterDefinition } from "./types.ts";

const router: RouterDefinition = {};

/**
 * 保存qb配置
 */
router["POST /qb/saveQbInfo"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    ctx.response.body = await service.saveAddress(body);
};

/**
 * 获取qb配置
 */
router["GET /qb/config"] = async function (ctx: Context) {
    await Promise.resolve();
    ctx.response.body = await service.getConfig();
};

/**
 * 获取bt列表
 */
router["GET /qb/bt/list"] = async function (ctx: Context) {
    ctx.response.body = await service.getBtList();
};

export default router;
