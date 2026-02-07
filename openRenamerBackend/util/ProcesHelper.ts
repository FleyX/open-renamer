// 导入Deno标准库日志模块
import * as logger from 'std/log/mod.ts';
import config from "../config.ts";

class ProcessHelper {
    static async exec(cmd): Promise<string> {
        try {
            // 使用 Deno.Command 执行命令
            const command = new Deno.Command(
                "sh",
                {
                    args: ["-c", cmd],
                    stdout: "piped",
                    stderr: "piped"
                }
            );
            
            const output = await command.output();
            
            const stderr = new TextDecoder().decode(output.stderr);
            if (stderr) {
                throw new Error(stderr);
            }
            
            const stdout = new TextDecoder().decode(output.stdout);
            return stdout;
        } catch (error) {
            throw error;
        }
    }

    static kill(pid: number): void {
        try {
            // 使用 Deno.kill 替代平台特定命令
            Deno.kill(pid);
        } catch (e) {
            logger.info("进程kill报错:" + (e as Error).message);
        }
    }
}

export default ProcessHelper