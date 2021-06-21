import * as childPrecess from 'child_process';

class ProcessHelper {
    static exec(cmd): Promise<string> {
        return new Promise((resolve, reject) => {
            childPrecess.exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } if (stderr) {
                    reject(stderr);
                } else {
                    resolve(stdout)
                }
            })
        })
    }
}

// (async()=>{
//     let res= await ProcessHelper.exec('cd /d e://workspace&&dir');
//     console.log(res);
// })()

export default ProcessHelper