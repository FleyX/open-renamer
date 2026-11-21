import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from "node:sqlite";
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
} from "../util/MigrationManager.ts";

class NodePreparedStatement implements PreparedStatement {
  private readonly statement: StatementSync;

  constructor(db: DatabaseSync, sql: string) {
    this.statement = db.prepare(sql);
  }

  all(...params: unknown[]): QueryResult[] {
    const values = normalizeParams(params) as SQLInputValue[];
    return this.statement.all(...values) as QueryResult[];
  }

  get(...params: unknown[]): QueryResult | null {
    const values = normalizeParams(params) as SQLInputValue[];
    return (this.statement.get(...values) as QueryResult | undefined) ?? null;
  }
}

class NodeDatabasePool implements DatabasePool {
  readonly db: DatabaseSync;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
  }

  prepare(sql: string): PreparedStatement {
    return new NodePreparedStatement(this.db, sql);
  }

  run(sql: string, ...params: unknown[]): StatementResult {
    const statement = this.db.prepare(sql);
    const values = normalizeParams(params) as SQLInputValue[];
    const result = statement.run(...values);
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowid),
    };
  }

  close(): void {
    this.db.close();
  }
}

class NodeMigrationSqlite implements MigrationSqlite {
  private readonly pool: NodeDatabasePool;

  constructor(pool: NodeDatabasePool) {
    this.pool = pool;
  }

  exec(sql: string): void {
    this.pool.db.exec(sql);
  }

  getAppliedMigrations(): string[] {
    const rows = this.pool.prepare(
      "select fileName from _open_renamer_migrations",
    ).all();
    return rows.map((row) => row.fileName as string);
  }

  recordMigration(fileName: string): void {
    this.pool.run(
      "insert or ignore into _open_renamer_migrations(fileName,appliedAt) values(?,?)",
      fileName,
      Date.now(),
    );
  }
}

export interface NodeDatabase {
  close(): void;
}

export async function openNodeDatabase(
  dataPath: string,
  resourceRootPath: string,
): Promise<NodeDatabase> {
  await mkdir(dataPath, { recursive: true });
  const dbPath = path.join(dataPath, "database.db");
  const pool = new NodeDatabasePool(dbPath);

  const historyPath = path.join(dataPath, "history.json");
  const runtime: MigrationRuntime = {
    db: new NodeMigrationSqlite(pool),
    listMigrationFiles: async () => {
      const entries = await readdir(path.join(resourceRootPath, "sqls"), {
        withFileTypes: true,
      });
      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
        .map((entry) => entry.name);
    },
    readMigrationFile: (fileName) =>
      readFile(path.join(resourceRootPath, "sqls", fileName), "utf8"),
    readHistory: async () => {
      try {
        const parsed: unknown = JSON.parse(await readFile(historyPath, "utf8"));
        return Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === "string")
          : [];
      } catch {
        return [];
      }
    },
    writeHistory: (fileNames) =>
      writeFile(historyPath, JSON.stringify(fileNames, null, 2)),
    info: (message) => console.info(message),
    error: (message, error) => console.error(message, error),
  };

  try {
    setDatabasePool(pool);
    await runMigrations(runtime);
  } catch (error) {
    clearDatabasePool(pool);
    pool.close();
    throw error;
  }

  return {
    close: () => {
      clearDatabasePool(pool);
      pool.close();
    },
  };
}
