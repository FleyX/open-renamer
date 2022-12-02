import { Context } from "koa";
import service from "../service/QbService";

const router = {};

/**
 * 获取单个配置
 */
router["POST /qb/saveQbInfo"] = async function (ctx: Context) {
	ctx.body = await service.saveAddress(ctx.request.body);
};


export default router;
