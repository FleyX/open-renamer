import { Context } from "koa";
import AutoPlanService from "../service/AutoPlanService";

const router = {};

/**
 * 获取目录下的文件列表 
 */
router["POST /autoPlan/save"] = async function (ctx: Context) {
    ctx.body = await AutoPlanService.saveAutoConfig(ctx.request.body);
};


export default router;
