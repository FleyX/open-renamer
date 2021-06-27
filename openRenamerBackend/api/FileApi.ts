import { Context } from "koa";
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
 *是否windows 
 */
router['GET /file/isWindows'] = async function (ctx:Context) {
    ctx.body=config.isWindows;
}

/**
 * 检查路径是否存在 
 */
router["GET /file/path/exist"] = async function (ctx: Context) {
    ctx.body = await FileService.checkExist(ctx.query.path as string);
};

export default router;
