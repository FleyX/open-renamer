import ErrorHelper from "../util/ErrorHelper";
import SavePath from "../entity/dto/SavePath";
import SqliteHelper from "../util/SqliteHelper";

export default class SavePathDao {
	/**
	 * 查询所有
	 * @param obj 
	 * @returns 
	 */
	static async getAll(): Promise<Array<SavePath>> {
		let res = await SqliteHelper.pool.all('select id,name,content from path_save');
		return res;
	}


	/**
	 * 新增
	 * @param obj 
	 * @returns 
	 */
	static async addOne(obj: SavePath): Promise<number> {
		let res = await SqliteHelper.pool.run('insert into path_save(name,content) values(?,?)'
			, obj.name, obj.content);
		obj.id = res.lastID;
		return res.lastID;
	}


	/**
	 * 删除
	 * @param id 
	 */
	static async delete(id: number): Promise<void> {
		let res = await SqliteHelper.pool.run('delete from path_save where id=?', id);
		if (res.changes == 0) {
			throw ErrorHelper.Error404("数据不存在");
		}
	}


}