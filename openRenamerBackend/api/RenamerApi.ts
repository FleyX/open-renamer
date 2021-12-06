import { Context } from "koa";
import RenamerService from "../service/RenamerService";

const router = {};

/**
 * 预览文件修改后的状态 
 */
router["POST /renamer/preview"] = async function (ctx: Context) {
	ctx.body = await RenamerService.preview(ctx.request.body.fileList, ctx.request.body.ruleList);
};

/**
 * 提交修改
 */
router["POST /renamer/submit"] = async function (ctx: Context) {
	ctx.body = await RenamerService.rename(ctx.request.body.fileList, ctx.request.body.changedFileList);
};



export default router;
