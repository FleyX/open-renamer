import { Context } from "oak";
import AutoPlanService from "../service/AutoPlanService.ts";
import type { RouterDefinition } from "./types.ts";

const router: RouterDefinition = {};

/**
 * 保存自动计划配置
 */
router["POST /autoPlan/save"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    await AutoPlanService.saveAutoConfig(body);
    ctx.response.body = { success: true };
};

export default router;
