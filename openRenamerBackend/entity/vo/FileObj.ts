import * as pathUtil from "path";
import {isVideo, isSub, isNfo} from "../../util/MediaUtil"

export default class FileObj {
    /**
     * 文件名
     */
    name: string;
    /**
     原始名字
     */
    originName: string;
    /**
     * 拓展名
     */
    expandName: string;
    /**
     * 去掉拓展名后的名字
     */
    realName: string;
    /**
     * 所属路径
     */
    path: string;
    /**
     * 是否文件夹
     */
    isFolder: boolean;
    /**
     * 文件大小
     */
    size: number;
    /**
     * 重命名错误原因
     */
    errorMessage: string;
    /**
     * 创建时间ms
     */
    createdTime: number;
    /**
     * 更新时间ms
     */
    updatedTime: number;
    /**
     * 是否广告文件
     */
    isAdFile: boolean;


    constructor(name: string, path, isFolder, size: number, createdTime, updatedTime) {
        this.name = name;
        this.originName = name;
        this.expandName = pathUtil.extname(name);
        if (this.expandName.length > 0) {
            this.realName = name.substring(0, name.lastIndexOf("."));
            let end = this.expandName.toLowerCase().replace(".", "");
            if (isVideo(end)) {
                this.isAdFile = size < 5 * 1024 * 1024;
            } else this.isAdFile = !(isSub(end) || isNfo(end));
        } else {
            this.realName = name;
        }
        this.path = path;
        this.isFolder = isFolder;
        this.size = size;
        this.createdTime = createdTime;
        this.updatedTime = updatedTime;

    }
}