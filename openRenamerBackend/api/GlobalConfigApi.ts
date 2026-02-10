import { Context } from "oak";
import service from "../service/GlobalConfigService.ts";
import type { RouterDefinition } from "./types.ts";

const router: RouterDefinition = {};

/**
 * 获取单个配置
 */
router["GET /config/code"] = async function (ctx: Context) {
    const params = ctx.request.url.searchParams;
    ctx.response.body = await service.getVal(params.get("code") as string);
};

/**
 * 获取多个配置项
 */
router["POST /config/multCode"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    ctx.response.body = await service.getMultVal(body);
};

/**
 * 提交修改
 */
router["POST /config/update"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    await service.updateVal(body.code, body.val);
    ctx.response.body = { success: true };
};

/**
 * 插入或更新
 */
router["POST /config/insertOrUpdate"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    await service.insertOrReplace(body);
    ctx.response.body = { success: true };
};

export default router;
