import config from '../config';
import * as path from 'path';
import * as fs from 'fs-extra';

import FileObj from '../entity/vo/FileObj';
import RuleObj from '../entity/vo/RuleObj';
import RuleInterface from '../entity/bo/rules/RuleInterface';


class RenamerService {
    static async preview(fileList: Array<FileObj>, ruleList: Array<any>): Promise<Array<FileObj>> {
        let ruleObjs = ruleList.map(item => new RuleObj(item));
        let newNameSet: Set<string> = new Set<string>();
        for (let i in fileList) {
            let obj = fileList[i];
            ruleObjs.forEach(item => (item.data as RuleInterface).deal(obj));
            if (newNameSet.has(obj.path + obj.name)) {
                obj.errorMessage = "重名";
            }
            newNameSet.add(obj.path + obj.name);
        }
        return fileList;
    }

    static async rename(fileList: Array<FileObj>, changedFileList: Array<FileObj>) {
        for (let i in fileList) {
            let old = fileList[i];
            let oldPath = path.join(fileList[i].path, fileList[i].name);
            let newPath = path.join(changedFileList[i].path, changedFileList[i].name);
            if (oldPath === newPath) {
                continue;
            }
            if ((await fs.pathExists(newPath))) {
                throw new Error("此路径已存在:" + newPath);
            }
            await fs.rename(oldPath, newPath);
        }
    }


}

export default RenamerService;
