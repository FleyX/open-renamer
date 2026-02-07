// 使用 Deno 原生的 SQLite
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import config from '../config.ts';
import * as path from 'std/path/mod.ts';
// 导入Deno标准库日志模块
import * as log from 'std/log/mod.ts';

const HISTORY_NAME = "history.json";

// 准备语句包装类，用于兼容原有 API
class PreparedStatement {
    private sql: string;
    private db: DB;
    
    constructor(db: DB, sql: string) {
        this.db = db;
        this.sql = sql;
    }
    
    // 执行查询并返回所有结果
    all(...params: any[]) {
        // 如果参数是数组，展开数组
        const queryParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const results = this.db.query(this.sql, queryParams);
        
        // 将结果转换为对象格式，兼容原有 API
        return results.map(row => {
            const obj: any = {};
            const columns = this.sql.match(/select\s+(.+?)\s+from/i)?.[1].split(',').map(col => col.trim().split(' ').pop());
            if (columns) {
                row.forEach((value: any, index: number) => {
                    obj[columns[index]] = value;
                });
            }
            return obj;
        });
    }
    
    // 执行查询并返回第一个结果
    get(...params: any[]) {
        // 如果参数是数组，展开数组
        const queryParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const results = this.db.query(this.sql, queryParams);
        
        if (results.length === 0) {
            return null;
        }
        
        // 将结果转换为对象格式，兼容原有 API
        const obj: any = {};
        const columns = this.sql.match(/select\s+(.+?)\s+from/i)?.[1].split(',').map(col => col.trim().split(' ').pop());
        if (columns) {
            results[0].forEach((value: any, index: number) => {
                obj[columns[index]] = value;
            });
        }
        
        return obj;
    }
    
    // 执行语句
    run(...params: any[]) {
        // 如果参数是数组，展开数组
        const queryParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        this.db.query(this.sql, queryParams);
        return { changes: 1 };
    }
}

class SqliteHelper {
    public static pool: DB & { 
        run: (sql: string, ...params: any[]) => any;
        all: (sql: string, ...params: any[]) => any;
        prepare: (sql: string) => PreparedStatement;
    } | null = null;

    static async createPool() {
        let dataFolder = config.dataPath;
        
        // 检查目录是否存在，不存在则创建
        try {
            await Deno.stat(dataFolder);
        } catch {
            await Deno.mkdir(dataFolder, { recursive: true });
        }
        
        let dbPath = path.join(dataFolder, "database.db");
        
        // 使用 deno-sqlite 打开或创建数据库
        const db = new DB(dbPath);
        
        // 为 DB 实例添加兼容方法
        (db as any).run = function(sql: string, ...params: any[]) {
            const result = this.query(sql, params);
            return { changes: result.length };
        };
        
        (db as any).all = function(sql: string, ...params: any[]) {
            return this.query(sql, params);
        };
        
        (db as any).prepare = function(sql: string) {
            return new PreparedStatement(this, sql);
        };
        
        SqliteHelper.pool = db as any;
        
        let basePath = path.join(config.rootPath, "openRenamerBackend/sqls");
        let hisPath = path.join(dataFolder, HISTORY_NAME);
        let history: Array<string>;
        
        // 读取历史记录
        try {
            const hisContent = await Deno.readTextFile(hisPath);
            history = JSON.parse(hisContent);
        } catch {
            history = [];
        }
        
        // 执行数据库脚本
        let files: string[] = [];
        for await (const entry of Deno.readDir(basePath)) {
            if (!entry.isDirectory && entry.name !== HISTORY_NAME) {
                files.push(entry.name);
            }
        }
        
        files.sort((a, b) => a.localeCompare(b));
        let error = null;
        
        for (let i = 0; i < files.length; i++) {
            if (history.indexOf(files[i]) > -1) {
                log.info(`sql无需重复执行: ${files[i]}`);
                continue;
            }
            
            try {
                const sqlContent = await Deno.readTextFile(path.join(basePath, files[i]));
                const sqlLines = sqlContent.split(/[\r\n]/g)
                    .map(item => item.trim())
                    .filter(item => !item.startsWith("--"));
                
                let sql = "";
                for (let j = 0; j < sqlLines.length; j++) {
                    sql = sql + " " + sqlLines[j];
                    if (sqlLines[j].endsWith(";")) {
                        SqliteHelper.pool!.query(sql);
                        sql = "";
                    }
                }
                
                log.info(`sql执行成功: ${files[i]}`);
                history.push(files[i]);
            } catch (err) {
                error = err;
                break;
            }
        }
        
        // 写入历史记录
        await Deno.writeTextFile(hisPath, JSON.stringify(history));
        
        if (error != null) {
            throw error;
        }
    }
    
    // 添加静态方法以兼容原有 API
    static async run(sql: string, ...params: any[]) {
        return SqliteHelper.pool!.run(sql, params);
    }
    
    static async all(sql: string, ...params: any[]) {
        return SqliteHelper.pool!.all(sql, params);
    }
}

export default SqliteHelper;
