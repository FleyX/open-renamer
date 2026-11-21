import ErrorHelper from "../util/ErrorHelper.ts";
import type SavePath from "../entity/po/SavePath.ts";
import { getDatabasePool } from "./database.ts";

export default class SavePathDao {
	/**
	 * 查询所有
	 */
	static getAll(): Array<SavePath> {
		const stmt = getDatabasePool().prepare(
			"select id,name,content from path_save",
		);
		return stmt.all() as unknown as Array<SavePath>;
	}

	/**
	 * 新增
	 */
	static async addOne(obj: SavePath): Promise<number> {
		const result = await getDatabasePool().run(
			"insert into path_save(name,content) values(?,?)",
			[obj.name, obj.content],
		);
		return result.lastInsertRowId ?? 0;
	}

	/**
	 * 删除
	 */
	static async delete(id: number): Promise<void> {
		const result = await getDatabasePool().run(
			"delete from path_save where id=?",
			[id],
		);
		if (result.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}
}
