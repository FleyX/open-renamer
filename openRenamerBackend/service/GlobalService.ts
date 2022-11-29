import GlobalConfigDao from '../dao/GlobalConfigDao';

import { DEFAULT_TEMPLETE_ID } from '../entity/constants/GlobalConfigCodeConstant';
import GlobalConfig from '../entity/po/GlobalConfig';


class GlobalConfigService {

	static async getVal(code: string): Promise<string> {
		return GlobalConfigDao.getByCode(code);
	}

	static async updateVal(code: string, val: string): Promise<void> {
		return GlobalConfigDao.updateOne(code, val);
	}
}

export default GlobalConfigService;
