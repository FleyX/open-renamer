import { Context } from "oak";
import ApplicationRuleService from "../service/ApplicationRuleService.ts";

// 为router添加类型定义
interface RouterDefinition {
    [key: string]: (ctx: Context) => Promise<void>;
}

const router: RouterDefinition = {};

/**
 * 获取目录下的文件列表 
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
}

/**
 * 删除
 */
router["DELETE /applicationRule/:id"] = async function (ctx: Context) {
	// 在Oak v12中，路由参数通过ctx.params获取
	// 我们使用类型断言来解决类型问题
	// 将字符串id转换为数字，因为deleteById方法可能期望数字类型
	const params = ctx as Context<Record<string, never>, Record<string, never>> & { params: { id: string } };
	await ApplicationRuleService.deleteById(parseInt(params.params.id));
	ctx.response.body = "";
};



export default router;
