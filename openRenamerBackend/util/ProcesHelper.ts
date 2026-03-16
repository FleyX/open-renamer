import * as log from 'std/log/mod.ts';

const isWindows = Deno.build.os === "windows";

class ProcessHelper {
    static async exec(cmd: string): Promise<string> {
        try {
            const command = isWindows
                ? new Deno.Command("cmd.exe", {
                    args: ["/c", cmd],
                    stdout: "piped",
                    stderr: "piped"
                })
                : new Deno.Command("sh", {
                    args: ["-c", cmd],
                    stdout: "piped",
                    stderr: "piped"
                });

            const output = await command.output();

            const stderr = new TextDecoder().decode(output.stderr);
            if (stderr) {
                throw new Error(stderr);
            }

            return new TextDecoder().decode(output.stdout);
        } catch (error) {
            throw error;
        }
    }

    static kill(pid: number): void {
        try {
            Deno.kill(pid);
        } catch (e) {
            log.info("进程kill报错:" + (e as Error).message);
        }
    }
}

export default ProcessHelper;
