import config from '../config';
import ObjectHelper from '../util/ObjectOperate';

let doSuccess = (ctx, body) => {
    switch (ctx.method) {
        case 'GET':
            ctx.status = body !== null ? 200 : 204;
            ctx.body = body;
            break;
        case 'POST':
            ctx.status = body !== null ? 201 : 204;
            ctx.body = body;
            break;
        case 'PUT':
            ctx.status = body !== null ? 200 : 204;
            ctx.body = body;
            break;
        case 'DELETE':
            ctx.status = body !== null ? 200 : 204;
            ctx.body = body;
            break;
    }
    Object.assign(ctx.allParams, ctx.params);
}

export default async (ctx, next) => {
    //跨域
    ctx.set("Access-Control-Allow-Origin", "*");
    ctx.set("Access-Control-Allow-Headers", "X-Requested-With");
    ctx.set("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    ctx.set("X-Powered-By", ' 3.2.1');
    ctx.set("Content-Type", "application/json;charset=utf-8");
    //合并请求参数到allParams
    let objs = [];
    if (ctx.method == "POST" || ctx.method == "PUT") {
        if (ctx.request.body) {
            if (ctx.request.body.fields != undefined && ctx.request.body.files != undefined) {
                objs.push(ctx.request.body.fields, ctx.request.body.files);
            } else {
                objs.push(ctx.request.body);
            }
        }
    }
    objs.push(ctx.query);
    ctx.allParams = ObjectHelper.combineObject(objs);

    ctx.onSuccess = function (body = null) {
        doSuccess(ctx, body);
    };
    await next();
}