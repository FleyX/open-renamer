import { DB } from "deno-sqlite";
import config from "../config.ts";
import * as path from "std/path/mod.ts";
import * as log from "std/log/mod.ts";

interface DatabaseConfig {
  dataPath: string;
  rootPath: string;
}

// deno-lint-ignore no-unused-vars
interface MigrationHistory {
  executedMigrations: string[];
}

interface QueryResult {
  [key: string]: unknown;
}

interface StatementResult {
  changes: number;
  lastInsertRowId?: number;
}

// 扩展 DB 类型，添加自定义方法
interface ExtendedDB extends DB {
  run(sql: string, ...params: unknown[]): StatementResult;
  all(sql: string, ...params: unknown[]): QueryResult[];
  prepare(sql: string): PreparedStatement;
}

// 数据库连接管理器
class ConnectionManager {
  private static instance: ConnectionManager;
  private db: DB | null = null;
  private readonly dbPath: string;

  private constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  static getInstance(dbPath: string): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager(dbPath);
    }
    return ConnectionManager.instance;
  }

  connect(): void {
    if (this.db) return;
    try {
      this.db = new DB(this.dbPath);
      log.info(`数据库连接成功: ${this.dbPath}`);
    } catch (error) {
      log.error(`数据库连接失败: ${error}`);
      throw error;
    }
  }

  getConnection(): DB {
    if (!this.db) {
      throw new Error("数据库未连接");
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      log.info("数据库连接已关闭");
    }
  }
}

// SQL 迁移管理器
class MigrationManager {
  private readonly migrationPath: string;
  private readonly historyPath: string;

  constructor(private db: DB, dbConfig: DatabaseConfig) {
    this.migrationPath = path.join(dbConfig.rootPath, "sqls");
    this.historyPath = path.join(dbConfig.dataPath, "history.json");
  }

  async runMigrations(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();

    let hasErrors = false;
    const newlyExecuted: string[] = [];

    for (const fileName of migrationFiles) {
      if (executedMigrations.includes(fileName)) {
        log.info(`跳过已执行的迁移: ${fileName}`);
        continue;
      }

      try {
        await this.executeMigration(fileName);
        newlyExecuted.push(fileName);
        log.info(`迁移执行成功: ${fileName}`);
      } catch (error) {
        log.error(`迁移执行失败 ${fileName}: ${error}`);
        hasErrors = true;
        break;
      }
    }

    if (newlyExecuted.length > 0) {
      await this.saveMigrationHistory([
        ...executedMigrations,
        ...newlyExecuted,
      ]);
    }

    if (hasErrors) {
      throw new Error("数据库迁移过程中出现错误");
    }
  }

  private async getExecutedMigrations(): Promise<string[]> {
    try {
      const content = await Deno.readTextFile(this.historyPath);
      const history: string[] = JSON.parse(content);
      return history || [];
    } catch {
      return [];
    }
  }

  private async getMigrationFiles(): Promise<string[]> {
    const files: string[] = [];
    try {
      for await (const entry of Deno.readDir(this.migrationPath)) {
        if (!entry.isDirectory && entry.name.endsWith(".sql")) {
          files.push(entry.name);
        }
      }
    } catch (error) {
      log.error(`读取迁移文件目录失败: ${error}`);
      throw error;
    }
    return files.sort((a, b) => a.localeCompare(b));
  }

  private async executeMigration(fileName: string): Promise<void> {
    const filePath = path.join(this.migrationPath, fileName);
    const sqlContent = await Deno.readTextFile(filePath);
    const statements = this.parseSqlStatements(sqlContent);
    for (const statement of statements) {
      if (statement.trim()) {
        this.db.query(statement);
      }
    }
  }

  private parseSqlStatements(sqlContent: string): string[] {
    return sqlContent
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("--"))
      .join(" ")
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);
  }

  private async saveMigrationHistory(migrations: string[]): Promise<void> {
    await Deno.writeTextFile(
      this.historyPath,
      JSON.stringify(migrations, null, 2),
    );
  }
}

// 查询结果处理器
class ResultProcessor {
  static processRows(rows: unknown[][], sql: string): QueryResult[] {
    if (rows.length === 0) return [];

    const columns = this.extractColumnNames(sql);
    return rows.map((row) => {
      const result: QueryResult = {};
      (row as unknown[]).forEach((value, index) => {
        const columnName = columns[index] || `column_${index}`;
        result[columnName] = value;
      });
      return result;
    });
  }

  static processSingleRow(rows: unknown[][], sql: string): QueryResult | null {
    if (rows.length === 0) return null;

    const columns = this.extractColumnNames(sql);
    const result: QueryResult = {};
    (rows[0] as unknown[]).forEach((value, index) => {
      const columnName = columns[index] || `column_${index}`;
      result[columnName] = value;
    });
    return result;
  }

  private static extractColumnNames(sql: string): string[] {
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    if (!selectMatch) return [];

    return selectMatch[1]
      .split(",")
      .map((col) => col.trim().split(/\s+/).pop() || "")
      .filter((name) => name && !name.includes("("));
  }
}

// 准备语句包装类
class PreparedStatement {
  private readonly sql: string;
  private readonly db: DB;

  constructor(db: DB, sql: string) {
    this.db = db;
    this.sql = sql;
  }

  all(...params: unknown[]): QueryResult[] {
    try {
      const queryParams = this.normalizeParams(params);
      const rows = this.db.query(this.sql, queryParams);
      return ResultProcessor.processRows(rows, this.sql);
    } catch (error) {
      log.error(`PreparedStatement.all 执行失败: ${error}`);
      throw error;
    }
  }

  get(...params: unknown[]): QueryResult | null {
    try {
      const queryParams = this.normalizeParams(params);
      const rows = this.db.query(this.sql, queryParams);
      return ResultProcessor.processSingleRow(rows, this.sql);
    } catch (error) {
      log.error(`PreparedStatement.get 执行失败: ${error}`);
      throw error;
    }
  }

  run(...params: unknown[]): StatementResult {
    try {
      const queryParams = this.normalizeParams(params);
      this.db.query(this.sql, queryParams);
      return { changes: this.db.changes, lastInsertRowId: this.db.lastInsertRowId };
    } catch (error) {
      log.error(`PreparedStatement.run 执行失败: ${error}`);
      throw error;
    }
  }

  private normalizeParams(params: unknown[]): unknown[] {
    return params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  }
}

// 主数据库助手类
class SqliteHelper {
  private static connectionManager: ConnectionManager | null = null;
  private static db: DB | null = null;

  /**
   * 兼容原有 DAO 代码的 pool 访问器
   * 返回扩展后的 DB 实例，支持 prepare/run/all 方法
   */
  static get pool(): ExtendedDB {
    if (!this.db) {
      throw new Error("数据库未初始化，请先调用 createPool()");
    }
    return this.db as ExtendedDB;
  }

  static async createPool(): Promise<void> {
    try {
      await this.ensureDataDirectory();

      const dbPath = path.join(config.dataPath, "database.db");
      this.connectionManager = ConnectionManager.getInstance(dbPath);
      this.connectionManager.connect();
      this.db = this.connectionManager.getConnection();

      this.extendDbPrototype();

      const migrationManager = new MigrationManager(this.db, config);
      await migrationManager.runMigrations();

      log.info("数据库连接池初始化完成");
    } catch (error) {
      log.error(`数据库连接池初始化失败: ${error}`);
      throw error;
    }
  }

  private static async ensureDataDirectory(): Promise<void> {
    try {
      await Deno.stat(config.dataPath);
    } catch {
      await Deno.mkdir(config.dataPath, { recursive: true });
      log.info(`创建数据目录: ${config.dataPath}`);
    }
  }

  private static extendDbPrototype(): void {
    if (!this.db) return;
    const db = this.db;

    (db as unknown as ExtendedDB).run = function (
      sql: string,
      ...params: unknown[]
    ): StatementResult {
      try {
        const normalizedParams = params.length === 1 && Array.isArray(params[0])
          ? params[0]
          : params;
        db.query(sql, normalizedParams);
        return { changes: db.changes, lastInsertRowId: db.lastInsertRowId };
      } catch (error) {
        log.error(`DB.run 执行失败: ${error}`);
        throw error;
      }
    };

    (db as unknown as ExtendedDB).all = function (
      sql: string,
      ...params: unknown[]
    ): QueryResult[] {
      try {
        const normalizedParams = params.length === 1 && Array.isArray(params[0])
          ? params[0]
          : params;
        const rows = db.query(sql, normalizedParams);
        return ResultProcessor.processRows(rows, sql);
      } catch (error) {
        log.error(`DB.all 执行失败: ${error}`);
        throw error;
      }
    };

    (db as unknown as ExtendedDB).prepare = function (sql: string): PreparedStatement {
      return new PreparedStatement(db, sql);
    };
  }

  static run(sql: string, ...params: unknown[]): StatementResult {
    if (!this.db) {
      throw new Error("数据库未初始化");
    }
    return (this.db as unknown as ExtendedDB).run(sql, params);
  }

  static all(sql: string, ...params: unknown[]): QueryResult[] {
    if (!this.db) {
      throw new Error("数据库未初始化");
    }
    return (this.db as unknown as ExtendedDB).all(sql, params);
  }

  static close(): void {
    if (this.connectionManager) {
      this.connectionManager.close();
      this.connectionManager = null;
      this.db = null;
    }
  }
}

export default SqliteHelper;
