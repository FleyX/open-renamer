import ApplicationRule from '../entity/po/ApplicationRule.ts';
import ApplicationRuleDao from '../dao/ApplicationRuleDao.ts';
import GlobalConfigDao from '../dao/GlobalConfigDao.ts';

import { DEFAULT_TEMPLETE_ID } from '../entity/constants/GlobalConfigCodeConstant.ts';
import GlobalConfig from '../entity/po/GlobalConfig.ts';
import ErrorHelper from '../util/ErrorHelper.ts';


class ApplicationRuleService {
	static async saveOrAdd(ruleObj: ApplicationRule): Promise<ApplicationRule> {
		ruleObj.updatedDate = Date.now();
		if (!ruleObj.id) {
			ruleObj.createdDate = Date.now();
			ruleObj.id = await ApplicationRuleDao.addOne(ruleObj);
		} else {
			await ApplicationRuleDao.updateOne(ruleObj);
		}
		return ruleObj;
	}

	static async getAll(): Promise<Array<ApplicationRule>> {
		return await ApplicationRuleDao.getAll();
	}

	static async deleteById(id: number): Promise<void> {
		const idStr = GlobalConfigDao.getByCode(DEFAULT_TEMPLETE_ID);
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
		const idStr = GlobalConfigDao.getByCode(DEFAULT_TEMPLETE_ID);
		if (idStr == null) {
			const templteList = await ApplicationRuleDao.getAll();
			if (templteList.length == 0) {
				res = new ApplicationRule("默认模板", "此模板为系统创建", "[]");
				await ApplicationRuleService.saveOrAdd(res);
			} else {
				res = templteList[0];
			}
			await GlobalConfigDao.addOne(new GlobalConfig(DEFAULT_TEMPLETE_ID, res.id.toString(), "默认模板id"));
		} else {
			const templteList = await ApplicationRuleDao.getAll();
			if (templteList.length == 0) {
				res = new ApplicationRule("默认模板", "此模板为系统创建", "[]");
				await ApplicationRuleService.saveOrAdd(res);
				await GlobalConfigDao.updateOne(DEFAULT_TEMPLETE_ID, res.id.toString());
			} else {
				const temp = templteList.filter(item => item.id.toString() === idStr);
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
