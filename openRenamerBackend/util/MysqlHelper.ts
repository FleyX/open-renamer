import mysql from "mysql2/promise";
import config from '../config';
import * as fs from "fs-extra";
import * as path from 'path';
import log from '../util/LogUtil';

const HISTORY_NAME = "history.json";

interface Res {
    rows: any;
    fields: mysql.FieldPacket;
}

class MysqlUtil {
    public static pool: mysql.Pool = null;

    static async createPool(mysqlConfig: any) {
        MysqlUtil.pool = await mysql.createPool(mysqlConfig);
        let basePath = path.join(config.rootPath, "sqls");
        let hisPath = path.join(basePath, HISTORY_NAME);
        let history: Array<string>;
        if (fs.existsSync(hisPath)) {
            history = JSON.parse(await fs.readFile(hisPath, "utf-8"));
        } else {
            history = new Array();
        }
        //执行数据库
        let files = (await fs.readdir(basePath)).sort((a, b) => a.localeCompare(b)).filter(item => !(item === HISTORY_NAME));
        let error = null;
        for (let i = 0; i < files.length; i++) {
            if (history.indexOf(files[i]) > -1) {
                log.info("sql无需重复执行:", files[i]);
                continue;
            }
            let sqlLines = (await fs.readFile(path.join(basePath, files[i]), 'utf-8')).split(/[\r\n]/g);
            try {
                let sql = "";
                for (let j = 0; j < sqlLines.length; j++) {
                    sql = sql + sqlLines[j];
                    if (sqlLines[j].endsWith(";")) {
                        await MysqlUtil.pool.execute(sql);
                        sql = "";
                    }
                }
                log.info("sql执行成功:", files[i]);
                history.push(files[i]);
            } catch (err) {
                error = err;
                break;
            }
        }
        await fs.writeFile(hisPath, JSON.stringify(history));
        if (error != null) {
            throw error;
        }
    }

    static async getRows(sql: string, params: Array<any>, connection: mysql.PoolConnection = null): Promise<Array<any>> {
        return (await MysqlUtil.execute(sql, params, connection)).rows;
    }


    static async getRow(sql: string, params: Array<any>, connection: mysql.PoolConnection = null): Promise<any> {
        let rows = (await MysqlUtil.execute(sql, params, connection)).rows;
        return rows.length > 0 ? rows[0] : null;
    }

    static async getSingle(sql: string, params: Array<any>, connection: mysql.PoolConnection = null): Promise<any> {
        let rows = (await MysqlUtil.execute(sql, params, connection)).rows;
        if (rows.length == 0) {
            return null;
        }
        let row = rows[0];
        return row[Object.keys(row)[0]];
    }



    static async execute(sql: string, params: Array<any>, connection: mysql.PoolConnection = null): Promise<Res> {
        let res: any = {};
        if (connection == null) {
            let [rows, fields] = await MysqlUtil.pool.query(sql, params);
            res['rows'] = fields === undefined ? null : rows;
            res['fields'] = fields === undefined ? rows : fields;
        } else {
            let [rows, fields] = await connection.query(sql, params);
            res['rows'] = rows;
            res['fields'] = fields;
        }
        return res;
    }


    static async test() {
        let connection = await MysqlUtil.pool.getConnection();
        connection.beginTransaction();
        connection.query(`insert into url value(6,"GET","asd","public")`);
        connection.query(`insert into url value(7,"GET","asd","public")`);
        await connection.commit();
        connection.release();
    }
}

export {
    MysqlUtil,
    Res,
    mysql
}