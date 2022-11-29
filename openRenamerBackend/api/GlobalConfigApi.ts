import { Context } from "koa";
import service from "../service/GlobalService";

const router = {};

/**
 * 预览文件修改后的状态 
 */
router["GET /config/code"] = async function (ctx: Context) {
	ctx.body = await service.getVal(ctx.request.query.code as string);
};

/**
 * 提交修改
 */
router["POST /config/update"] = async function (ctx: Context) {
	ctx.body = await service.updateVal(ctx.request.body.code, ctx.request.body.val);
};



export default router;
