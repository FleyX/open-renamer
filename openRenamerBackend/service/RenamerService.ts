import * as path from 'std/path/mod.ts';

import FileObj from '../entity/vo/FileObj.ts';
import RuleObj from '../entity/vo/RuleObj.ts';
import RuleInterface from '../entity/bo/rules/RuleInterface.ts';


class RenamerService {
    static preview(fileList: Array<FileObj>, ruleList: Array<Record<string, unknown>>): Array<FileObj> {
        const ruleObjs = ruleList.map(item => new RuleObj(item));
        const newNameSet = new Set<string>();
        for (const obj of fileList) {
            ruleObjs.forEach(item => (item.data as RuleInterface).deal(obj));
            if (newNameSet.has(obj.path + obj.name)) {
                obj.errorMessage = "重名";
            }
            newNameSet.add(obj.path + obj.name);
        }
        return fileList;
    }

    static async rename(fileList: Array<FileObj>, changedFileList: Array<FileObj>) {
        for (let i = 0; i < fileList.length; i++) {
            const oldPath = path.join(fileList[i].path, fileList[i].name);
            const newPath = path.join(changedFileList[i].path, changedFileList[i].name);
            if (oldPath === newPath) {
                continue;
            }
            try {
                await Deno.stat(newPath);
                throw new Error("此路径已存在:" + newPath);
            } catch (e) {
                if (e instanceof Error && e.message.startsWith("此路径已存在:")) {
                    throw e;
                }
                // 路径不存在，可以继续
            }
            await Deno.rename(oldPath, newPath);
        }
    }


}

export default RenamerService;
