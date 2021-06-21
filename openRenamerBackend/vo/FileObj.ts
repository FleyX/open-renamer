export default class FileObj {
	/**
	 * 文件名
	 */
	name: string;
	/**
	 * 是否文件夹
	 */
	isFolder: boolean;
	/**
	 * 创建时间ms
	 */
	createdTime: number;
	/**
	 * 更新时间
	 */
	updatedTime: number;


	constructor(name, isFolder, createdTime, updatedTime) {
		this.name = name;
		this.isFolder = isFolder;
		this.createdTime = createdTime;
		this.updatedTime = updatedTime;
	}
}