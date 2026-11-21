import { DB, type QueryParameter } from "deno-sqlite";
import * as path from "std/path/mod.ts";
import * as log from "std/log/mod.ts";
import config from "../config.ts";
import {
  clearDatabasePool,
  normalizeParams,
  setDatabasePool,
  type DatabasePool,
  type PreparedStatement,
  type QueryResult,
  type StatementResult,
} from "../dao/database.ts";
import {
  runMigrations,
  type MigrationRuntime,
  type MigrationSqlite,
} from "./MigrationManager.ts";

class DenoPreparedStatement implements PreparedStatement {
  constructor(private readonly db: DB, private readonly sql: string) {}

  all(...params: unknown[]): QueryResult[] {
    return this.db.queryEntries(
      this.sql,
      normalizeParams(params) as QueryParameter[],
    ) as QueryResult[];
  }

  get(...params: unknown[]): QueryResult | null {
    const rows = this.all(...params);
    return rows.length > 0 ? rows[0] : null;
  }
}

class DenoDatabasePool implements DatabasePool {
  readonly db: DB;

  constructor(dbPath: string) {
    this.db = new DB(dbPath);
  }

  prepare(sql: string): PreparedStatement {
    return new DenoPreparedStatement(this.db, sql);
  }

  run(sql: string, ...params: unknown[]): StatementResult {
    this.db.query(sql, normalizeParams(params) as QueryParameter[]);
    return {
      changes: this.db.changes,
      lastInsertRowId: this.db.lastInsertRowId,
    };
  }

  close(): void {
    this.db.close();
  }
}

class DenoMigrationSqlite implements MigrationSqlite {
  constructor(private readonly pool: DenoDatabasePool) {}

  exec(sql: string): void {
    this.pool.db.execute(sql);
  }

  getAppliedMigrations(): string[] {
    return this.pool.db.queryEntries<{ fileName: string }>(
      "select fileName from _open_renamer_migrations",
    ).map((row) => row.fileName);
  }

  recordMigration(fileName: string): void {
    this.pool.run(
      "insert or ignore into _open_renamer_migrations(fileName,appliedAt) values(?,?)",
      fileName,
      Date.now(),
    );
  }
}

class SqliteHelper {
  private static pool: DenoDatabasePool | null = null;

  static async createPool(): Promise<void> {
    await this.ensureDataDirectory();

    const dbPath = path.join(config.dataPath, "database.db");
    const pool = new DenoDatabasePool(dbPath);
    try {
      setDatabasePool(pool);
      const migrationSqlite = new DenoMigrationSqlite(pool);
      const runtime: MigrationRuntime = {
        db: migrationSqlite,
        listMigrationFiles: async () => {
          const files: string[] = [];
          for await (const entry of Deno.readDir(
            path.join(config.rootPath, "sqls"),
          )) {
            if (!entry.isDirectory && entry.name.endsWith(".sql")) {
              files.push(entry.name);
            }
          }
          return files;
        },
        readMigrationFile: (fileName) =>
          Deno.readTextFile(path.join(config.rootPath, "sqls", fileName)),
        readHistory: async () => {
          try {
            const content = await Deno.readTextFile(
              path.join(config.dataPath, "history.json"),
            );
            const parsed: unknown = JSON.parse(content);
            return Array.isArray(parsed)
              ? parsed.filter((item): item is string => typeof item === "string")
              : [];
          } catch {
            return [];
          }
        },
        writeHistory: (fileNames) =>
          Deno.writeTextFile(
            path.join(config.dataPath, "history.json"),
            JSON.stringify(fileNames, null, 2),
          ),
        info: (message) => log.info(message),
        error: (message, error) => log.error(message, error),
      };
      await runMigrations(runtime);
      this.pool = pool;
      log.info(`数据库连接成功: ${dbPath}`);
      log.info("数据库连接池初始化完成");
    } catch (error) {
      clearDatabasePool(pool);
      pool.close();
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

  static close(): void {
    if (this.pool) {
      clearDatabasePool(this.pool);
      this.pool.close();
      this.pool = null;
    }
  }
}

export default SqliteHelper;
