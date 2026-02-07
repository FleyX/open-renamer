import ErrorHelper from "../util/ErrorHelper.ts";
import ApplicationRule from "../entity/po/ApplicationRule.ts";
import SqliteHelper from "../util/SqliteHelper.ts";

export default class ApplicationRuleDao {
	/**
	 * 查询所有
	 * @param obj 
	 * @returns 
	 */
	static async getAll(): Promise<Array<ApplicationRule>> {
		const stmt = SqliteHelper.pool.prepare('select id,createdDate,updatedDate,name,comment,content from application_rule');
		return stmt.all();
	}

	/**
		 * 查询id
		 * @param id id
		 * @returns 
		 */
	static async getById(id: number): Promise<ApplicationRule> {
		const stmt = SqliteHelper.pool.prepare('select * from application_rule where id=?');
		return stmt.get([id]);
	}




	/**
	 * 新增
	 * @param obj 
	 * @returns 
	 */
	static async addOne(obj: ApplicationRule): Promise<number> {
		await SqliteHelper.pool.run('insert into application_rule(createdDate,updatedDate,name,comment,content) values(?,?,?,?,?)'
			, [obj.createdDate, obj.updatedDate, obj.name, obj.comment, obj.content]);
		// sql.js 不支持 lastID，返回插入的 ID
		return 0;
	}

	/**
	 * 更新
	 * @param obj 
	 */
	static async updateOne(obj: ApplicationRule): Promise<void> {
		const result = await SqliteHelper.pool.run('update application_rule set updatedDate=?,name=?,comment=?,content=? where id=?'
			, [obj.updatedDate, obj.name, obj.comment, obj.content, obj.id]);
		if (result.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}

	/**
	 * 删除
	 * @param id 
	 */
	static async delete(id: number): Promise<void> {
		const result = await SqliteHelper.pool.run('delete from application_rule  where id=?', [id]);
		if (result.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}


}