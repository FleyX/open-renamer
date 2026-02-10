import ErrorHelper from "../util/ErrorHelper.ts";
import SqliteHelper from "../util/SqliteHelper.ts";
import GlobalConfig from "../entity/po/GlobalConfig.ts";

export default class GlobalConfigDao {

	/**
	 * 新增
	 */
	static async addOne(obj: GlobalConfig): Promise<void> {
		await SqliteHelper.pool.run('insert into global_config(code,val,description) values(?,?,?)'
			, obj.code, obj.val, obj.description);
	}

	/**
	 * 更新
	 */
	static async updateOne(code: string, val: string): Promise<void> {
		await SqliteHelper.pool.run('update global_config set val=? where code=?', val, code);
	}

	/**
	 * 删除
	 */
	static async deleteByCode(code: string): Promise<void> {
		const res = await SqliteHelper.pool.run('delete from global_config where code=?', code);
		if (res.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}

	/**
	 * 查询
	 */
	static getByCode(code: string): string | null {
		const stmt = SqliteHelper.pool.prepare('select val from global_config where code=?');
		const res = stmt.get(code);
		return res ? (res.val as string) : null;
	}

	/**
	 * 查询多个code（使用参数化查询避免SQL注入）
	 */
	static getByMulCode(codes: Array<string>): Array<GlobalConfig> {
		if (codes.length == 0) {
			return [];
		}
		const placeholders = codes.map(() => '?').join(',');
		const stmt = SqliteHelper.pool.prepare(`select * from global_config where code in (${placeholders})`);
		return stmt.all(...codes) as unknown as Array<GlobalConfig>;
	}

	/**
	 * 插入或替换
	 */
	static async insertOrReplace(body: GlobalConfig): Promise<void> {
		await SqliteHelper.pool.run(`insert or replace into global_config values (?,?,?)`, body.code, body.val, body.description);
	}
}
