import { Context } from "oak";
import RenamerService from "../service/RenamerService.ts";

const router = {};

/**
 * 预览文件修改后的状态 
 */
router["POST /renamer/preview"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
	ctx.body = await RenamerService.preview(body.fileList, body.ruleList);
};

/**
 * 提交修改
 */
router["POST /renamer/submit"] = async function (ctx: Context) {
    const body = await ctx.request.body().value;
	ctx.body = await RenamerService.rename(body.fileList, body.changedFileList);
};



export default router;
