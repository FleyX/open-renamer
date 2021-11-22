import config from '../config';
import * as path from 'path';
import * as fs from 'fs-extra';
import ApplicationRule from '../entity/dto/ApplicationRule';
import ApplicationRuleDao from '../dao/ApplicationRuleDao';



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
		await ApplicationRuleDao.delete(id);
	}

}

export default ApplicationRuleService;
