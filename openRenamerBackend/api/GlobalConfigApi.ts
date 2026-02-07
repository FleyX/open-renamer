import { Context } from "oak";
import service from "../service/GlobalConfigService.ts";

const router = {};

/**
 * 获取单个配置
 */
router["GET /config/code"] = async function (ctx: Context) {
    const url = ctx.request.url;
    const params = url.searchParams;
	ctx.body = await service.getVal(params.get("code") as string);
};

/**
 * 获取多个配置项
 */
router["POST /config/multCode"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
	ctx.body = await service.getMultVal(body);
};

/**
 * 提交修改
 */
router["POST /config/update"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
	ctx.body = await service.updateVal(body.code, body.val);
};

/**
 * 提交修改
 */
router["POST /config/insertOrUpdate"] = async function (ctx: Context) {
	ctx.body = await service.insertOrReplace(ctx.request.body);
};



export default router;
