class ErrorHelper {
    static newError(message: string, status: number): Error {
        return getError(message, status);
    }

    static Error403(message: string): Error {
        return getError(message, 403);
    }

    static Error404(message: string): Error {
        return getError(message, 404);
    }

    static Error406(message: string): Error {
        return getError(message, 406);
    }

    static Error400(message: string): Error {
        return getError(message, 400);
    }
}

function getError(message: string, status: number): Error {
    const error = new Error(message);
    (error as Error & { status: number }).status = status;
    return error;
}

export default ErrorHelper;
