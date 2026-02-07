import config from '../config.ts';
import * as path from 'std/path/mod.ts';

import ProcessHelper from '../util/ProcesHelper.ts';
import FileObj from '../entity/vo/FileObj.ts';
import SavePathDao from '../dao/SavePathDao.ts';
import SavePath from '../entity/po/SavePath.ts';
import ErrorHelper from "../util/ErrorHelper.ts";
// 导入Deno标准库日志模块
import * as logger from 'std/log/mod.ts';

const numberSet = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

class FileService {
    static async readPath(pathStr: string, showHidden: boolean): Promise<Array<FileObj>> {
        pathStr = decodeURIComponent(pathStr);
        let fileList = [];
        if (pathStr.trim().length == 0) {
            //获取根目录路径
            if (config.isWindows) {
                //windows下
                const std: string = (await ProcessHelper.exec('wmic logicaldisk get caption')).replace('Caption', '');
                fileList = std
                    .split('\r\n')
                    .filter((item) => item.trim().length > 0)
                    .map((item) => item.trim());
            } else {
                //linux下
                pathStr = '/';
                const entries = await Deno.readDir(pathStr);
                fileList = [];
                for await (const entry of entries) {
                    fileList.push(entry.name);
                }
            }
        } else {
            try {
                await Deno.stat(pathStr);
            } catch (_e) {
                throw new Error("路径不存在");
            }
            const entries = await Deno.readDir(pathStr);
            fileList = [];
            for await (const entry of entries) {
                fileList.push(entry.name);
            }
        }
        // folderList和files变量在后续会被push方法修改内容，所以使用const
        const folderList: Array<FileObj> = [];
        const files: Array<FileObj> = [];
        for (const index in fileList) {
            try {
                const fileStat = await Deno.stat(path.join(pathStr, fileList[index]));
                if (fileList[index].startsWith('.')) {
                    if (showHidden) {
                        (fileStat.isDirectory ? folderList : files).push(
                            new FileObj(fileList[index], pathStr, fileStat.isDirectory, fileStat.size, fileStat.birthtime?.getTime() || 0, fileStat.mtime?.getTime() || 0),
                        );
                    }
                } else {
                    (fileStat.isDirectory ? folderList : files).push(
                        new FileObj(fileList[index], pathStr, fileStat.isDirectory, fileStat.size, fileStat.birthtime?.getTime() || 0, fileStat.mtime?.getTime() || 0),
                    );
                }
            } catch (e) {
                logger.error(e);
            }
        }
        folderList.sort((a, b) => FileService.compareStr(a.name, b.name)).push(...files.sort((a, b) => FileService.compareStr(a.name, b.name)));
        return folderList;
    }

    /**
     * 递归读取文件夹下所有的文件
     */
    static async readRecursion(folders: Array<FileObj>): Promise<Array<FileObj>> {
        const res: Array<FileObj> = [];
        await this.readDirRecursion(res, folders, 1);
        return res;
    }

    private static async readDirRecursion(res: Array<FileObj>, folders: Array<FileObj>, depth: number): Promise<void> {
        if (depth > 10) {
            throw ErrorHelper.Error400("递归读取超过10层,强制结束");
        }
        if (folders == null || folders.length == 0) {
            return;
        }
        for (const i in folders) {
            const file = folders[i];
            if (!file.isFolder) {
                res.push(file);
            } else {
                const filePath = path.join(file.path, file.name);
                const entries = await Deno.readDir(filePath);
                const temp: FileObj[] = [];
                for await (const item of entries) {
                    const fileStat = await Deno.stat(path.join(filePath, item.name));
                    temp.push(new FileObj(item.name, filePath, fileStat.isDirectory, fileStat.size, fileStat.birthtime?.getTime() || 0, fileStat.mtime?.getTime() || 0));
                }
                await FileService.readDirRecursion(res, temp, depth + 1);
            }
        }
    }

    static async checkExist(pathStr: string): Promise<boolean> {
        try {
            await Deno.stat(pathStr);
            return true;
        } catch (_e) {
            return false;
        }
    }

    /**
     * 收藏路径
     * @param saveObj
     * @returns
     */
    static async savePath(saveObj: SavePath) {
        await SavePathDao.addOne(saveObj);
        return saveObj;
    }

    /**
     * 获取保存列表
     * @returns
     */
    static async getSaveList() {
        return await SavePathDao.getAll();
    }

    /**
     * 删除
     * @param id
     * @returns
     */
    static async deleteOne(id: number): Promise<void> {
        await SavePathDao.delete(id);
    }

    /**
     * 数字字母混合排序
     * @param a str
     * @param b str
     */
    static compareStr(a: string, b: string) {
        const an = a.length;
        const bn = b.length;
        for (let i = 0; i < an;) {
            const charA = FileService.readChar(a, i, an);
            const charB = FileService.readChar(b, i, bn);
            if (charB.length == 0) {
                return 1;
            }
            if (charA !== charB) {
                //读取字符串不相等说明可以得到排序结果
                //如果都为数字，按照数字的比较方法，否则按照字符串比较
                return numberSet.has(charA.charAt(0)) && numberSet.has(charB.charAt(0)) ? Number(charA) - Number(charB) : charA.localeCompare(charB);
            }
            i += charA.length;
        }
        //排到最后都没分结果说明相等
        return 0;
    }

    /**
     * 读取字符，如果字符为数字就读取整个数字
     * @param a a
     * @param n 数字长度
     */
    static readChar(a: string, i: number, n: number) {
        let res = "";
        for (; i < n; i++) {
            const char = a.charAt(i);
            if (numberSet.has(char)) {
                //如果当前字符是数字，添加到结果中
                res += char;
            } else {
                //如果不为数字，但是为第一个字符，直接返回，否则返回res
                if (res.length == 0) {
                    return char;
                } else {
                    return res;
                }
            }
        }
        return res;
    }

    /**
     * delete batch
     * @param files files
     */
    static async deleteBatch(files: Array<FileObj>): Promise<void> {
        if (files == null || files.length == 0) {
            return;
        }
        for (const i in files) {
            await Deno.remove(path.join(files[i].path, files[i].name), { recursive: true });
        }
    }

    /**
     * rename file from source to target
     * @param source sourceFile
     * @param target targetFile
     */
    static async rename(source: FileObj, target: FileObj): Promise<void> {
        await Deno.rename(path.join(source.path, source.name), path.join(target.path, target.name));
    }
}

export default FileService;
