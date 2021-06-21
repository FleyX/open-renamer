import { Context } from "koa";
import FileService from "../service/FileService";

const router = {};

router["GET /file/query"] = async function (ctx: Context) {
    ctx.body = FileService.readPath(ctx.query.path as string);
};

router["PUT /plan"] = async function (ctx: Context) {
    ctx.body = "asdfasdf";
};

router["DELETE /plan/:planId"] = async function (ctx: Context) {
    ctx.body = "";
}

export default router;
