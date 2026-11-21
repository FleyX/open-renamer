import RenamerService from "../service/RenamerService.ts";
import type PreviewDto from "../entity/dto/PreviewDto.ts";
import type RenameDto from "../entity/dto/RenameDto.ts";
import type { RouterDefinition } from "./types.ts";

export type MessageLookup = (lang: string, key: string) => string;

export default function createRenamerRoutes(
  getMessage: MessageLookup,
): RouterDefinition {
  const router: RouterDefinition = {};

  /**
   * 预览文件修改后的状态
   */
  router["POST /renamer/preview"] = async function ({ request, response }) {
    const lang = request.headers.get("lang") ?? "";
    response.body = RenamerService.preview(
      request.body as PreviewDto,
      (key) => getMessage(lang, key),
    );
  };

  /**
   * 提交修改
   */
  router["POST /renamer/submit"] = async function ({ request, response }) {
    const lang = request.headers.get("lang") ?? "";
    await RenamerService.rename(
      request.body as RenameDto,
      (key) => getMessage(lang, key),
    );
    response.body = { success: true };
  };

  return router;
}
