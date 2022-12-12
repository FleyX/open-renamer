import { Context } from "koa";
import service from "../service/GlobalConfigService";

const router = {};

/**
 * 获取单个配置
 */
router["GET /config/code"] = async function (ctx: Context) {
	ctx.body = await service.getVal(ctx.request.query.code as string);
};

/**
 * 获取多个配置项
 */
router["POST /config/multCode"] = async function (ctx: Context) {
	ctx.body = await service.getMultVal(ctx.request.body);
};

/**
 * 提交修改
 */
router["POST /config/update"] = async function (ctx: Context) {
	ctx.body = await service.updateVal(ctx.request.body.code, ctx.request.body.val);
};



export default router;
