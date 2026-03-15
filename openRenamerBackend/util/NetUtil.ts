import * as logger from 'std/log/mod.ts';

export function getPort(start: number, end: number): number {
    let count = 100;
    while (count-- > 0) {
        const num = Math.floor(Math.random() * (end - start + 1) + start);
        if (checkFree(num)) {
            return num;
        }
    }
    throw new Error("无可用端口");
}

export function checkFree(port: number): boolean {
    try {
        const listener = Deno.listen({ port, hostname: "0.0.0.0" });
        listener.close();
        return true;
    } catch (e) {
        logger.debug(`端口 ${port} 已被占用: ${e}`);
        return false;
    }
}
