class ErrorHelper {
    /**
     * 返回一个自定义错误
     * @param {String} message 
     * @param {Number} status 
     */
    static newError(message, status) {
        return getError(message, status);
    }

    static Error403(message){
        return getError(message,403);
    }
	static Error404(message){
        return getError(message,404);
    }
    static Error406(message){
        return getError(message,406);
    }
    static Error400(message){
        return getError(message,400);
    }

}

let getError = (message, status) => {
    let error = new Error(message);
    error['status'] = status;
    return error;
}

export default ErrorHelper;