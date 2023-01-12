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

const autoConfigCode = "autoConfig";

class AutoPlanService {
	/**
	 * 保存配置
	 */
	static async saveAutoConfig(body: AutoPlanConfigDto): Promise<void> {
		let configBody: GlobalConfig = {
			code: autoConfigCode,
			val: JSON.stringify(body),
			description: "自动化计划配置"
		};
		await GlobalConfigService.insertOrReplace(configBody);
		if (!body.start) {
			return;
		}
		let old = await GlobalConfigService.getVal(autoConfigCode);
		if (old && old.length)
	}
}

export default AutoPlanService;
