import { Context } from "oak";
import ApplicationRuleService from "../service/ApplicationRuleService.ts";
import type { RouterDefinition } from "./types.ts";

const router: RouterDefinition = {};

/**
 * 获取所有规则模板
 */
router["GET /applicationRule"] = async function (ctx: Context) {
    ctx.response.body = await ApplicationRuleService.getAll();
};

/**
 * 获取默认模板
 */
router["GET /applicationRule/default"] = async function (ctx: Context) {
    ctx.response.body = await ApplicationRuleService.getDefault();
};

/**
 * 更新或者插入
 */
router['POST /applicationRule'] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    ctx.response.body = await ApplicationRuleService.saveOrAdd(body);
};

/**
 * 删除
 */
router["DELETE /applicationRule/:id"] = async function (ctx: Context) {
    const params = (ctx as Context & { params: { id: string } }).params;
    await ApplicationRuleService.deleteById(parseInt(params.id));
    ctx.response.body = "";
};

export default router;
