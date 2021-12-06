import config from '../config';
import * as path from 'path';
import * as fs from 'fs-extra';

import ProcessHelper from '../util/ProcesHelper';
import FileObj from '../vo/FileObj';

class FileService {
	static async readPath(pathStr: string, showHidden: boolean): Promise<Array<FileObj>> {
		pathStr = decodeURIComponent(pathStr);
		let fileList = new Array();
		if (pathStr.trim().length == 0) {
			//获取根目录路径
			if (config.isWindows) {
				//windows下
				let std: string = (await ProcessHelper.exec('wmic logicaldisk get caption')).replace('Caption', '');
				fileList = std
					.split('\r\n')
					.filter((item) => item.trim().length > 0)
					.map((item) => item.trim());
			} else {
				//linux下
				pathStr = '/';
				fileList = await fs.readdir(pathStr);
			}
		} else {
			fileList = await fs.readdir(pathStr);
		}
		let folderList: Array<FileObj> = new Array();
		let files: Array<FileObj> = new Array();
		for (let index in fileList) {
			try {
				let stat = await fs.stat(path.join(pathStr, fileList[index]));
				if (fileList[index].startsWith('.')) {
					if (showHidden) {
						(stat.isDirectory() ? folderList : files).push(
							new FileObj(fileList[index], pathStr, stat.isDirectory(), stat.birthtime.getTime(), stat.mtime.getTime()),
						);
					}
				} else {
					(stat.isDirectory() ? folderList : files).push(
						new FileObj(fileList[index], pathStr, stat.isDirectory(), stat.birthtime.getTime(), stat.mtime.getTime()),
					);
				}
			} catch (e) {
				console.error(e);
			}
		}
		folderList.sort((a, b) => a.name.localeCompare(b.name)).push(...files.sort((a, b) => a.name.localeCompare(b.name)));
		return folderList;
	}

	static async checkExist(pathStr: string) {
		return await fs.pathExists(pathStr);
	}
}

export default FileService;
