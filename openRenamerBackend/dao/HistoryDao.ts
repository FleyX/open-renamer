import { MysqlUtil } from '../util/MysqlHelper';
import History from '../entity/History';
import { OkPacket } from 'mysql2';
import Plan from 'entity/Plan';

export default class HistoryDao {
    /**
     * 增加一个
     * @param history history
     */
    static async addOne(history: History): Promise<number> {
        let sql = `insert into history(createdDate,updatedDate,planId,fileNum,fileSize,speed,startTime,endTime,comment) values(?,?,?,?,?,?,?,?,?)`;
        let res = await MysqlUtil.pool.execute(sql, [Date.now(), Date.now(), history.planId, history.fileNum, history.fileSize, history.speed, history.startTime, history.endTime, history.comment]);
        return (res[0] as unknown as OkPacket).insertId;
    }

    /**
     * 删除某个plan下所有的历史记录
     * @param planId planId
     */
    static async deleteByPlanId(planId: number) {
        await MysqlUtil.pool.execute("delete from history where planId=?", [planId]);
    }

    /**
     * 获取某个备份计划下的备份历史
     * @param planId planId
     */
    static async getByPlanId(planId: number): Promise<Array<Plan>> {
        return (await MysqlUtil.pool.query("select * from history where planId=?", planId))[0] as unknown as Array<Plan>;
    }
}