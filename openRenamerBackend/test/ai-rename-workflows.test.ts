import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { startNodeServer, type RunningNodeServer } from "../index.node.ts";
import AiRenameService from "../service/AiRenameService.ts";
import type AiRenameRow from "../entity/vo/AiRenameRow.ts";

const resourceRootPath = path.resolve(import.meta.dirname, "..");

interface FileObj {
  name: string;
  path: string;
  isFolder: boolean;
  size: number;
  checked?: boolean;
}

interface MockModel {
  url: string;
  requests: Array<Record<string, unknown>>;
  close(): Promise<void>;
}

async function startMockModel(
  handler: (body: Record<string, unknown>) => unknown,
): Promise<MockModel> {
  const requests: Array<Record<string, unknown>> = [];
  const server: Server = createServer((request, response) => {
    const chunks: Array<Buffer> = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const body = JSON.parse(
        Buffer.concat(chunks).toString("utf8") || "{}",
      ) as Record<string, unknown>;
      requests.push(body);
      const result = handler(body);
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify(result));
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

function chatCompletion(content: string): unknown {
  return {
    choices: [{ message: { role: "assistant", content } }],
  };
}

async function start(dataPath: string): Promise<RunningNodeServer> {
  return startNodeServer({
    host: "127.0.0.1",
    port: 0,
    dataPath,
    resourceRootPath,
    token: "test-token",
  });
}

async function request(
  server: RunningNodeServer,
  route: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${server.url}/openRenamer/api${route}`, {
    ...init,
    headers: {
      token: "test-token",
      "content-type": "application/json",
      lang: "zh",
      ...init.headers,
    },
  });
}

async function createFixtureRoot(name: string): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), `open-renamer-${name}-`));
}

function fileObj(absolute: string): FileObj {
  return {
    name: path.basename(absolute),
    path: path.dirname(absolute),
    isFolder: false,
    size: 1,
  };
}

interface PreviewResponse {
  batchId: string;
  version: number;
  rows: Array<AiRenameRow>;
  error?: string;
}

test("ai rename generate scopes model input and writes nothing", async () => {
  const dataPath = await createFixtureRoot("ai-data");
  const sourceRoot = await createFixtureRoot("ai-src");
  const targetRoot = await createFixtureRoot("ai-dst");
  const server = await start(dataPath);
  const movieDir = path.join(sourceRoot, "movies");
  await mkdir(movieDir, { recursive: true });
  const sourceA = path.join(movieDir, "aaa.mkv");
  const sourceB = path.join(movieDir, "bbb.mkv");
  await writeFile(sourceA, "aaa");
  await writeFile(sourceB, "bbb");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", target: "Sorted/aaa (2020)/aaa.mkv" },
        { id: "L002", target: "Sorted/bbb (2021)/bbb.mkv" },
      ]),
    ),
  );

  try {
    const response = await request(server, "/aiRename/generate", {
      method: "POST",
      body: JSON.stringify({
        files: [fileObj(sourceA), fileObj(sourceB), fileObj(sourceA)],
        baseDir: sourceRoot,
        targetRoot,
        instruction: "按 片名 (年份)/原文件名 整理",
        service: { baseUrl: model.url, model: "test-model", apiKey: "sk-secret" },
      }),
    });
    assert.equal(response.status, 200);
    const preview = (await response.json()) as PreviewResponse;
    assert.equal(preview.error, undefined);
    assert.ok(preview.batchId);
    assert.equal(preview.version, 1);
    // 重叠源文件按源去重
    assert.equal(preview.rows.length, 2);
    assert.deepEqual(
      preview.rows.map((row) => row.targetAbs),
      [
        path.join(targetRoot, "Sorted", "aaa (2020)", "aaa.mkv"),
        path.join(targetRoot, "Sorted", "bbb (2021)", "bbb.mkv"),
      ],
    );
    assert.deepEqual(
      preview.rows.map((row) => row.problem),
      ["", ""],
    );

    assert.equal(model.requests.length, 1);
    const sent = model.requests[0];
    assert.equal(sent.model, "test-model");
    const text = JSON.stringify(sent);
    // 发给模型的业务内容只有规范、行标识和相对路径
    assert.match(text, /movies\/aaa\.mkv/);
    assert.match(text, /按 片名 \(年份\)\/原文件名 整理/);
    assert.ok(!text.includes(sourceRoot), "absolute source leaked to model");
    assert.ok(!text.includes(targetRoot), "target root leaked to model");
    assert.ok(!text.includes("sk-secret"), "api key leaked into body");
    // 预览阶段不修改磁盘
    assert.equal(await readFile(sourceA, "utf8"), "aaa");
    await assert.rejects(stat(path.join(targetRoot, "Sorted")), /ENOENT/);
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename direct file selection sends last two parent levels", async () => {
  const dataPath = await createFixtureRoot("ai2-data");
  const deepRoot = await createFixtureRoot("ai2-src");
  const targetRoot = await createFixtureRoot("ai2-dst");
  const server = await start(dataPath);
  const parentDir = path.join(deepRoot, "level1", "level2");
  await mkdir(parentDir, { recursive: true });
  const source = path.join(parentDir, "clip.mkv");
  await writeFile(source, "clip");
  const model = await startMockModel(() =>
    chatCompletion(JSON.stringify([{ id: "L001", target: "Out/clip.mkv" }])),
  );

  try {
    const response = await request(server, "/aiRename/generate", {
      method: "POST",
      body: JSON.stringify({
        files: [fileObj(source)],
        targetRoot,
        instruction: "整理",
        service: { baseUrl: model.url, model: "m" },
      }),
    });
    assert.equal(response.status, 200);
    const preview = (await response.json()) as PreviewResponse;
    assert.equal(preview.rows.length, 1);
    // 最近两级父目录
    assert.equal(preview.rows[0].contextPath, "level1/level2/clip.mkv");
    const text = JSON.stringify(model.requests[0]);
    assert.ok(text.includes("level1/level2/clip.mkv"));
    assert.ok(!text.includes(deepRoot), "absolute path leaked to model");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(deepRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename edit revalidates without model and bumps version", async () => {
  const dataPath = await createFixtureRoot("ai3-data");
  const sourceRoot = await createFixtureRoot("ai3-src");
  const targetRoot = await createFixtureRoot("ai3-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "b.mkv");
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  // 模型返回重复目标，触发批次内重复
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", target: "Same/a.mkv" },
        { id: "L002", target: "Same/A.MKV" },
      ]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA), fileObj(sourceB)],
          baseDir: sourceRoot,
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.equal(generated.rows[0].problem, "");
    assert.match(generated.rows[1].problem, /重复/);
    assert.equal(model.requests.length, 1, "validate must not call the model");

    // 编辑第二行目标后重新校验
    const fixed = (await (
      await request(server, "/aiRename/preview/validate", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          rows: generated.rows.map((row) => ({
            id: row.id,
            targetRel: row.id === "L002" ? "Other/b.mkv" : row.targetRel,
          })),
        }),
      })
    ).json()) as PreviewResponse;
    assert.equal(fixed.version, generated.version + 1);
    assert.deepEqual(
      fixed.rows.map((row) => row.problem),
      ["", ""],
    );
    assert.equal(model.requests.length, 1, "validate must not call the model");
    assert.equal(
      fixed.rows[1].targetAbs,
      path.join(targetRoot, "Other", "b.mkv"),
    );
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename blocks submit for duplicates, existing targets, traversal and missing results", async () => {
  const dataPath = await createFixtureRoot("ai4-data");
  const sourceRoot = await createFixtureRoot("ai4-src");
  const targetRoot = await createFixtureRoot("ai4-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "b.mkv");
  const sourceC = path.join(sourceRoot, "c.mkv");
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  await writeFile(sourceC, "c");
  const existing = path.join(targetRoot, "Taken", "a.mkv");
  await mkdir(path.dirname(existing), { recursive: true });
  await writeFile(existing, "taken");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", target: "Taken/a.mkv" },
        { id: "L002", target: "New/b.mkv" },
        { id: "L003", target: "New/c.mkv" },
      ]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA), fileObj(sourceB), fileObj(sourceC)],
          baseDir: sourceRoot,
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.match(generated.rows[0].problem, /已存在/);

    // 整批仍有未解决问题时拒绝提交，磁盘保持原状
    const blocked = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version,
      }),
    });
    assert.equal(blocked.status, 400);
    assert.match(await blocked.text(), /未解决/);
    assert.equal(await readFile(existing, "utf8"), "taken");
    assert.equal(await readFile(sourceA, "utf8"), "a");

    // 编辑解决已有目标，但引入上级跳转
    const escaped = (await (
      await request(server, "/aiRename/preview/validate", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          rows: generated.rows.map((row) => ({
            id: row.id,
            targetRel: row.id === "L001" ? "../outside/a.mkv" : row.targetRel,
          })),
        }),
      })
    ).json()) as PreviewResponse;
    assert.match(escaped.rows[0].problem, /目标根目录/);

    // 修复为绝对路径同样被拒绝
    const absolute = (await (
      await request(server, "/aiRename/preview/validate", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          rows: generated.rows.map((row) => ({
            id: row.id,
            targetRel: row.id === "L001" ? existing : row.targetRel,
          })),
        }),
      })
    ).json()) as PreviewResponse;
    assert.match(absolute.rows[0].problem, /目标根目录/);

    // 修复后整批可用，但提交必须绑定当前预览版本
    const fixed = (await (
      await request(server, "/aiRename/preview/validate", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          rows: generated.rows.map((row) => ({
            id: row.id,
            targetRel: row.id === "L001" ? "Free/a.mkv" : row.targetRel,
          })),
        }),
      })
    ).json()) as PreviewResponse;
    assert.deepEqual(
      fixed.rows.map((row) => row.problem),
      ["", "", ""],
    );
    const stale = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: fixed.batchId,
        version: generated.version,
      }),
    });
    assert.equal(stale.status, 400);
    assert.match(await stale.text(), /重新校验/);
    assert.equal(await readFile(sourceA, "utf8"), "a");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename rejects submit when model result misses a line", async () => {
  const dataPath = await createFixtureRoot("ai5-data");
  const sourceRoot = await createFixtureRoot("ai5-src");
  const targetRoot = await createFixtureRoot("ai5-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "b.mkv");
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  const model = await startMockModel(() =>
    chatCompletion(JSON.stringify([{ id: "L001", target: "Out/a.mkv" }])),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA), fileObj(sourceB)],
          baseDir: sourceRoot,
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.match(generated.rows[1].problem, /未返回/);
    const submit = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version,
      }),
    });
    assert.equal(submit.status, 400);
    assert.equal(await readFile(sourceB, "utf8"), "b");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename expired and unknown batches are rejected", async (t) => {
  const dataPath = await createFixtureRoot("ai6-data");
  const sourceRoot = await createFixtureRoot("ai6-src");
  const targetRoot = await createFixtureRoot("ai6-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  await writeFile(sourceA, "a");
  const model = await startMockModel(() =>
    chatCompletion(JSON.stringify([{ id: "L001", target: "Out/a.mkv" }])),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA)],
          baseDir: sourceRoot,
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;

    const future = Date.now() + 31 * 60 * 1000;
    t.mock.method(Date, "now", () => future);
    const expired = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version,
      }),
    });
    assert.equal(expired.status, 400);
    assert.match(await expired.text(), /过期/);

    const unknown = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: "no-such-batch",
        version: 1,
      }),
    });
    assert.equal(unknown.status, 400);
    assert.match(await unknown.text(), /不存在/);
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename submit moves whole batch on the same device", async () => {
  const dataPath = await createFixtureRoot("ai7-data");
  const sourceRoot = await createFixtureRoot("ai7-src");
  const targetRoot = await createFixtureRoot("ai7-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "sub", "b.mkv");
  await mkdir(path.dirname(sourceB), { recursive: true });
  await writeFile(sourceA, "aaa");
  await writeFile(sourceB, "bbb");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", target: "Library/a.mkv" },
        { id: "L002", target: "Library/season 01/b.mkv" },
      ]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA), fileObj(sourceB)],
          baseDir: sourceRoot,
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.deepEqual(
      generated.rows.map((row) => row.problem),
      ["", ""],
    );

    const submit = (await (
      await request(server, "/aiRename/submit", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          version: generated.version,
        }),
      })
    ).json()) as {
      completed: Array<AiRenameRow>;
      failed: Array<{ row: AiRenameRow; error: string }>;
      pending: Array<AiRenameRow>;
    };
    assert.equal(submit.completed.length, 2);
    assert.equal(submit.failed.length, 0);
    assert.equal(submit.pending.length, 0);

    // 文件移动到目标路径，源文件消失
    assert.equal(
      await readFile(path.join(targetRoot, "Library", "a.mkv"), "utf8"),
      "aaa",
    );
    assert.equal(
      await readFile(
        path.join(targetRoot, "Library", "season 01", "b.mkv"),
        "utf8",
      ),
      "bbb",
    );
    await assert.rejects(stat(sourceA), /ENOENT/);
    await assert.rejects(stat(sourceB), /ENOENT/);

    // 重复提交同一批次：执行后版本已失效，整批被拒绝且不破坏已有目标
    const again = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version,
      }),
    });
    assert.equal(again.status, 400);
    assert.match(await again.text(), /重新校验/);
    assert.equal(
      await readFile(path.join(targetRoot, "Library", "a.mkv"), "utf8"),
      "aaa",
    );
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename model errors surface as preview feedback without the key", async () => {
  const dataPath = await createFixtureRoot("ai8-data");
  const sourceRoot = await createFixtureRoot("ai8-src");
  const targetRoot = await createFixtureRoot("ai8-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  await writeFile(sourceA, "a");
  const failing = await startMockModel(() => ({
    status: "error",
    message: "upstream exploded",
  }));

  try {
    const response = await request(server, "/aiRename/generate", {
      method: "POST",
      body: JSON.stringify({
        files: [fileObj(sourceA)],
        baseDir: sourceRoot,
        targetRoot,
        instruction: "整理",
        service: { baseUrl: failing.url, model: "m", apiKey: "sk-secret" },
      }),
    });
    assert.equal(response.status, 200);
    const preview = (await response.json()) as PreviewResponse;
    // 模型暂时不可用：条目保留在预览中并标为可重试
    assert.ok(preview.batchId);
    assert.equal(preview.error, undefined);
    assert.equal(preview.rows.length, 1);
    assert.match(preview.rows[0].problem, /模型请求失败/);
    assert.equal(preview.rows[0].retryable, true);
    const text = JSON.stringify(preview);
    assert.ok(!text.includes("sk-secret"), "api key leaked in feedback");
    // 生成失败未解决时整批无法提交
    const submit = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: preview.batchId,
        version: preview.version,
      }),
    });
    assert.equal(submit.status, 400);
    assert.equal(await readFile(sourceA, "utf8"), "a");
  } finally {
    await server.close();
    await failing.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename submit uses server mapping and ignores client-supplied rows", async () => {
  const dataPath = await createFixtureRoot("ai9-data");
  const sourceRoot = await createFixtureRoot("ai9-src");
  const targetRoot = await createFixtureRoot("ai9-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "b.mkv");
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", target: "Server/a.mkv" },
        { id: "L002", target: "Server/b.mkv" },
      ]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA), fileObj(sourceB)],
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;

    // 编辑校验把 L001 改到 Edited/a.mkv，发布版本 2
    const fixed = (await (
      await request(server, "/aiRename/preview/validate", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          rows: generated.rows.map((row) => ({
            id: row.id,
            targetRel: row.id === "L001" ? "Edited/a.mkv" : row.targetRel,
          })),
        }),
      })
    ).json()) as PreviewResponse;
    assert.equal(fixed.version, generated.version + 1);

    // 提交只接收批次标识和版本：注入不同的目标不会影响服务器已校验的映射
    const submit = (await (
      await request(server, "/aiRename/submit", {
        method: "POST",
        body: JSON.stringify({
          batchId: fixed.batchId,
          version: fixed.version,
          rows: [
            { id: "L001", targetRel: "Injected/a.mkv" },
            { id: "L002", targetRel: "Injected/b.mkv" },
          ],
        }),
      })
    ).json()) as {
      completed: Array<AiRenameRow>;
      failed: Array<{ row: AiRenameRow; error: string }>;
      pending: Array<AiRenameRow>;
    };
    assert.equal(submit.completed.length, 2);
    assert.equal(
      await readFile(path.join(targetRoot, "Edited", "a.mkv"), "utf8"),
      "a",
    );
    assert.equal(
      await readFile(path.join(targetRoot, "Server", "b.mkv"), "utf8"),
      "b",
    );
    await assert.rejects(
      stat(path.join(targetRoot, "Injected", "a.mkv")),
      /ENOENT/,
    );
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename validate rejects duplicate and incomplete edit rows", async () => {
  const dataPath = await createFixtureRoot("ai10-data");
  const sourceRoot = await createFixtureRoot("ai10-src");
  const targetRoot = await createFixtureRoot("ai10-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "b.mkv");
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", target: "Out/a.mkv" },
        { id: "L002", target: "Out/b.mkv" },
      ]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA), fileObj(sourceB)],
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;

    // 同一行标识出现两次：拒绝
    const duplicate = await request(server, "/aiRename/preview/validate", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        rows: [
          { id: "L001", targetRel: "Out/a.mkv" },
          { id: "L001", targetRel: "Out/a2.mkv" },
        ],
      }),
    });
    assert.equal(duplicate.status, 400);

    // 缺少一行：拒绝
    const incomplete = await request(server, "/aiRename/preview/validate", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        rows: [{ id: "L001", targetRel: "Out/a.mkv" }],
      }),
    });
    assert.equal(incomplete.status, 400);

    const submit = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version,
      }),
    });
    assert.equal(submit.status, 200);
    assert.equal((await submit.json()).completed.length, 2);
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename rejects symlink chains, parent-dir conflicts, and non-directory parents", async () => {
  const dataPath = await createFixtureRoot("ai11-data");
  const sourceRoot = await createFixtureRoot("ai11-src");
  const targetRoot = await createFixtureRoot("ai11-dst");
  const outsideDir = await createFixtureRoot("ai11-out");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "b.mkv");
  const sourceC = path.join(sourceRoot, "c.mkv");
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  await writeFile(sourceC, "c");
  // 链接链条：chain -> mid -> 根目录外
  const midLink = path.join(targetRoot, "mid");
  const chainLink = path.join(targetRoot, "chain");
  await symlink(outsideDir, midLink);
  await symlink(midLink, chainLink);
  // 已存在的非目录父级
  await writeFile(path.join(targetRoot, "blob"), "blob");
  const responses: Record<string, string> = {
    链接链: JSON.stringify([{ id: "L001", target: "chain/a.mkv" }]),
    父级冲突: JSON.stringify([
      { id: "L001", target: "Box/a.mkv" },
      { id: "L002", target: "Box" },
    ]),
    非目录父级: JSON.stringify([{ id: "L001", target: "blob/a.mkv" }]),
  };
  const model = await startMockModel((body) => {
    const messages = body.messages as
      | Array<{ content?: unknown }>
      | undefined;
    const instruction = String(messages?.[1]?.content ?? "");
    const key = Object.keys(responses).find((item) =>
      instruction.includes(item),
    );
    return chatCompletion(key ? responses[key] : "[]");
  });

  try {
    for (const [label, pattern] of [
      ["链接链", /目标根目录/],
      ["父级冲突", /父目录/],
      ["非目录父级", /不是目录/],
    ] as Array<[string, RegExp]>) {
      const generated = (await (
        await request(server, "/aiRename/generate", {
          method: "POST",
          body: JSON.stringify({
            files: [fileObj(sourceA), fileObj(sourceB), fileObj(sourceC)],
            targetRoot,
            instruction: `${label} 整理`,
            service: { baseUrl: model.url, model: "m" },
          }),
        })
      ).json()) as PreviewResponse;
      const problems = generated.rows.map((row) => row.problem);
      assert.ok(
        problems.some((problem) => pattern.test(problem)),
        `${label} 应被拒绝: ${JSON.stringify(problems)}`,
      );

      // 整批被拒绝，预检无效时不会创建任何目录
      const submit = await request(server, "/aiRename/submit", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          version: generated.version,
        }),
      });
      assert.equal(submit.status, 400);
    }
    await assert.rejects(stat(path.join(targetRoot, "Box")), /ENOENT/);
    assert.equal(await readFile(sourceA, "utf8"), "a");
    assert.equal(await readFile(sourceB, "utf8"), "b");
    assert.equal(await readFile(sourceC, "utf8"), "c");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
    await rm(outsideDir, { recursive: true, force: true });
  }
});

test("ai rename same source and target is a graceful no-op", async () => {
  const dataPath = await createFixtureRoot("ai12-data");
  const sourceRoot = await createFixtureRoot("ai12-src");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "b.mkv");
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", target: "a.mkv" },
        { id: "L002", target: "Moved/b.mkv" },
      ]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA), fileObj(sourceB)],
          targetRoot: sourceRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.deepEqual(
      generated.rows.map((row) => row.problem),
      ["", ""],
    );

    const submit = (await (
      await request(server, "/aiRename/submit", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          version: generated.version,
        }),
      })
    ).json()) as {
      completed: Array<AiRenameRow>;
      failed: Array<{ row: AiRenameRow; error: string }>;
      pending: Array<AiRenameRow>;
    };
    assert.equal(submit.completed.length, 2);
    assert.equal(submit.failed.length, 0);
    // 无操作项原地保留，其余正常移动
    assert.equal(await readFile(sourceA, "utf8"), "a");
    assert.equal(
      await readFile(path.join(sourceRoot, "Moved", "b.mkv"), "utf8"),
      "b",
    );
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
  }
});

test("ai rename target overwriting another source file is rejected", async () => {
  const dataPath = await createFixtureRoot("ai13-data");
  const sourceRoot = await createFixtureRoot("ai13-src");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "b.mkv");
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", target: "b.mkv" },
        { id: "L002", target: "Kept/b.mkv" },
      ]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA), fileObj(sourceB)],
          targetRoot: sourceRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.match(generated.rows[0].problem, /覆盖/);

    const submit = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version,
      }),
    });
    assert.equal(submit.status, 400);
    assert.equal(await readFile(sourceA, "utf8"), "a");
    assert.equal(await readFile(sourceB, "utf8"), "b");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
  }
});

test("ai rename batch stores are isolated per service instance", async () => {
  const dataPath = await createFixtureRoot("ai14-data");
  const sourceRoot = await createFixtureRoot("ai14-src");
  const targetRoot = await createFixtureRoot("ai14-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  await writeFile(sourceA, "a");
  const model = await startMockModel(() =>
    chatCompletion(JSON.stringify([{ id: "L001", target: "Out/a.mkv" }])),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA)],
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;

    // 批次只存在于生成它的服务实例中，其他实例看不到
    const other = new AiRenameService();
    await assert.rejects(other.submit({
      batchId: generated.batchId,
      version: generated.version,
    }, (key) => key), /ai\.batch-not-found/);

    // 所属实例照常可以提交
    const submit = (await (
      await request(server, "/aiRename/submit", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          version: generated.version,
        }),
      })
    ).json()) as { completed: Array<AiRenameRow> };
    assert.equal(submit.completed.length, 1);
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename per-file sourceDir scopes model context across directories", async () => {
  const dataPath = await createFixtureRoot("ai15-data");
  const dirA = await createFixtureRoot("ai15-a");
  const dirB = await createFixtureRoot("ai15-b");
  const targetRoot = await createFixtureRoot("ai15-dst");
  const server = await start(dataPath);
  const sourceA = path.join(dirA, "deep", "a.mkv");
  const sourceB = path.join(dirB, "b.mkv");
  await mkdir(path.dirname(sourceA), { recursive: true });
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", target: "Out/a.mkv" },
        { id: "L002", target: "Out/b.mkv" },
      ]),
    ),
  );

  try {
    const withDir = (
      absolute: string,
      sourceDir: string,
    ): FileObj & { sourceDir: string } => ({
      ...fileObj(absolute),
      sourceDir,
    });
    const response = await request(server, "/aiRename/generate", {
      method: "POST",
      body: JSON.stringify({
        files: [withDir(sourceA, dirA), withDir(sourceB, dirB)],
        targetRoot,
        instruction: "整理",
        service: { baseUrl: model.url, model: "m" },
      }),
    });
    assert.equal(response.status, 200);
    const preview = (await response.json()) as PreviewResponse;
    assert.deepEqual(
      preview.rows.map((row) => row.contextPath),
      ["deep/a.mkv", "b.mkv"],
    );
    const text = JSON.stringify(model.requests[0]);
    assert.ok(!text.includes(dirA), "absolute directory leaked to model");
    assert.ok(!text.includes(dirB), "absolute directory leaked to model");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(dirA, { recursive: true, force: true });
    await rm(dirB, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename retry resends only failed rows and keeps edited successes", async () => {
  const dataPath = await createFixtureRoot("ai16-data");
  const sourceRoot = await createFixtureRoot("ai16-src");
  const targetRoot = await createFixtureRoot("ai16-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "b.mkv");
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  let calls = 0;
  const model = await startMockModel(() => {
    calls += 1;
    return chatCompletion(
      JSON.stringify(
        calls === 1
          ? [{ id: "L001", target: "Out/a.mkv" }]
          : [{ id: "L002", target: "Out/b.mkv" }],
      ),
    );
  });

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA), fileObj(sourceB)],
          baseDir: sourceRoot,
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    // 同一批中成功与失败并存：失败行可重试，成功行保留结果
    assert.equal(generated.rows[0].problem, "");
    assert.equal(generated.rows[0].retryable, false);
    assert.match(generated.rows[1].problem, /未返回/);
    assert.equal(generated.rows[1].retryable, true);

    // 用户先编辑成功行，再重试失败行
    const edited = (await (
      await request(server, "/aiRename/preview/validate", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          rows: [
            { id: "L001", targetRel: "Edited/a.mkv" },
            { id: "L002", targetRel: "" },
          ],
        }),
      })
    ).json()) as PreviewResponse;

    const retried = (await (
      await request(server, "/aiRename/retry", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          version: edited.version,
          rowIds: ["L002"],
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.equal(retried.batchId, generated.batchId);
    assert.equal(retried.version, edited.version + 1);
    assert.deepEqual(
      retried.rows.map((row) => row.targetRel),
      ["Edited/a.mkv", "Out/b.mkv"],
    );
    assert.deepEqual(
      retried.rows.map((row) => row.problem),
      ["", ""],
    );

    // 只把失败行发给模型：第二次请求不含成功行的路径与标识
    assert.equal(model.requests.length, 2);
    const resent = model.requests[1];
    assert.equal(resent.model, "m");
    const text = JSON.stringify(resent);
    const userMessage = JSON.stringify(
      (resent.messages as Array<{ content: string }>)[1].content,
    );
    assert.ok(userMessage.includes("L002"), "retried line missing");
    assert.ok(!userMessage.includes("L001"), "successful line resent to model");
    assert.ok(!text.includes("Edited"), "edited target leaked to model");
    assert.ok(!text.includes(sourceRoot), "absolute path leaked to model");

    // 解决后允许按确认映射整批执行
    const submit = (await (
      await request(server, "/aiRename/submit", {
        method: "POST",
        body: JSON.stringify({
          batchId: retried.batchId,
          version: retried.version,
        }),
      })
    ).json()) as { completed: Array<AiRenameRow> };
    assert.equal(submit.completed.length, 2);
    assert.equal(
      await readFile(path.join(targetRoot, "Edited", "a.mkv"), "utf8"),
      "a",
    );
    assert.equal(
      await readFile(path.join(targetRoot, "Out", "b.mkv"), "utf8"),
      "b",
    );
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename retry keeps feedback when the model still fails", async () => {
  const dataPath = await createFixtureRoot("ai17-data");
  const sourceRoot = await createFixtureRoot("ai17-src");
  const targetRoot = await createFixtureRoot("ai17-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  await writeFile(sourceA, "a");
  const model = await startMockModel(() => ({
    status: "error",
    message: "upstream exploded",
  }));

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA)],
          baseDir: sourceRoot,
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.match(generated.rows[0].problem, /模型请求失败/);
    assert.equal(generated.rows[0].retryable, true);

    const retried = (await (
      await request(server, "/aiRename/retry", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          version: generated.version,
          rowIds: ["L001"],
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    // 重试仍失败：保留明确反馈与重试入口，其他状态不变
    assert.equal(retried.batchId, generated.batchId);
    assert.match(retried.rows[0].problem, /模型请求失败/);
    assert.equal(retried.rows[0].retryable, true);
    assert.ok(retried.version > generated.version);

    const submit = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: retried.version,
      }),
    });
    assert.equal(submit.status, 400);
    assert.equal(await readFile(sourceA, "utf8"), "a");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename retry result conflicting with existing target blocks submit", async () => {
  const dataPath = await createFixtureRoot("ai18-data");
  const sourceRoot = await createFixtureRoot("ai18-src");
  const targetRoot = await createFixtureRoot("ai18-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  const sourceB = path.join(sourceRoot, "b.mkv");
  await writeFile(sourceA, "a");
  await writeFile(sourceB, "b");
  const existing = path.join(targetRoot, "Taken", "b.mkv");
  await mkdir(path.dirname(existing), { recursive: true });
  await writeFile(existing, "taken");
  let calls = 0;
  const model = await startMockModel(() => {
    calls += 1;
    return chatCompletion(
      JSON.stringify(
        calls === 1
          ? [{ id: "L001", target: "Out/a.mkv" }]
          : [{ id: "L002", target: "Taken/b.mkv" }],
      ),
    );
  });

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA), fileObj(sourceB)],
          baseDir: sourceRoot,
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.match(generated.rows[1].problem, /未返回/);

    // 重试生成与已有目标冲突：按路径校验错误标记，整批无法提交
    const retried = (await (
      await request(server, "/aiRename/retry", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          version: generated.version,
          rowIds: ["L002"],
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.match(retried.rows[1].problem, /已存在/);
    assert.equal(retried.rows[0].problem, "");

    const submit = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: retried.version,
      }),
    });
    assert.equal(submit.status, 400);
    assert.equal(await readFile(existing, "utf8"), "taken");
    assert.equal(await readFile(sourceA, "utf8"), "a");
    assert.equal(await readFile(sourceB, "utf8"), "b");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("ai rename retry rejects stale versions and non-failed rows", async () => {
  const dataPath = await createFixtureRoot("ai19-data");
  const sourceRoot = await createFixtureRoot("ai19-src");
  const targetRoot = await createFixtureRoot("ai19-dst");
  const server = await start(dataPath);
  const sourceA = path.join(sourceRoot, "a.mkv");
  await writeFile(sourceA, "a");
  const model = await startMockModel(() =>
    chatCompletion(JSON.stringify([{ id: "L001", target: "Out/a.mkv" }])),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(sourceA)],
          baseDir: sourceRoot,
          targetRoot,
          instruction: "整理",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;

    // 版本过期
    const stale = await request(server, "/aiRename/retry", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version + 99,
        rowIds: ["L001"],
        service: { baseUrl: model.url, model: "m" },
      }),
    });
    assert.equal(stale.status, 400);
    assert.match(await stale.text(), /预览已变更/);

    // 成功行不是生成失败，不允许重试
    const notFailed = await request(server, "/aiRename/retry", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version,
        rowIds: ["L001"],
        service: { baseUrl: model.url, model: "m" },
      }),
    });
    assert.equal(notFailed.status, 400);
    assert.match(await notFailed.text(), /只能重试生成失败的条目/);

    // 未知行标识
    const unknown = await request(server, "/aiRename/retry", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version,
        rowIds: ["L999"],
        service: { baseUrl: model.url, model: "m" },
      }),
    });
    assert.equal(unknown.status, 400);
    assert.equal(model.requests.length, 1, "rejected retries must not call model");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});
