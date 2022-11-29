import { Context } from "koa";
import ApplicationRuleService from "../service/ApplicationRuleService";

const router = {};

/**
 * 获取目录下的文件列表 
 */
router["GET /applicationRule"] = async function (ctx: Context) {
	ctx.body = await ApplicationRuleService.getAll();
};

/**
 * 获取默认模板
 */
router["GET /applicationRule/default"] = async function (ctx: Context) {
	;
	ctx.body = await ApplicationRuleService.getDefault();
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
