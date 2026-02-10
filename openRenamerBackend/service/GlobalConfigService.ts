import GlobalConfigDao from '../dao/GlobalConfigDao.ts';
import GlobalConfig from '../entity/po/GlobalConfig.ts';


class GlobalConfigService {

	static getVal(code: string): string | null {
		return GlobalConfigDao.getByCode(code);
	}

	/**
	 * 获取多个配置
	 */
	static getMultVal(codes: Array<string>): Record<string, string> {
		const re: Record<string, string> = {};
		GlobalConfigDao.getByMulCode(codes).forEach(item => re[item.code] = item.val);
		return re;
	}

	static async updateVal(code: string, val: string): Promise<void> {
		await GlobalConfigDao.updateOne(code, val);
	}

	static async insertOrReplace(body: GlobalConfig): Promise<void> {
		await GlobalConfigDao.insertOrReplace(body);
	}
}

export default GlobalConfigService;
