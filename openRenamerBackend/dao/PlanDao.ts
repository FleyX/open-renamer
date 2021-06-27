import { MysqlUtil } from '../util/MysqlHelper';
import Plan from '../entity/Plan';
import { OkPacket } from 'mysql2';

export default class PlanDao {
    /**
     * 新增一个备份计划
     * @param plan plan
     */
    static async addOne(plan: Plan): Promise<number> {
        let res = await MysqlUtil.pool.execute("insert into plan(createdDate,updatedDate,planName,description,sourcePath,targetPath,nextLaunchTime,launchInterval,latestHistoryId,ignoreList,holdHistory) values(?,?,?,?,?,?,?,?,?,?,?)"
            , [Date.now(), Date.now(), plan.planName, plan.description, plan.sourcePath, plan.targetPath, plan.nextLaunchTime, plan.lanuchInterval, plan.latestHistoryId, JSON.stringify(plan.ignoreList), plan.holdHistory]);
        return (res[0] as unknown as OkPacket).insertId;
    }

    /**
     * 获取所有待执行的plan
     */
    static async getNeedActionPlan(): Promise<Array<Plan>> {
        let sql = `select * from plan where nextLaunchTime < ${Date.now()} order by nextLaunchTime`;
        return (await MysqlUtil.pool.query(sql))[0] as unknown as Array<Plan>;
    }

    /**
     * 更新某个计划的下次执行时间
     * @param id planId
     */
    static async updateNextlaunchTimeAndLatestHistoryId(planId: number, historyId: number) {
        await MysqlUtil.pool.execute(`update plan set nextLaunchTime = nextLaunchTime+launchInterval,latestHistoryId=? where planId=?`
            , [historyId, planId]);
    }

    static async deleteByPlanId(planId: number) {
        await MysqlUtil.pool.execute(`delete from plan where planid=?`, [planId]);
    }

    static async getAll(): Promise<Array<Plan>> {
        return (await MysqlUtil.pool.query("select * from plan"))[0] as unknown as Array<Plan>;
    }
}