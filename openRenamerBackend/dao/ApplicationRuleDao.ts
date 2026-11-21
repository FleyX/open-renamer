import ErrorHelper from "../util/ErrorHelper.ts";
import type ApplicationRule from "../entity/po/ApplicationRule.ts";
import { getDatabasePool } from "./database.ts";

export default class ApplicationRuleDao {
	/**
	 * 查询所有
	 */
	static getAll(): Array<ApplicationRule> {
		const stmt = getDatabasePool().prepare(
			"select id,createdDate,updatedDate,name,comment,content from application_rule",
		);
		return stmt.all() as unknown as Array<ApplicationRule>;
	}

	/**
	 * 查询id
	 */
	static getById(id: number): ApplicationRule | null {
		const stmt = getDatabasePool().prepare(
			"select * from application_rule where id=?",
		);
		return stmt.get(id) as unknown as ApplicationRule | null;
	}

	/**
	 * 新增
	 */
	static async addOne(obj: ApplicationRule): Promise<number> {
		const result = await getDatabasePool().run(
			"insert into application_rule(createdDate,updatedDate,name,comment,content) values(?,?,?,?,?)",
			[obj.createdDate, obj.updatedDate, obj.name, obj.comment, obj.content],
		);
		return result.lastInsertRowId ?? 0;
	}

	/**
	 * 更新
	 */
	static async updateOne(obj: ApplicationRule): Promise<void> {
		const result = await getDatabasePool().run(
			"update application_rule set updatedDate=?,name=?,comment=?,content=? where id=?",
			[obj.updatedDate, obj.name, obj.comment, obj.content, obj.id],
		);
		if (result.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}

	/**
	 * 删除
	 */
	static async delete(id: number): Promise<void> {
		const result = await getDatabasePool().run(
			"delete from application_rule  where id=?",
			[id],
		);
		if (result.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}
}
