import * as pathUtil from "path";
export default class FileObj {
	/**
	 * 文件名
	 */
	name: string;
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


	constructor(name: string, path, isFolder, createdTime, updatedTime) {
		this.name = name;
		this.expandName = pathUtil.extname(name);
		if (this.expandName.length > 0) {
			this.realName = name.substring(0, name.lastIndexOf("."));
		} else {
			this.realName = name;
		}
		this.path = path;
		this.isFolder = isFolder;
		this.createdTime = createdTime;
		this.updatedTime = updatedTime;
	}
}