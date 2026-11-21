export interface MigrationSqlite {
  exec(sql: string): void;
  getAppliedMigrations(): string[];
  recordMigration(fileName: string): void;
}

export interface MigrationRuntime {
  db: MigrationSqlite;
  listMigrationFiles(): Promise<string[]>;
  readMigrationFile(fileName: string): Promise<string>;
  readHistory(): Promise<string[]>;
  writeHistory(fileNames: string[]): Promise<void>;
  info(message: string): void;
  error(message: string, error?: unknown): void;
}

const MIGRATION_TABLE = "_open_renamer_migrations";

/**
 * Run migration files in lexical order. The SQL is passed to SQLite as a
 * single script so SQLite, rather than JavaScript string parsing, understands
 * comments, quoting, and statement boundaries. The migration and its durable
 * completion marker commit in the same transaction.
 */
export async function runMigrations(runtime: MigrationRuntime): Promise<void> {
  const { db } = runtime;
  db.exec(
    `CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (` +
      "fileName TEXT NOT NULL PRIMARY KEY, appliedAt INTEGER NOT NULL)",
  );

  const historicalMigrations = await runtime.readHistory();
  for (const fileName of historicalMigrations) {
    db.recordMigration(fileName);
  }

  const migrationFiles = (await runtime.listMigrationFiles()).sort((a, b) =>
    a.localeCompare(b),
  );
  const applied = new Set(db.getAppliedMigrations());

  for (const fileName of migrationFiles) {
    if (applied.has(fileName)) {
      runtime.info(`跳过已执行的迁移: ${fileName}`);
      continue;
    }

    const sql = await runtime.readMigrationFile(fileName);
    db.exec("BEGIN IMMEDIATE");
    try {
      const alreadyApplied = db.getAppliedMigrations().includes(fileName);
      if (!alreadyApplied) {
        db.exec(sql);
        db.recordMigration(fileName);
      }
      db.exec("COMMIT");
      applied.add(fileName);
      runtime.info(alreadyApplied
        ? `跳过已执行的迁移: ${fileName}`
        : `迁移执行成功: ${fileName}`);
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // The setup transaction may already have been rolled back by SQLite.
      }
      runtime.error(`迁移执行失败 ${fileName}`, error);
      throw new Error("数据库迁移过程中出现错误", { cause: error });
    }
  }

  const completed = db.getAppliedMigrations().sort((a, b) =>
    a.localeCompare(b),
  );
  if (completed.every((fileName, index) => fileName === historicalMigrations[index]) &&
    completed.length === historicalMigrations.length) {
    return;
  }
  try {
    await runtime.writeHistory(completed);
  } catch (error) {
    // The SQLite marker is authoritative. A later start will restore history
    // without replaying committed migrations.
    runtime.error("写入迁移历史失败，将在下次启动时重试", error);
  }
}
