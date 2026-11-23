import AiRenameService from "../service/AiRenameService.ts";
import type AiGenerateDto from "../entity/dto/AiGenerateDto.ts";
import type AiPreviewEditDto from "../entity/dto/AiPreviewEditDto.ts";
import type AiRetryDto from "../entity/dto/AiRetryDto.ts";
import type AiSubmitDto from "../entity/dto/AiSubmitDto.ts";
import type { RouterDefinition } from "./types.ts";

export type MessageLookup = (lang: string, key: string) => string;

export default function createAiRenameRoutes(
  getMessage: MessageLookup,
): RouterDefinition {
  // 批次存储按服务实例隔离
  const service = new AiRenameService();
  const router: RouterDefinition = {};

  /**
   * 生成 AI 命名预览
   */
  router["POST /aiRename/generate"] = async function ({ request, response }) {
    const lang = request.headers.get("lang") ?? "";
    response.body = await service.generate(
      request.body as AiGenerateDto,
      (key) => getMessage(lang, key),
    );
  };

  /**
   * 编辑预览后重新校验（不请求模型）
   */
  router["POST /aiRename/preview/validate"] = async function ({
    request,
    response,
  }) {
    const lang = request.headers.get("lang") ?? "";
    response.body = await service.validatePreview(
      request.body as AiPreviewEditDto,
      (key) => getMessage(lang, key),
    );
  };

  /**
   * 重试生成失败的条目，保留其余行的已确认映射
   */
  router["POST /aiRename/retry"] = async function ({ request, response }) {
    const lang = request.headers.get("lang") ?? "";
    response.body = await service.retry(
      request.body as AiRetryDto,
      (key) => getMessage(lang, key),
    );
  };

  /**
   * 提交整批确认过的映射，执行同盘移动
   */
  router["POST /aiRename/submit"] = async function ({ request, response }) {
    const lang = request.headers.get("lang") ?? "";
    response.body = await service.submit(
      request.body as AiSubmitDto,
      (key) => getMessage(lang, key),
    );
  };

  return router;
}
