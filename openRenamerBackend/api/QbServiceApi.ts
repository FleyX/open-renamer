import {Context} from "koa";
import service from "../service/QbService";

const router = {};

/**
 * 获取单个配置
 */
router["POST /qb/saveQbInfo"] = async function (ctx: Context) {
    ctx.body = await service.saveAddress(ctx.request.body);
};

/**
 * 获取qb配置
 */
router["GET /qb/config"] = async function (ctx: Context) {
    ctx.body = await service.getAddress();
};

/**
 * 获取qb配置
 */
router["GET /qb/bt/list"] = async function (ctx: Context) {
    ctx.body = await service.getAddress();
};


export default router;
