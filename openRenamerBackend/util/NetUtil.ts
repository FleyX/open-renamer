import NumberUtil from './NumberUtil.ts'
import * as logger from 'std/log/mod.ts';

// 使用 Deno.Command 替代 execSync
async function execCommand(cmd: string[]): Promise<string> {
    const { stdout, stderr } = await new Deno.Command(cmd[0], {
        args: cmd.slice(1),
        stdout: 'piped',
        stderr: 'piped',
    }).output();
    
    if (stderr.length > 0) {
        throw new Error(new TextDecoder().decode(stderr));
    }
    
    return new TextDecoder().decode(stdout);
}

export function getPort(start: number, end: number): number {
    let count = 100;
    while (count-- > 0) {
        let num = NumberUtil.getRandom(start, end);
        if (checkFree(num)) {
            return num;
        }
    }
    throw new Error("无可用端口");
}

export function checkFree(port: number): boolean {
    let stdout = null
    let platform = Deno.build.os;
    try {
        if (platform === "windows") {
            //windows
            const cmd = ['cmd.exe', '/c', `netstat -ano | findstr :${port}`];
            stdout = new Deno.Command(cmd[0], {
                args: cmd.slice(1),
                stdout: 'piped',
                stderr: 'piped',
            }).outputSync().stdout;
        } else if (platform === 'darwin') {
            //mac
            const cmd = ['lsof', `-i:${port}`];
            stdout = new Deno.Command(cmd[0], {
                args: cmd.slice(1),
                stdout: 'piped',
                stderr: 'piped',
            }).outputSync().stdout;
        } else {
            //Linux
            try {
                const cmd = ['netstat', '-tulpn', `| grep :${port}`];
                stdout = new Deno.Command(cmd[0], {
                    args: cmd.slice(1),
                    stdout: 'piped',
                    stderr: 'piped',
                }).outputSync().stdout;
            } catch {
                const cmd = ['ss', '-tulpn', `| grep :${port}`];
                stdout = new Deno.Command(cmd[0], {
                    args: cmd.slice(1),
                    stdout: 'piped',
                    stderr: 'piped',
                }).outputSync().stdout;
            }
        }
        logger.info(new TextDecoder().decode(stdout));
    } catch (e) {
        return true;
    }
    return stdout.length === 0;
}