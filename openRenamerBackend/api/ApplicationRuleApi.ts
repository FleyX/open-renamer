import ApplicationRuleService from "../service/ApplicationRuleService.ts";
import type ApplicationRule from "../entity/po/ApplicationRule.ts";
import type { RouterDefinition } from "./types.ts";

const router: RouterDefinition = {};

/**
 * 获取所有规则模板
 */
router["GET /applicationRule"] = async function ({ response }) {
  response.body = await ApplicationRuleService.getAll();
};

/**
 * 获取默认模板
 */
router["GET /applicationRule/default"] = async function ({ response }) {
  response.body = await ApplicationRuleService.getDefault();
};

/**
 * 更新或者插入
 */
router["POST /applicationRule"] = async function ({ request, response }) {
  const body = request.body as ApplicationRule;
  response.body = await ApplicationRuleService.saveOrAdd(body);
};

/**
 * 删除
 */
router["DELETE /applicationRule/:id"] = async function ({
  request,
  response,
}) {
  await ApplicationRuleService.deleteById(parseInt(request.params.id));
  response.body = "";
};

export default router;
