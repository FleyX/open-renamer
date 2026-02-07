import { Context } from "oak";
import AutoPlanService from "../service/AutoPlanService.ts";

const router = {};

/**
 * 获取目录下的文件列表 
 */
router["POST /autoPlan/save"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    ctx.body = await AutoPlanService.saveAutoConfig(body);
};


export default router;
