import ApplicationRule from '../entity/po/ApplicationRule';
import ApplicationRuleDao from '../dao/ApplicationRuleDao';
import GlobalConfigDao from '../dao/GlobalConfigDao';

import { DEFAULT_TEMPLETE_ID } from '../entity/constants/GlobalConfigCodeConstant';
import GlobalConfig from '../entity/po/GlobalConfig';
import ErrorHelper from '../util/ErrorHelper';


class ApplicationRuleService {
	static async saveOrAdd(ruleObj: ApplicationRule): Promise<ApplicationRule> {
		ruleObj.updatedDate = Date.now();
		if (!ruleObj.id) {
			//说明是新增
			ruleObj.createdDate = Date.now();
			ruleObj.id = await ApplicationRuleDao.addOne(ruleObj);
		} else {
			//说明是修改
			await ApplicationRuleDao.updateOne(ruleObj);
		}
		return ruleObj;
	}

	static async getAll(): Promise<Array<ApplicationRule>> {
		return await ApplicationRuleDao.getAll();
	}

	static async deleteById(id: number): Promise<void> {
		//禁止删除默认模板
		let idStr = await GlobalConfigDao.getByCode(DEFAULT_TEMPLETE_ID);
		if (id.toString() === idStr) {
			throw ErrorHelper.Error400("禁止删除默认模板");
		}
		await ApplicationRuleDao.delete(id);
	}

	/**
	 * 获取默认模板
	 */
	static async getDefault(): Promise<ApplicationRule> {
		let res: ApplicationRule;
		let idStr = await GlobalConfigDao.getByCode(DEFAULT_TEMPLETE_ID);
		if (idStr == null) {
			let templteList = await ApplicationRuleDao.getAll();
			if (templteList.length == 0) {
				res = new ApplicationRule("默认模板", "此模板为系统创建", "[]");
				await ApplicationRuleService.saveOrAdd(res);
			} else {
				res = templteList[0];
			}
			await GlobalConfigDao.addOne(new GlobalConfig(DEFAULT_TEMPLETE_ID, res.id.toString(), "默认模板id"));
		} else {
			let templteList = await ApplicationRuleDao.getAll();
			if (templteList.length == 0) {
				res = new ApplicationRule("默认模板", "此模板为系统创建", "[]");
				await ApplicationRuleService.saveOrAdd(res);
				await GlobalConfigDao.updateOne(DEFAULT_TEMPLETE_ID, res.id.toString());
			} else {
				let temp = templteList.filter(item => item.id.toString() === idStr);
				if (temp.length > 0) {
					res = temp[0];
				} else {
					res = templteList[0];
					await GlobalConfigDao.updateOne(DEFAULT_TEMPLETE_ID, res.id.toString());
				}
			}
		}
		return res;
	}
}

export default ApplicationRuleService;
