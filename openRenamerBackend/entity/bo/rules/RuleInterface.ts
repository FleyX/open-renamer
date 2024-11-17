import FileObj from "../../vo/FileObj";
import * as path from 'path';

export default interface RuleInterface {

    deal(file: FileObj): void;
}

/**
 * 重新处理文件名
 * @param file
 * @param newFileName
 * @param ignorePostfix
 */
export function dealFileName(file: FileObj, newFileName: string, ignorePostfix: boolean) {
    if (ignorePostfix) {
        file.realName = newFileName;
    } else {
        file.expandName = path.extname(newFileName);
        if (file.expandName.length > 0) {
            file.realName = newFileName.substring(0, newFileName.lastIndexOf("."));
        } else {
            file.realName = newFileName;
        }
    }
    file.name = file.realName + file.expandName;
}