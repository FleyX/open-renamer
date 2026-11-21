import SavePathDao from "../dao/SavePathDao.ts";
import type SavePath from "../entity/po/SavePath.ts";
import type { RouterDefinition } from "./types.ts";

export default function createTemplateFileRoutes(
  isWindows: () => boolean,
): RouterDefinition {
  const router: RouterDefinition = {};

  router["GET /file/isWindows"] = async function ({ response }) {
    response.body = isWindows();
  };

  router["GET /file/path"] = async function ({ response }) {
    response.body = SavePathDao.getAll();
  };

  router["POST /file/path/save"] = async function ({ request, response }) {
    const savePath = request.body as SavePath;
    await SavePathDao.addOne(savePath);
    response.body = savePath;
  };

  router["DELETE /file/path/delete"] = async function ({
    request,
    response,
  }) {
    await SavePathDao.delete(
      parseInt(request.url.searchParams.get("id") as string),
    );
    response.body = "";
  };

  return router;
}
