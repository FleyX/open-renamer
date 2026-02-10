import config from '../config.ts';
import * as path from 'std/path/mod.ts';

import ProcessHelper from '../util/ProcesHelper.ts';
import FileObj from '../entity/vo/FileObj.ts';
import SavePathDao from '../dao/SavePathDao.ts';
import SavePath from '../entity/po/SavePath.ts';
import ErrorHelper from "../util/ErrorHelper.ts";
import * as logger from 'std/log/mod.ts';

const numberSet = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

class FileService {
    static async readPath(pathStr: string, showHidden: boolean): Promise<Array<FileObj>> {
        pathStr = decodeURIComponent(pathStr);
        let fileList: string[] = [];
        if (pathStr.trim().length == 0) {
            if (config.isWindows) {
                const std: string = (await ProcessHelper.exec('wmic logicaldisk get caption')).replace('Caption', '');
                fileList = std
                    .split('\r\n')
                    .filter((item) => item.trim().length > 0)
                    .map((item) => item.trim());
            } else {
                pathStr = '/';
                fileList = [];
                for await (const entry of Deno.readDir(pathStr)) {
                    fileList.push(entry.name);
                }
            }
        } else {
            try {
                await Deno.stat(pathStr);
            } catch {
                throw new Error("路径不存在");
            }
            fileList = [];
            for await (const entry of Deno.readDir(pathStr)) {
                fileList.push(entry.name);
            }
        }
        const folderList: Array<FileObj> = [];
        const files: Array<FileObj> = [];
        for (const fileName of fileList) {
            try {
                const fileStat = await Deno.stat(path.join(pathStr, fileName));
                if (fileName.startsWith('.') && !showHidden) {
                    continue;
                }
                (fileStat.isDirectory ? folderList : files).push(
                    new FileObj(fileName, pathStr, fileStat.isDirectory, fileStat.size, fileStat.birthtime?.getTime() || 0, fileStat.mtime?.getTime() || 0),
                );
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
        for (const file of folders) {
            if (!file.isFolder) {
                res.push(file);
            } else {
                const filePath = path.join(file.path, file.name);
                const temp: FileObj[] = [];
                for await (const item of Deno.readDir(filePath)) {
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
        } catch {
            return false;
        }
    }

    /**
     * 收藏路径
     */
    static async savePath(saveObj: SavePath) {
        await SavePathDao.addOne(saveObj);
        return saveObj;
    }

    /**
     * 获取保存列表
     */
    static async getSaveList() {
        return await SavePathDao.getAll();
    }

    /**
     * 删除
     */
    static async deleteOne(id: number): Promise<void> {
        await SavePathDao.delete(id);
    }

    /**
     * 数字字母混合排序
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
                return numberSet.has(charA.charAt(0)) && numberSet.has(charB.charAt(0)) ? Number(charA) - Number(charB) : charA.localeCompare(charB);
            }
            i += charA.length;
        }
        return 0;
    }

    /**
     * 读取字符，如果字符为数字就读取整个数字
     */
    static readChar(a: string, i: number, n: number) {
        let res = "";
        for (; i < n; i++) {
            const char = a.charAt(i);
            if (numberSet.has(char)) {
                res += char;
            } else {
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
     * 批量删除
     */
    static async deleteBatch(files: Array<FileObj>): Promise<void> {
        if (files == null || files.length == 0) {
            return;
        }
        for (const file of files) {
            await Deno.remove(path.join(file.path, file.name), { recursive: true });
        }
    }

    /**
     * 重命名文件
     */
    static async rename(source: FileObj, target: FileObj): Promise<void> {
        await Deno.rename(path.join(source.path, source.name), path.join(target.path, target.name));
    }
}

export default FileService;
