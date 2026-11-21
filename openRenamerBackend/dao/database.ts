export type QueryResult = Record<string, unknown>;

export interface StatementResult {
  changes: number;
  lastInsertRowId?: number;
}

export interface PreparedStatement {
  get(...params: unknown[]): QueryResult | null;
  all(...params: unknown[]): QueryResult[];
}

export interface DatabasePool {
  prepare(sql: string): PreparedStatement;
  run(sql: string, ...params: unknown[]): StatementResult;
}

let currentPool: DatabasePool | null = null;

export function setDatabasePool(pool: DatabasePool): void {
  if (currentPool) {
    throw new Error("数据库已初始化");
  }
  currentPool = pool;
}

export function clearDatabasePool(pool: DatabasePool): void {
  if (currentPool === pool) {
    currentPool = null;
  }
}

export function getDatabasePool(): DatabasePool {
  if (!currentPool) {
    throw new Error("数据库未初始化，请先初始化数据库入口");
  }
  return currentPool;
}

export function normalizeParams(params: unknown[]): unknown[] {
  const normalized = params.length === 1 && Array.isArray(params[0])
    ? params[0]
    : params;
  return normalized.map((value) => value === undefined ? null : value);
}
