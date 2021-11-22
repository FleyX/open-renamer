import log from '../util/LogUtil';

let f = async (ctx, next) => {
	try {
		await next();
	} catch (error: any) {
		if (error.status != undefined) {
			ctx.status = error.status;
		} else {
			ctx.status = 500;
		}
		ctx.body = error.message;
		log.error(error);
	}
}

export default f;