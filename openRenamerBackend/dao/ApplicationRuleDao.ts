import ErrorHelper from "../util/ErrorHelper";
import ApplicationRule from "../entity/dto/ApplicationRule";
import SqliteHelper from "../util/SqliteHelper";

export default class ApplicationRuleDao {
	/**
	 * 查询所有
	 * @param obj 
	 * @returns 
	 */
	static async getAll(): Promise<Array<ApplicationRule>> {
		let res = await SqliteHelper.pool.all('select id,createdDate,updatedDate,name,comment,content from application_rule');
		return res;
	}


	/**
	 * 新增
	 * @param obj 
	 * @returns 
	 */
	static async addOne(obj: ApplicationRule): Promise<number> {
		let res = await SqliteHelper.pool.run('insert into application_rule(createdDate,updatedDate,name,comment,content) values(?,?,?,?,?)'
			, obj.createdDate, obj.updatedDate, obj.name, obj.comment, obj.content);
		return res.lastID;
	}

	/**
	 * 更新
	 * @param obj 
	 */
	static async updateOne(obj: ApplicationRule): Promise<void> {
		let res = await SqliteHelper.pool.run('update application_rule set updatedDate=?,name=?,comment=?,content=? where id=?'
			, obj.updatedDate, obj.name, obj.comment, obj.content, obj.id);
		if (res.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}

	/**
	 * 删除
	 * @param id 
	 */
	static async delete(id: number): Promise<void> {
		let res = await SqliteHelper.pool.run('delete from application_rule  where id=?', id);
		if (res.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}


}