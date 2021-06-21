import { Context } from "koa";

const router = {};

router["GET /plan"] = async function (ctx: Context) {
    ctx.body = "asdfasd";
};

router["PUT /plan"] = async function (ctx: Context) {
    ctx.body = "asdfasdf";
};

router["DELETE /plan/:planId"] = async function (ctx: Context) {
    ctx.body = "";
}

export default router;
