import config from '../config';
import * as path from 'path';
import * as fs from 'fs-extra';

import ProcessHelper from '../util/ProcesHelper';
import FileObj from '../entity/vo/FileObj';
import SavePathDao from '../dao/SavePathDao';
import SavePath from '../entity/po/SavePath';
import AutoPlanConfigDto from '../entity/dto/AutoPlanConfigDto';
import GlobalConfig from 'entity/po/GlobalConfig';
import GlobalConfigService from './GlobalConfigService';
import ErrorHelper from 'util/ErrorHelper';

const autoConfigCode = "autoConfig";
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
	}

	/**
	 * 保存配置
	 */
	static async saveAutoConfig(body: AutoPlanConfigDto): Promise<void> {
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
			await readDir(body.paths);
		}
	}



}

async function readDir(dirList: Array<string>): Promise<void> {
	if (!dirList) {
		return;
	}
	for (let i in dirList) {
		let pathStr = dirList[i];
		if (checkIgnore(pathStr)) {
			continue;
		}
		if (!(await fs.stat(pathStr)).isDirectory()) {
			needDeal.push(pathStr);
			continue;
		}
		await readDir((await fs.readdir(pathStr)).map(item => path.join(pathStr, item)));
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

export default AutoPlanService;
