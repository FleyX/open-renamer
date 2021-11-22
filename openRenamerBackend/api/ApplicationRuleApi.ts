import { Context } from "koa";
import ApplicationRuleService from "../service/ApplicationRuleService";
import config from "../config";

const router = {};

/**
 * 获取目录下的文件列表 
 */
router["GET /applicationRule"] = async function (ctx: Context) {
	ctx.body = await ApplicationRuleService.getAll();
};

/**
 * 更新或者插入
 */
router['POST /applicationRule'] = async function (ctx: Context) {
	ctx.body = await ApplicationRuleService.saveOrAdd(ctx.request.body);
}

/**
 * 删除
 */
router["DELETE /applicationRule/:id"] = async function (ctx: Context) {
	await ApplicationRuleService.deleteById(ctx.params.id);
	ctx.body = "";
};

export default router;
