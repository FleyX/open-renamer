import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  copyFile,
  link,
  lstat,
  mkdir,
  readdir,
  realpath,
  rm,
  stat,
  unlink,
} from "node:fs/promises";
import path from "node:path";

import type AiGenerateDto from "../entity/dto/AiGenerateDto.ts";
import type AiPreviewEditDto from "../entity/dto/AiPreviewEditDto.ts";
import type AiSubmitDto from "../entity/dto/AiSubmitDto.ts";
import type AiRenameRow from "../entity/vo/AiRenameRow.ts";
import ErrorHelper from "../util/ErrorHelper.ts";

export type MessageLookup = (key: string) => string;

interface AiBatch {
  id: string;
  targetRoot: string;
  rows: Array<AiRenameRow>;
  version: number;
  consumed: boolean;
  expiresAt: number;
}

interface BatchAccess {
  batch: AiBatch;
}

const BATCH_TTL_MS = 30 * 60 * 1000;
const MODEL_TIMEOUT_MS = 60 * 1000;

class AiRenameService {
  private batches = new Map<string, AiBatch>();
  private inFlight = new Set<string>();

  /**
   * 生成结构化预览：组装模型上下文、调用 OpenAI 兼容服务并校验结果。
   * 出错时返回不含密钥的预览反馈。
   */
  async generate(
    dto: AiGenerateDto,
    getMessage: MessageLookup,
  ): Promise<{
    batchId: string;
    version: number;
    rows: Array<AiRenameRow>;
    error?: string;
  }> {
    this.sweepExpired();
    const empty = { batchId: "", version: 0, rows: [] as Array<AiRenameRow> };
    const sources = this.normalizeSources(dto);
    if (sources.length === 0) {
      return { ...empty, error: getMessage("ai.no-files") };
    }
    const instruction = (dto.instruction ?? "").trim();
    if (instruction.length === 0) {
      return { ...empty, error: getMessage("ai.instruction-required") };
    }
    const targetRoot = dto.targetRoot ?? "";
    if (targetRoot.length === 0) {
      return { ...empty, error: getMessage("ai.target-root-required") };
    }
    const rootReal = path.isAbsolute(targetRoot)
      ? await AiRenameService.realpathOrNull(targetRoot)
      : null;
    const rootInfo = rootReal && await AiRenameService.safeStat(rootReal);
    if (!rootReal || !rootInfo || !rootInfo.isDirectory()) {
      return { ...empty, error: getMessage("ai.target-root-invalid") };
    }

    const lines = sources.map((item, index) => ({
      id: `L${String(index + 1).padStart(3, "0")}`,
      source: item.source,
      context: AiRenameService.contextPath(
        item.source,
        item.sourceDir || (dto.baseDir ?? ""),
      ),
    }));

    let parsed: Array<Record<string, unknown>>;
    try {
      parsed = await this.callModel(dto, lines, instruction);
    } catch {
      return { ...empty, error: getMessage("ai.model-request-failed") };
    }

    const rows = new Map<string, AiRenameRow>();
    for (const line of lines) {
      rows.set(line.id, {
        id: line.id,
        sourcePath: line.source,
        contextPath: line.context,
        targetRel: "",
        targetAbs: "",
        problem: getMessage("ai.missing-result"),
      });
    }
    const seenIds = new Set<string>();
    for (const item of parsed) {
      if (
        item === null ||
        typeof item !== "object" ||
        typeof item.id !== "string" ||
        !rows.has(item.id) ||
        seenIds.has(item.id)
      ) {
        return { ...empty, error: getMessage("ai.model-response-invalid") };
      }
      seenIds.add(item.id);
      const row = rows.get(item.id)!;
      if (typeof item.problem === "string" && item.problem.trim().length > 0) {
        row.problem = item.problem.trim();
      } else if (
        typeof item.target === "string" &&
        item.target.trim().length > 0
      ) {
        row.targetRel = item.target.trim();
        row.problem = "";
      } else {
        row.problem = getMessage("ai.missing-result");
      }
    }

    const batch = this.createBatch(rootReal, [...rows.values()]);
    await this.validateBatch(batch, getMessage);
    return { batchId: batch.id, version: batch.version, rows: batch.rows };
  }

  /**
   * 编辑后重新校验整批，不请求模型。
   * 只接受原批次中每个行标识恰好一次的映射；先校验副本，通过后再发布新版本，
   * 避免与提交同时修改同一份数据。
   */
  async validatePreview(
    dto: AiPreviewEditDto,
    getMessage: MessageLookup,
  ): Promise<{ batchId: string; version: number; rows: Array<AiRenameRow> }> {
    const { batch } = this.accessBatch(dto.batchId, getMessage);
    this.sweepExpired();
    if (this.inFlight.has(batch.id)) {
      throw ErrorHelper.Error400(getMessage("ai.batch-in-flight"));
    }
    if (batch.consumed) {
      throw ErrorHelper.Error400(getMessage("ai.batch-version-mismatch"));
    }
    const byId = new Map(batch.rows.map((row) => [row.id, row]));
    const submitted = dto.rows ?? [];
    if (submitted.length !== batch.rows.length) {
      throw ErrorHelper.Error400(getMessage("ai.model-response-invalid"));
    }
    const seen = new Set<string>();
    const nextRows: Array<AiRenameRow> = [];
    for (const edited of submitted) {
      const existing = byId.get(edited?.id);
      if (!existing || seen.has(edited.id) || typeof edited.targetRel !== "string") {
        throw ErrorHelper.Error400(getMessage("ai.model-response-invalid"));
      }
      seen.add(edited.id);
      nextRows.push({ ...existing, targetRel: edited.targetRel });
    }
    const draft: AiBatch = { ...batch, rows: nextRows };
    await this.validateBatch(draft, getMessage);
    if (this.inFlight.has(batch.id) || batch.version !== draft.version ||
      this.batches.get(batch.id) !== batch) {
      throw ErrorHelper.Error400(getMessage("ai.batch-version-mismatch"));
    }
    batch.rows = draft.rows;
    batch.version += 1;
    return { batchId: batch.id, version: batch.version, rows: batch.rows };
  }

  /**
   * 提交当前预览版本：只接收批次标识和版本，完全使用服务器当前已校验的映射。
   * 服务器重复整批校验后执行同盘移动，执行遇错停止，返回 completed、failed、pending。
   * 执行结束后（包括部分执行）使预览版本失效。
   */
  async submit(
    dto: AiSubmitDto,
    getMessage: MessageLookup,
  ): Promise<{
    completed: Array<AiRenameRow>;
    failed: Array<{ row: AiRenameRow; error: string }>;
    pending: Array<AiRenameRow>;
  }> {
    const { batch } = this.accessBatch(dto.batchId, getMessage);
    this.sweepExpired();
    if (batch.consumed || batch.version !== dto.version) {
      throw ErrorHelper.Error400(getMessage("ai.batch-version-mismatch"));
    }
    if (this.inFlight.has(batch.id)) {
      throw ErrorHelper.Error400(getMessage("ai.batch-in-flight"));
    }
    this.inFlight.add(batch.id);
    let executionStarted = false;
    try {
      await this.validateBatch(batch, getMessage);
      const unresolved = batch.rows.filter((row) => row.problem !== "");
      if (unresolved.length > 0) {
        throw ErrorHelper.Error400(
          getMessage("ai.batch-has-problems") + unresolved[0].sourcePath,
        );
      }

      const completed: Array<AiRenameRow> = [];
      const failed: Array<{ row: AiRenameRow; error: string }> = [];
      executionStarted = true;
      for (let index = 0; index < batch.rows.length; index++) {
        const row = batch.rows[index];
        try {
          await this.moveRow(row, batch.targetRoot, getMessage);
          completed.push(row);
        } catch (error) {
          failed.push({
            row,
            error: error instanceof Error ? error.message : String(error),
          });
          return {
            completed,
            failed,
            pending: batch.rows.slice(index + 1),
          };
        }
      }
      return { completed, failed, pending: [] };
    } finally {
      this.inFlight.delete(batch.id);
      if (executionStarted) {
        batch.consumed = true;
        batch.version += 1;
      }
    }
  }

  /** 源文件按绝对路径去重，保留每个文件实际来自的所选目录 */
  private normalizeSources(
    dto: AiGenerateDto,
  ): Array<{ source: string; sourceDir: string }> {
    const seen = new Set<string>();
    const sources: Array<{ source: string; sourceDir: string }> = [];
    for (const file of dto.files ?? []) {
      if (!file || typeof file.path !== "string" || typeof file.name !== "string") {
        continue;
      }
      const absolute = path.resolve(file.path, file.name);
      if (seen.has(absolute)) {
        continue;
      }
      seen.add(absolute);
      const sourceDir =
        typeof file.sourceDir === "string" ? file.sourceDir.trim() : "";
      sources.push({ source: absolute, sourceDir });
    }
    return sources;
  }

  /**
   * 模型上下文路径：目录选择时相对于该文件实际来自的所选目录，
   * 直接选文件时取最近两级父目录；Windows 根盘符不出现在模型输入中。
   */
  private static contextPath(source: string, sourceDir: string): string {
    const normalize = (value: string) => value.split(path.sep).join("/");
    if (sourceDir.trim().length > 0) {
      const relative = path.relative(path.resolve(sourceDir), source);
      if (
        relative.length > 0 &&
        relative !== ".." && !relative.startsWith(".." + path.sep) &&
        !path.isAbsolute(relative)
      ) {
        return normalize(relative);
      }
    }
    return source
      .slice(path.parse(source).root.length)
      .split(path.sep)
      .slice(-3).join("/");
  }

  private static modelEndpoint(baseUrl: string): string {
    const trimmed = baseUrl.trim().replace(/\/+$/, "");
    if (trimmed.endsWith("/chat/completions")) {
      return trimmed;
    }
    return `${trimmed}/chat/completions`;
  }

  private async callModel(
    dto: AiGenerateDto,
    lines: Array<{ id: string; source: string; context: string }>,
    instruction: string,
  ): Promise<Array<Record<string, unknown>>> {
    const messages = [
      {
        role: "system",
        content:
          "You generate target relative paths for files according to a user naming specification. " +
          "Reply with ONLY a JSON array. Each element is either " +
          '{"id":"<line id>","target":"<relative path under the target root>"} or ' +
          '{"id":"<line id>","problem":"<short reason>"}. ' +
          "Do not use absolute paths and do not output anything outside the JSON array.",
      },
      {
        role: "user",
        content:
          "Naming specification:\n" +
          instruction +
          "\n\nFiles (id and relative path):\n" +
          lines.map((line) => `${line.id} ${line.context}`).join("\n"),
      },
    ];
    const controller = new AbortController();
    // 超时保持到响应体解析完成，避免半截响应被当成成功结果
    const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
    let response: Response;
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      const apiKey = (dto.service.apiKey ?? "").trim();
      if (apiKey.length > 0) {
        headers.authorization = `Bearer ${apiKey}`;
      }
      response = await fetch(AiRenameService.modelEndpoint(dto.service.baseUrl), {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: dto.service.model,
          messages,
          temperature: 0,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`model http ${response.status}`);
      }
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      const text =
        typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content
                .filter(
                  (part): part is { text: string } =>
                    part !== null &&
                    typeof part === "object" &&
                    typeof (part as { text?: unknown }).text === "string",
                )
                .map((part) => part.text)
                .join("")
            : "";
      const trimmed = text.trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        const start = trimmed.indexOf("[");
        const end = trimmed.lastIndexOf("]");
        if (start < 0 || end <= start) {
          throw new Error("model content is not json");
        }
        parsed = JSON.parse(trimmed.slice(start, end + 1));
      }
      if (!Array.isArray(parsed)) {
        throw new Error("model content is not an array");
      }
      return parsed as Array<Record<string, unknown>>;
    } finally {
      clearTimeout(timer);
    }
  }

  private createBatch(
    targetRoot: string,
    rows: Array<AiRenameRow>,
  ): AiBatch {
    const now = Date.now();
    const batch: AiBatch = {
      id: randomUUID(),
      targetRoot: path.resolve(targetRoot),
      rows,
      version: 1,
      consumed: false,
      expiresAt: now + BATCH_TTL_MS,
    };
    this.batches.set(batch.id, batch);
    return batch;
  }

  private accessBatch(
    batchId: string,
    getMessage: MessageLookup,
  ): BatchAccess {
    const batch = this.batches.get(batchId ?? "");
    if (!batch) {
      throw ErrorHelper.Error400(getMessage("ai.batch-not-found"));
    }
    if (Date.now() > batch.expiresAt) {
      this.batches.delete(batch.id);
      throw ErrorHelper.Error400(getMessage("ai.batch-expired"));
    }
    return { batch };
  }

  /** 清理已过期批次 */
  private sweepExpired(): void {
    const now = Date.now();
    for (const [id, batch] of this.batches) {
      if (now > batch.expiresAt) {
        this.batches.delete(id);
      }
    }
  }

  /**
   * candidate 是否位于 root 内（含相等）。正确处理文件系统根路径。
   */
  private static isWithin(root: string, candidate: string): boolean {
    if (candidate === root) {
      return true;
    }
    const prefix = root.endsWith(path.sep) ? root : root + path.sep;
    return candidate.startsWith(prefix);
  }

  /**
   * 整批校验：结构、目标相对路径合法性、重复、父目录冲突、已有目标、
   * 符号链接链条越界、非目录父级、覆盖其他源文件、源文件、同盘。
   * 结果写入每行的 problem。
   */
  private async validateBatch(
    batch: AiBatch,
    getMessage: MessageLookup,
  ): Promise<void> {
    const root = batch.targetRoot;
    const rootStat = await AiRenameService.safeStat(root);
    if (!rootStat || !rootStat.isDirectory() ||
      await AiRenameService.realpathOrNull(root) !== root) {
      for (const row of batch.rows) {
        row.problem = getMessage("ai.target-root-invalid");
        row.targetAbs = "";
      }
      return;
    }
    const lowerSources = new Set(
      batch.rows.map((row) => row.sourcePath.toLowerCase()),
    );
    const targetSeen = new Map<string, string>();
    const withTarget: Array<{ row: AiRenameRow; key: string }> = [];
    for (const row of batch.rows) {
      // 生成失败或缺少目标时保留明确反馈，用户补全后才清除该条问题
      const previousProblem = row.problem;
      const hadValidTarget = (row.targetAbs ?? "") !== "";
      row.problem = "";
      const targetRel = row.targetRel;
      if (targetRel.length === 0) {
        row.problem =
          !hadValidTarget && previousProblem
            ? previousProblem
            : getMessage("ai.target-invalid");
        row.targetAbs = "";
        continue;
      }
      const normalized = AiRenameService.normalizeTarget(root, targetRel);
      if (normalized === null) {
        row.problem = getMessage("ai.target-outside-root");
        row.targetAbs = "";
        continue;
      }
      row.targetRel = normalized;
      const targetAbs = path.join(root, ...normalized.split("/"));
      row.targetAbs = targetAbs;
      if (targetAbs === row.sourcePath) {
        if (!await AiRenameService.checkSource(row.sourcePath)) {
          row.problem = getMessage("ai.source-missing");
        }
        continue; // 同源同目标：优雅地作为无操作项
      }
      const key = targetAbs.toLowerCase();
      if (targetSeen.has(key)) {
        row.problem = getMessage("ai.duplicate-target");
        continue;
      }
      targetSeen.set(key, row.id);
      withTarget.push({ row, key });
    }
    // 某目标是另一目标的父目录时，先建目录为文件的目标必然失败
    for (const { row, key } of withTarget) {
      for (const other of withTarget) {
        if (other.row.id === row.id) {
          continue;
        }
        if (key.startsWith(other.key + path.sep)) {
          row.problem = getMessage("ai.target-parent-conflict");
          break;
        }
      }
    }
    for (const { row } of withTarget) {
      if (row.problem !== "") {
        continue;
      }
      // 目标不得覆盖批次内其他条目的源文件
      if (lowerSources.has(row.targetAbs.toLowerCase())) {
        row.problem = getMessage("ai.target-overwrites-source");
        continue;
      }
      const parentIssue = await AiRenameService.checkTargetParents(
        root,
        row.targetAbs,
      );
      if (parentIssue !== null) {
        row.problem = getMessage(
          parentIssue === "not-dir"
            ? "ai.target-parent-not-directory"
            : "ai.target-outside-root",
        );
        continue;
      }
      if (await AiRenameService.checkTargetExists(row.targetAbs)) {
        row.problem = getMessage("ai.target-exists");
        continue;
      }
      const sourceStat = await AiRenameService.checkSource(row.sourcePath);
      if (!sourceStat) {
        row.problem = getMessage("ai.source-missing");
        continue;
      }
      // 按实际最近已有目录判断同盘
      const nearest = await AiRenameService.nearestExistingDir(row.targetAbs);
      if (!nearest || sourceStat.dev !== nearest.dev) {
        row.problem = getMessage("ai.cross-device");
      }
    }
  }

  /**
   * 校验目标相对路径：拒绝空、NUL、绝对路径、Windows 盘符路径与上级跳转，
   * 返回标准化相对路径
   */
  private static normalizeTarget(
    root: string,
    targetRel: string,
  ): string | null {
    if (targetRel.includes("\0")) {
      return null;
    }
    const unixStyle = targetRel.replace(/\\/g, "/");
    if (unixStyle.startsWith("/") || /^[a-zA-Z]:/.test(unixStyle)) {
      return null;
    }
    const segments = unixStyle.split("/");
    const clean: Array<string> = [];
    for (const segment of segments) {
      if (segment.length === 0 || segment === ".") {
        continue;
      }
      if (segment === "..") {
        return null;
      }
      if (process.platform === "win32" && (
        /[<>:"|?*\x00-\x1f]/.test(segment) ||
        /[. ]$/.test(segment) ||
        /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(segment)
      )) {
        return null;
      }
      clean.push(segment);
    }
    if (clean.length === 0) {
      return null;
    }
    const rootResolved = path.resolve(root);
    const resolved = path.resolve(rootResolved, ...clean);
    if (!AiRenameService.isWithin(rootResolved, resolved)) {
      return null;
    }
    return clean.join("/");
  }

  /**
   * 检查目标路径在目标根目录内的每一级父级：
   * 父级须位于已解析的根目录内，且每个已存在的父级均为普通目录。
   * 返回 null 表示通过，否则为问题代码。
   */
  private static async checkTargetParents(
    root: string,
    targetAbs: string,
  ): Promise<null | "escape" | "not-dir"> {
    const rootResolved = path.resolve(root);
    const relative = path.relative(rootResolved, targetAbs);
    if (
      relative.length === 0 ||
      relative === ".." || relative.startsWith(".." + path.sep) ||
      path.isAbsolute(relative)
    ) {
      return "escape";
    }
    const parts = relative.split(path.sep);
    let current = rootResolved;
    for (let index = 0; index < parts.length - 1; index++) {
      current = path.join(current, parts[index]);
      const info = await AiRenameService.safeLstat(current);
      if (!info) {
        return null; // 其余各级由本次提交创建
      }
      if (info.isSymbolicLink()) {
        return "escape";
      }
      if (!info.isDirectory()) {
        return "not-dir";
      }
    }
    return null;
  }

  /** 目标路径的最近已有祖先目录（跟随链接），用于同盘判断 */
  private static async nearestExistingDir(
    targetAbs: string,
  ): Promise<{ dev: number } | null> {
    let current = path.dirname(targetAbs);
    for (;;) {
      const info = await AiRenameService.safeStat(current);
      if (info) {
        return info.isDirectory() ? { dev: info.dev } : null;
      }
      const parent = path.dirname(current);
      if (parent === current) {
        return null;
      }
      current = parent;
    }
  }

  private static async realpathOrNull(target: string): Promise<string | null> {
    try {
      return await realpath(target);
    } catch {
      return null;
    }
  }

  private static async checkTargetExists(targetAbs: string): Promise<boolean> {
    const exact = await AiRenameService.safeLstat(targetAbs);
    if (exact) {
      return true;
    }
    const parent = path.dirname(targetAbs);
    const parentStat = await AiRenameService.safeStat(parent);
    if (!parentStat || !parentStat.isDirectory()) {
      return false;
    }
    const fileName = path.basename(targetAbs).toLowerCase();
    try {
      const entries = await readdir(parent);
      return entries.some((entry) => entry.toLowerCase() === fileName);
    } catch {
      return false;
    }
  }

  private static async checkSource(
    sourcePath: string,
  ): Promise<{ dev: number } | null> {
    try {
      const info = await lstat(sourcePath);
      if (!info.isFile()) {
        return null;
      }
      return { dev: info.dev };
    } catch {
      return null;
    }
  }

  private static async safeStat(
    target: string,
  ): Promise<{ isDirectory(): boolean; dev: number } | null> {
    try {
      return await stat(target);
    } catch {
      return null;
    }
  }

  private static async safeLstat(
    target: string,
  ): Promise<{ isDirectory(): boolean; isSymbolicLink(): boolean } | null> {
    try {
      return await lstat(target);
    } catch {
      return null;
    }
  }

  /**
   * 同盘移动且不覆盖目标：先排他创建硬链接再删除源文件；
   * 文件系统不支持硬链接时退化为排他复制再删除（跨盘移动由票据 05 提供）。
   * 两步之间失败时只回收本次创建且仍匹配的目标。
   */
  private async moveRow(
    row: AiRenameRow,
    targetRoot: string,
    getMessage: MessageLookup,
  ): Promise<void> {
    const source = row.sourcePath;
    const target =
      row.targetAbs || path.join(targetRoot, ...row.targetRel.split("/"));
    if (source === target) {
      return; // 同源同目标的无操作项
    }
    let createdIdentity: { dev: number; ino: number } | null = null;
    const cleanupCreated = async (): Promise<void> => {
      if (!createdIdentity) {
        return;
      }
      try {
        const info = await lstat(target);
        if (
          info.dev === createdIdentity.dev &&
          info.ino === createdIdentity.ino
        ) {
          await rm(target);
        }
      } catch {
        // 目标已不存在或已被替换，保持真实磁盘状态
      }
    };
    try {
      if (await AiRenameService.realpathOrNull(targetRoot) !== targetRoot ||
        await AiRenameService.checkTargetParents(targetRoot, target)) {
        throw new Error(getMessage("ai.target-outside-root"));
      }
      await mkdir(path.dirname(target), { recursive: true });
      if (await AiRenameService.realpathOrNull(path.dirname(target)) !==
        path.dirname(target)) {
        throw new Error(getMessage("ai.target-outside-root"));
      }
      try {
        await link(source, target);
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (
          code === "EPERM" ||
          code === "ENOSYS" ||
          code === "EOPNOTSUPP" ||
          code === "ENOTSUP"
        ) {
          await copyFile(source, target, constants.COPYFILE_EXCL);
        } else {
          throw error;
        }
      }
      createdIdentity = await this.identityOf(target);
      await unlink(source);
    } catch (error) {
      await cleanupCreated();
      throw new Error(
        getMessage("ai.move-failed") +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  private async identityOf(
    target: string,
  ): Promise<{ dev: number; ino: number } | null> {
    try {
      const info = await lstat(target);
      return { dev: info.dev, ino: info.ino };
    } catch {
      return null;
    }
  }
}

export default AiRenameService;
