import ErrorHelper from "../util/ErrorHelper";
import SqliteHelper from "../util/SqliteHelper";
import GlobalConfig from "../entity/po/GlobalConfig";

export default class GlobalConfigDao {


	/**
	 * 新增
	 * @param obj 
	 * @returns 
	 */
	static async addOne(obj: GlobalConfig): Promise<void> {
		await SqliteHelper.pool.run('insert into global_config(code,val,description) values(?,?,?)'
			, obj.code, obj.val, obj.description);
	}

	/**
	 * 更新
	 * @param code code 
	 * @param val  val
	 */
	static async updateOne(code: string, val: string): Promise<void> {
		await SqliteHelper.pool.run('update global_config set val=? where code=?', val, code);
	}


	/**
	 * 删除
	 * @param code
	 */
	static async deleteByCode(code: string): Promise<void> {
		let res = await SqliteHelper.pool.run('delete from global_config where code=?', code);
		if (res.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}

	/**
	 * 查询
	 * @param code
	 */
	static async getByCode(code: string): Promise<string> {
		let res = await SqliteHelper.pool.get('select val from global_config where code=?', code);
		return res ? res.val : null;
	}

	/**
	 * 查询多个code
	 * @param code
	 */
	static async getByMulCode(codes: Array<string>): Promise<Array<GlobalConfig>> {
		if (codes.length == 0) {
			return new Array();
		}
		let codeStr = codes.map(item => `'${item}'`).join(',');
		return await SqliteHelper.pool.all(`select * from global_config where code in (${codeStr})`);
	}

	/**
	 * 插入一条
	 * @param body body
	 */
	static async insertOrReplace(body: GlobalConfig): Promise<void> {
		await SqliteHelper.pool.run(`insert or replace into global_config values (?,?,?)`, body.code, body.val, body.description);
	}


}