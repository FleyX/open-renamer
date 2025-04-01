import NumberUtil from './NumberUtil'
import {execSync} from 'child_process';
import * as process from "process";

export function getPort(start, end): number {
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
    let platform = process.platform.toLocaleLowerCase();
    try {

        if (platform.includes("win32")) {
        } else if (platform.includes('darwin')) {
            //mac-arm
            stdout = execSync(`lsof -i:${port}`)
        } else {
            //Linux
            stdout = execSync(`netstat -anp | grep ${port}`)
        }
        console.log(stdout);
    } catch (e) {
        return true;
    }
    return !stdout;
}