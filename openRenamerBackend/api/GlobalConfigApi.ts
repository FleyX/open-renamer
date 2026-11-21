import service from "../service/GlobalConfigService.ts";
import type GlobalConfig from "../entity/po/GlobalConfig.ts";
import type { RouterDefinition } from "./types.ts";

const router: RouterDefinition = {};

/**
 * 获取单个配置
 */
router["GET /config/code"] = async function ({ request, response }) {
  response.body = await service.getVal(
    request.url.searchParams.get("code") as string,
  );
};

/**
 * 获取多个配置项
 */
router["POST /config/multCode"] = async function ({ request, response }) {
  const body = request.body as Array<string>;
  response.body = await service.getMultVal(body);
};

/**
 * 提交修改
 */
router["POST /config/update"] = async function ({ request, response }) {
  const body = request.body as { code: string; val: string };
  await service.updateVal(body.code, body.val);
  response.body = { success: true };
};

/**
 * 插入或更新
 */
router["POST /config/insertOrUpdate"] = async function ({
  request,
  response,
}) {
  const body = request.body as GlobalConfig;
  await service.insertOrReplace(body);
  response.body = { success: true };
};

export default router;
