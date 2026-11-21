import FileService from "../service/FileService.ts";
import type FileObj from "../entity/vo/FileObj.ts";
import type SavePath from "../entity/po/SavePath.ts";
import type { RouterDefinition } from "./types.ts";

export default function createFileRoutes(
  isWindows: () => boolean,
): RouterDefinition {
  const router: RouterDefinition = {};

  /**
   * 获取目录下的文件列表
   */
  router["GET /file/query"] = async function ({ request, response }) {
    const params = request.url.searchParams;
    response.body = await FileService.readPath(
      params.get("path") ?? "",
      params.get("showHidden") === "1",
      isWindows(),
    );
  };

  /**
   * 递归读取文件夹下所有的文件
   */
  router["POST /file/recursionQuery"] = async function ({
    request,
    response,
  }) {
    response.body = await FileService.readRecursion(
      request.body as Array<FileObj>,
    );
  };

  /**
   * 是否windows
   */
  router["GET /file/isWindows"] = async function ({ response }) {
    response.body = isWindows();
  };

  /**
   * 检查路径是否存在
   */
  router["GET /file/path/exist"] = async function ({ request, response }) {
    response.body = await FileService.checkExist(
      request.url.searchParams.get("path") ?? "",
    );
  };

  /**
   * 收藏路径
   */
  router["POST /file/path/save"] = async function ({ request, response }) {
    response.body = await FileService.savePath(request.body as SavePath);
  };

  /**
   * 获取收藏路径
   */
  router["GET /file/path"] = async function ({ response }) {
    response.body = await FileService.getSaveList();
  };

  /**
   * 删除收藏路径
   */
  router["DELETE /file/path/delete"] = async function ({ request, response }) {
    await FileService.deleteOne(
      parseInt(request.url.searchParams.get("id") ?? "", 10),
    );
    response.body = "";
  };

  /**
   * 批量删除文件
   */
  router["POST /file/deleteBatch"] = async function ({ request, response }) {
    await FileService.deleteBatch(request.body as Array<FileObj>);
    response.body = "";
  };

  /**
   * 重命名文件
   */
  router["POST /file/rename"] = async function ({ request, response }) {
    const body = request.body as { source: FileObj; target: FileObj };
    await FileService.rename(body.source, body.target);
    response.body = "";
  };

  return router;
}
