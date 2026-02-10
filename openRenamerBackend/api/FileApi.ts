import { Context } from "oak";
import FileService from "../service/FileService.ts";
import FileObj from "../entity/vo/FileObj.ts";
import config from "../config.ts";
import type { RouterDefinition } from "./types.ts";

const router: RouterDefinition = {};

/**
 * 获取目录下的文件列表
 */
router["GET /file/query"] = async function (ctx: Context) {
    const params = ctx.request.url.searchParams;
    ctx.response.body = await FileService.readPath(params.get("path") as string, params.get("showHidden") === '1');
};

/**
 * 递归读取文件夹下所有的文件
 */
router["POST /file/recursionQuery"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    ctx.response.body = await FileService.readRecursion(body);
};

/**
 * 是否windows
 */
router['GET /file/isWindows'] = async function (ctx: Context) {
    await Promise.resolve();
    ctx.response.body = config.isWindows;
};

/**
 * 检查路径是否存在
 */
router["GET /file/path/exist"] = async function (ctx: Context) {
    const params = ctx.request.url.searchParams;
    ctx.response.body = await FileService.checkExist(params.get("path") as string);
};

/**
 * 收藏路径
 */
router["POST /file/path/save"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    ctx.response.body = await FileService.savePath(body);
};

/**
 * 获取收藏路径
 */
router["GET /file/path"] = async function (ctx: Context) {
    ctx.response.body = await FileService.getSaveList();
};

/**
 * 删除收藏路径
 */
router["DELETE /file/path/delete"] = async function (ctx: Context) {
    const params = ctx.request.url.searchParams;
    await FileService.deleteOne(parseInt(params.get("id") as string));
    ctx.response.body = "";
};

/**
 * 批量删除文件
 */
router["POST /file/deleteBatch"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    await FileService.deleteBatch(body as Array<FileObj>);
    ctx.response.body = "";
};

/**
 * 重命名文件
 */
router["POST /file/rename"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
    await FileService.rename(body.source, body.target);
    ctx.response.body = "";
};

export default router;
