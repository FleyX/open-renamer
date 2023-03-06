import {Context} from "koa";
import FileService from "../service/FileService";
import config from "../config";

const router = {};

/**
 * 获取目录下的文件列表
 */
router["GET /file/query"] = async function (ctx: Context) {
    ctx.body = await FileService.readPath(ctx.query.path as string, ctx.query.showHidden === '1');
};

/**
 * 递归读取文件夹下所有的文件
 */
router["POST /file/recursionQuery"] = async function (ctx: Context) {
    ctx.body = await FileService.readRecursion(ctx.request.body);
};

/**
 *是否windows
 */
router['GET /file/isWindows'] = async function (ctx: Context) {
    ctx.body = config.isWindows;
}

/**
 * 检查路径是否存在
 */
router["GET /file/path/exist"] = async function (ctx: Context) {
    ctx.body = await FileService.checkExist(ctx.query.path as string);
};

/**
 * 收藏路径
 */
router["POST /file/path/save"] = async function (ctx: Context) {
    ctx.body = await FileService.savePath(ctx.request.body);
};

/**
 * 获取收藏路径
 */
router["GET /file/path"] = async function (ctx: Context) {
    ctx.body = await FileService.getSaveList();
};

/**
 * 获取收藏路径
 */
router["DELETE /file/path/delete"] = async function (ctx: Context) {
    ctx.body = await FileService.deleteOne(ctx.query.id);
};

/**
 * delete file batch
 */
router["POST /file/deleteBatch"] = async function (ctx: Context) {
    ctx.body = await FileService.deleteBatch(ctx.request.body);
};

/**
 * rename file
 */
router["POST /file/rename"] = async function (ctx: Context) {
    await FileService.rename(ctx.request.body.source, ctx.request.body.target);
    ctx.body = "";
};

export default router;
