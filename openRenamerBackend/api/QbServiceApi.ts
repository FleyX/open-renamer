import {Context} from "oak";
import service from "../service/QbService.ts";

const router = {};

/**
 * 获取单个配置
 */
router["POST /qb/saveQbInfo"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    ctx.body = await service.saveAddress(body);
};

/**
 * 获取qb配置
 */
router["GET /qb/config"] = async function (ctx: Context) {
    ctx.body = await service.getConfig();
};

/**
 * 获取qb配置
 */
router["GET /qb/bt/list"] = async function (ctx: Context) {
    ctx.body = await service.getBtList();
};


export default router;
