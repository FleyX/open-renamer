import * as childPrecess from 'child_process';
import logUtil from "./LogUtil";
import logger from "./LogUtil";
import config from "../config";

class ProcessHelper {
    static exec(cmd): Promise<string> {
        return new Promise((resolve, reject) => {
            childPrecess.exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                if (stderr) {
                    reject(stderr);
                } else {
                    resolve(stdout)
                }
            })
        })
    }

    static kill(pid: number): void {
        try {
            if(config.isWindows){
                childPrecess.execSync("taskkill /pid " + pid)
            }else{
                childPrecess.execSync("kill " + pid)
            }
        } catch (e) {
            logger.info("进程kill报错:" + (e as Error).message);
        }
    }
}


// (async()=>{
//     let res= await ProcessHelper.exec('cd /d e://workspace&&dir');
//     console.log(res);
// })()

export default ProcessHelper