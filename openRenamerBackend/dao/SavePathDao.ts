import ErrorHelper from "../util/ErrorHelper.ts";
import SavePath from "../entity/po/SavePath.ts";
import SqliteHelper from "../util/SqliteHelper.ts";

export default class SavePathDao {
	/**
	 * 查询所有
	 * @param obj 
	 * @returns 
	 */
	static getAll(): Array<SavePath> {
		const stmt = SqliteHelper.pool.prepare('select id,name,content from path_save');
		return stmt.all() as unknown as Array<SavePath>;
	}


	/**
	 * 新增
	 * @param obj 
	 * @returns 
	 */
	static async addOne(obj: SavePath): Promise<number> {
		const result = await SqliteHelper.pool.run('insert into path_save(name,content) values(?,?)'
			, [obj.name, obj.content]);
		return result.lastInsertRowId ?? 0;
	}


	/**
	 * 删除
	 * @param id 
	 */
	static async delete(id: number): Promise<void> {
		const result = await SqliteHelper.pool.run('delete from path_save where id=?', [id]);
		if (result.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}


}