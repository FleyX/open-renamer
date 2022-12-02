import GlobalConfigDao from '../dao/GlobalConfigDao';

import { DEFAULT_TEMPLETE_ID } from '../entity/constants/GlobalConfigCodeConstant';
import GlobalConfig from '../entity/po/GlobalConfig';


class GlobalConfigService {

	static async getVal(code: string): Promise<string> {
		return GlobalConfigDao.getByCode(code);
	}

	/**
	 * 获取多个配置
	 * @param codes codes
	 * @returns 
	 */
	static async getMultVal(codes: Array<string>): Promise<any> {
		let re = {};
		(await GlobalConfigDao.getByMulCode(codes)).forEach(item => re[item.code] = item.val);
		return re;
	}

	static async updateVal(code: string, val: string): Promise<void> {
		return GlobalConfigDao.updateOne(code, val);
	}

	static async insertOrReplace(body: GlobalConfig): Promise<void> {
		return GlobalConfigDao.insertOrReplace(body);
	}
}

export default GlobalConfigService;
