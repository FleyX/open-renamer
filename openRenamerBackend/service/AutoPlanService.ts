import config from '../config';
import * as path from 'path';
import * as fs from 'fs-extra';

import AutoPlanConfigDto from '../entity/dto/AutoPlanConfigDto';
import GlobalConfig from 'entity/po/GlobalConfig';
import GlobalConfigService from './GlobalConfigService';
import ErrorHelper from '../util/ErrorHelper';
import TimeUtil from '../util/TimeUtil';
import { isSub, isVideo } from '../util/MediaUtil';
import log from '../util/LogUtil';
const autoConfigCode = "autoConfig";
let isReadDir = false;
/**
 * 需要处理的文件
 */
let needDeal = [];
/**
 * 文件夹变更记录。key:变更前的目录，value:变更后的目录.当needDeal为空时清理pathMap
 */
let pathMap = {};
/**
 * 自动化配置
 */
let autoConfig: AutoPlanConfigDto = null;


class AutoPlanService {

	static async init() {
		let str = await GlobalConfigService.getVal(autoConfigCode);
		if (str != null) {
		} else {
			autoConfig = JSON.parse(str);
		}
		setTimeout(async () => {
			while (true) {
				try {
					await TimeUtil.sleep(1000);
					await work();
				} catch (err) {
					console.log(err);
				}
			}
		}, 1000);
	}

	/**
	 * 保存配置
	 */
	static async saveAutoConfig(body: AutoPlanConfigDto): Promise<void> {
		if (isReadDir) {
			throw ErrorHelper.Error400("正在处理中，请稍后再试");
		}
		if (body.start) {
			if (body.paths.length == 0) {
				throw ErrorHelper.Error400("视频路径为空");
			}
			if (body.rules.length == 0) {
				throw ErrorHelper.Error400("规则为空");
			}
		}
		let configBody: GlobalConfig = {
			code: autoConfigCode,
			val: JSON.stringify(body),
			description: "自动化计划配置"
		};
		await GlobalConfigService.insertOrReplace(configBody);
		autoConfig = body;
		if (body.start && !body.ignoreExist) {
			setTimeout(async () => {
				isReadDir = true;
				try {
					await readDir(body.paths);
				} finally {
					isReadDir = false;
				}
			}, 1);
		}
	}
}

/**
 * 读取目录，获取文件列表 
 * @param dirList 要读取的目录
 */
async function readDir(dirList: Array<string>): Promise<void> {
	if (!dirList) {
		return;
	}
	for (let i in dirList) {
		let pathStr = dirList[i];
		if (checkIgnore(path.basename(pathStr))) {
			continue;
		}
		if (!(await fs.stat(pathStr)).isDirectory()) {
			let fileName = path.basename(pathStr);
			let strs = fileName.split('.').reverse();
			if (strs.length > 0 && (isSub(strs[0]) || isVideo(strs[1]))) {
				needDeal.push(pathStr);
			}
			continue;
		}
		let childs = null;
		try {
			childs = await fs.readdir(pathStr);
		} catch (error) {
			console.warn("读取报错:{}", error);
		}
		if (childs != null) {
			await readDir(childs.map(item => path.join(pathStr, item)));
		}
	}
}

/**
 * 检查文件名是否被忽略的 
 */
function checkIgnore(str: string): boolean {
	for (let i in autoConfig.ignorePaths) {
		if (str.match(autoConfig.ignorePaths[i])) {
			return true;
		}
	}
	return false;
}

/**
 * 开始处理 
 */
async function work() {
	if (autoConfig == null || !autoConfig.start) {
		return;
	}
	while (needDeal.length > 0) {
		let file = needDeal.pop();
		try {
			await dealOnePath(file);
		} catch (error) {
			log.error("处理文件报错:{}", file);
			console.error(error);
		}
	}
}

/**
 * 处理一个文件路径
 * @param filePath 路径
 * @returns 
 */
async function dealOnePath(filePath: string) {
	let exist = await fs.pathExists(filePath);
	if (!exist) {
		return;
	}
	let basePath = null;
	for (let i in autoConfig.paths) {
		if (filePath.startsWith(autoConfig.paths[i])) {
			basePath = autoConfig.paths[i];
			break;
		}
	}
	if (basePath == null) {
		log.warn("无法识别的文件:{}", filePath);
		return;
	}
	let relativePath = filePath.replace(basePath, "");
	let pathArrs = relativePath.split(path.sep).filter(item => item.length > 0);

}

export default AutoPlanService;
