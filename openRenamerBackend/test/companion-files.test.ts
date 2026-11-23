import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { startNodeServer, type RunningNodeServer } from "../index.node.ts";
import type AiCompanionRow from "../entity/vo/AiCompanionRow.ts";
import type AiRenameRow from "../entity/vo/AiRenameRow.ts";

const resourceRootPath = path.resolve(import.meta.dirname, "..");

interface FileObj {
  name: string;
  path: string;
  isFolder: boolean;
  size: number;
  checked?: boolean;
  sourceDir?: string;
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

function fileObj(absolute: string, sourceDir?: string): FileObj {
  const item: FileObj = {
    name: path.basename(absolute),
    path: path.dirname(absolute),
    isFolder: false,
    size: 1,
  };
  if (sourceDir !== undefined) {
    item.sourceDir = sourceDir;
  }
  return item;
}

interface PreviewResponse {
  batchId: string;
  version: number;
  rows: Array<AiRenameRow>;
  groups?: Array<{ key: string; title: string; year: number | null; rowIds: string[] }>;
  companions: Array<AiCompanionRow>;
  error?: string;
}

interface SubmitResponse {
  completed: Array<AiRenameRow | AiCompanionRow>;
  failed: Array<{ row: AiRenameRow | AiCompanionRow; error: string }>;
  pending: Array<AiRenameRow | AiCompanionRow>;
}

test("movie preset auto-associates same-name subtitle, nfo and single-movie poster", async () => {
  const dataPath = await createFixtureRoot("cf-data");
  const sourceRoot = await createFixtureRoot("cf-src");
  const targetRoot = await createFixtureRoot("cf-dst");
  const server = await start(dataPath);
  const movieDir = path.join(sourceRoot, "movies");
  await mkdir(movieDir, { recursive: true });
  const video = path.join(movieDir, "aaa.It.mkv");
  const subtitle = path.join(movieDir, "aaa.It.zh.srt");
  const nfo = path.join(movieDir, "aaa.It.nfo");
  const poster = path.join(movieDir, "poster.jpg");
  await writeFile(video, "video");
  await writeFile(subtitle, "zh sub");
  await writeFile(nfo, "nfo");
  await writeFile(poster, "poster");
  await writeFile(path.join(movieDir, "unrelated.jpg"), "leave in place");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([{ id: "L001", title: "Demo Movie", year: 2020 }]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(video)],
          baseDir: sourceRoot,
          targetRoot,
          preset: "movie",
          instruction: "电影保存为 片名 (年份)/原文件名",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.equal(generated.error, undefined);
    assert.equal(generated.rows.length, 1);
    // 三个附属文件全部自动关联到唯一视频
    assert.equal(generated.companions.length, 3);
    assert.deepEqual(
      generated.companions.map((comp) => comp.kind).sort(),
      ["cover", "nfo", "subtitle"],
    );
    for (const comp of generated.companions) {
      assert.equal(comp.ownerRowId, "L001");
      assert.deepEqual(comp.candidateVideoIds, ["L001"]);
      assert.equal(comp.problem, "");
    }
    // 电影附属文件保留原名
    assert.deepEqual(
      generated.companions.map((comp) => comp.targetRel).sort(),
      [
        "Demo Movie (2020)/aaa.It.nfo",
        "Demo Movie (2020)/aaa.It.zh.srt",
        "Demo Movie (2020)/poster.jpg",
      ],
    );

    // 模型只收到相对路径：视频行上下文 + 附属文件参考路径，绝无绝对路径
    assert.equal(model.requests.length, 1);
    const text = JSON.stringify(model.requests[0]);
    assert.match(text, /movies\/aaa\.It\.zh\.srt/);
    assert.match(text, /movies\/poster\.jpg/);
    assert.match(text, /Companion files \(reference only/);
    assert.ok(!text.includes(sourceRoot), "absolute source leaked to model");
    assert.ok(!text.includes(targetRoot), "target root leaked to model");

    // 提交后视频与附属文件一起落到目标目录
    const submitted = (await (
      await request(server, "/aiRename/submit", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          version: generated.version,
        }),
      })
    ).json()) as SubmitResponse;
    assert.equal(submitted.failed.length, 0);
    assert.equal(submitted.completed.length, 4);
    assert.equal(
      await readFile(path.join(targetRoot, "Demo Movie (2020)", "aaa.It.zh.srt"), "utf8"),
      "zh sub",
    );
    assert.equal(
      await readFile(path.join(targetRoot, "Demo Movie (2020)", "aaa.It.nfo"), "utf8"),
      "nfo",
    );
    assert.equal(
      await readFile(path.join(targetRoot, "Demo Movie (2020)", "poster.jpg"), "utf8"),
      "poster",
    );
    await assert.rejects(stat(video), /ENOENT/);
    await assert.rejects(stat(subtitle), /ENOENT/);
    assert.equal(await readFile(path.join(movieDir, "unrelated.jpg"), "utf8"), "leave in place");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("series companion follows episode target base and keeps language suffix", async () => {
  const dataPath = await createFixtureRoot("cs-data");
  const sourceRoot = await createFixtureRoot("cs-src");
  const targetRoot = await createFixtureRoot("cs-dst");
  const server = await start(dataPath);
  const episode1 = path.join(sourceRoot, "show.s01e01.mp4");
  const episode2 = path.join(sourceRoot, "show.s01e02.mp4");
  const sub1 = path.join(sourceRoot, "show.s01e01.zh.srt");
  const sub2 = path.join(sourceRoot, "show.s01e02.zh.srt");
  await writeFile(episode1, "e1");
  await writeFile(episode2, "e2");
  await writeFile(sub1, "sub1");
  await writeFile(sub2, "sub2");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", title: "Demo Show", year: 2021, season: 1, episode: 1 },
        { id: "L002", title: "Demo Show", year: 2021, season: 1, episode: 2 },
      ]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(episode1), fileObj(episode2)],
          baseDir: sourceRoot,
          targetRoot,
          preset: "series",
          instruction: "剧集保存为 剧名 (年份)/season 01/剧名.s01e01.ext",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.equal(generated.companions.length, 2);
    const bySource = new Map(
      generated.companions.map((comp) => [comp.sourcePath, comp]),
    );
    const comp1 = bySource.get(sub1)!;
    const comp2 = bySource.get(sub2)!;
    // 同名匹配不跨集：s01e01 的字幕只归属第一集
    assert.equal(comp1.ownerRowId, "L001");
    assert.equal(comp2.ownerRowId, "L002");
    // 剧集附属文件沿用目标视频基本名，保留语言后缀和扩展名
    assert.equal(
      comp1.targetRel,
      "Demo Show (2021)/season 01/Demo Show.s01e01.zh.srt",
    );
    assert.equal(
      comp2.targetRel,
      "Demo Show (2021)/season 01/Demo Show.s01e02.zh.srt",
    );
    for (const comp of generated.companions) {
      assert.equal(comp.problem, "");
    }

    const submitted = (await (
      await request(server, "/aiRename/submit", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          version: generated.version,
        }),
      })
    ).json()) as SubmitResponse;
    assert.equal(submitted.completed.length, 4);
    assert.equal(
      await readFile(
        path.join(
          targetRoot,
          "Demo Show (2021)",
          "season 01",
          "Demo Show.s01e01.zh.srt",
        ),
        "utf8",
      ),
      "sub1",
    );
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("generic poster with two movies stays pending until ownership is confirmed", async () => {
  const dataPath = await createFixtureRoot("ca-data");
  const sourceRoot = await createFixtureRoot("ca-src");
  const targetRoot = await createFixtureRoot("ca-dst");
  const server = await start(dataPath);
  const videoA = path.join(sourceRoot, "a.mkv");
  const videoB = path.join(sourceRoot, "b.mkv");
  const poster = path.join(sourceRoot, "poster.jpg");
  await writeFile(videoA, "a");
  await writeFile(videoB, "b");
  await writeFile(poster, "poster");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([
        { id: "L001", title: "Movie A", year: 2020 },
        { id: "L002", title: "Movie B", year: 2021 },
      ]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(videoA), fileObj(videoB)],
          baseDir: sourceRoot,
          targetRoot,
          preset: "movie",
          instruction: "电影保存为 片名 (年份)/原文件名",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.equal(generated.companions.length, 1);
    const pending = generated.companions[0];
    assert.equal(pending.ownerRowId, null);
    assert.deepEqual(pending.candidateVideoIds, ["L001", "L002"]);
    assert.match(pending.problem, /归属待确认/);
    assert.equal(pending.targetRel, "");

    // 归属待确认时整批无法提交
    const blocked = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version,
      }),
    });
    assert.equal(blocked.status, 400);
    assert.equal(await readFile(videoA, "utf8"), "a");

    const edited = await request(server, "/aiRename/preview/validate", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        rows: [
          ...generated.rows.map((row) => ({ id: row.id, targetRel: row.targetRel })),
          { id: pending.id, targetRel: "Manual/poster.jpg" },
        ],
      }),
    });
    assert.equal(edited.status, 200);
    const stillPending = await edited.json() as PreviewResponse;
    assert.match(stillPending.companions[0].problem, /归属待确认/);
    assert.equal((await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({ batchId: generated.batchId, version: stillPending.version }),
    })).status, 400);

    // 候选之外的归属被拒绝
    const invalid = await request(server, "/aiRename/preview/validate", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        rows: [
          ...generated.rows.map((row) => ({
            id: row.id,
            targetRel: row.targetRel,
          })),
          { id: pending.id, targetRel: pending.targetRel },
        ],
        companions: [{ id: pending.id, ownerRowId: "L999" }],
      }),
    });
    assert.equal(invalid.status, 400);
    assert.match(await invalid.text(), /候选视频/);

    // 确认归属到第二部电影，保留手工路径，不请求模型
    const confirmed = (await (
      await request(server, "/aiRename/preview/validate", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          rows: [
            ...generated.rows.map((row) => ({
              id: row.id,
              targetRel: row.targetRel,
            })),
            { id: pending.id, targetRel: stillPending.companions[0].targetRel },
          ],
          companions: [{ id: pending.id, ownerRowId: "L002" }],
        }),
      })
    ).json()) as PreviewResponse;
    assert.equal(model.requests.length, 1, "ownership edit must not call the model");
    assert.equal(confirmed.version, stillPending.version + 1);
    const confirmedPoster = confirmed.companions[0];
    assert.equal(confirmedPoster.ownerRowId, "L002");
    assert.equal(confirmedPoster.problem, "");
    assert.equal(confirmedPoster.targetRel, "Manual/poster.jpg");

    const submitted = (await (
      await request(server, "/aiRename/submit", {
        method: "POST",
        body: JSON.stringify({
          batchId: confirmed.batchId,
          version: confirmed.version,
        }),
      })
    ).json()) as SubmitResponse;
    assert.equal(submitted.failed.length, 0);
    assert.equal(submitted.completed.length, 3);
    assert.equal(
      await readFile(path.join(targetRoot, "Manual", "poster.jpg"), "utf8"),
      "poster",
    );
    await assert.rejects(stat(poster), /ENOENT/);
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("directory selection dedupes companion files already included as sources", async () => {
  const dataPath = await createFixtureRoot("cd-data");
  const sourceRoot = await createFixtureRoot("cd-src");
  const targetRoot = await createFixtureRoot("cd-dst");
  const server = await start(dataPath);
  const video = path.join(sourceRoot, "aaa.mkv");
  const subtitle = path.join(sourceRoot, "aaa.zh.srt");
  await writeFile(video, "video");
  await writeFile(subtitle, "sub");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([{ id: "L001", title: "Dedup", year: 2019 }]),
    ),
  );

  try {
    // 选整目录：字幕已作为所选文件进入批次，仍识别为附属行
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [
            fileObj(video, sourceRoot),
            fileObj(subtitle, sourceRoot),
            // 重复提交同一附属文件，按规范化源路径去重
            fileObj(subtitle, sourceRoot),
          ],
          targetRoot,
          preset: "movie",
          instruction: "电影保存为 片名 (年份)/原文件名",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    assert.equal(generated.rows.length, 1);
    assert.equal(generated.companions.length, 1);
    assert.equal(generated.companions[0].ownerRowId, "L001");
    assert.equal(
      generated.companions[0].targetRel,
      "Dedup (2019)/aaa.zh.srt",
    );
    // 模型输入里字幕不是视频行，只作为附属参考出现一次
    const text = JSON.stringify(model.requests[0]);
    const occurrences = text.split("aaa.zh.srt").length - 1;
    assert.equal(occurrences, 1, "companion path must appear exactly once");
    assert.doesNotMatch(text, /L001 aaa\.zh\.srt/);
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("companion targets resync after year supplement and then land on disk", async () => {
  const dataPath = await createFixtureRoot("cy-data");
  const sourceRoot = await createFixtureRoot("cy-src");
  const targetRoot = await createFixtureRoot("cy-dst");
  const server = await start(dataPath);
  const video = path.join(sourceRoot, "a.mkv");
  const subtitle = path.join(sourceRoot, "a.zh.srt");
  await writeFile(video, "a");
  await writeFile(subtitle, "sub");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([{ id: "L001", title: "Mystery", year: null }]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(video)],
          baseDir: sourceRoot,
          targetRoot,
          preset: "movie",
          instruction: "电影保存为 片名 (年份)/原文件名",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    // 年份待补充：视频和附属文件都无法提交
    assert.match(generated.rows[0].problem, /待补充/);
    const comp = generated.companions[0];
    assert.match(comp.problem, /尚无可用目标/);
    const blocked = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: generated.version,
      }),
    });
    assert.equal(blocked.status, 400);

    // 补全年份：附属文件路径同步更新，无需再次请求模型
    const filled = (await (
      await request(server, "/aiRename/preview/validate", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          rows: [
            ...generated.rows.map((row) => ({
              id: row.id,
              targetRel: row.targetRel,
            })),
            { id: comp.id, targetRel: comp.targetRel },
          ],
          groups: [{ key: generated.groups![0].key, year: 1999 }],
        }),
      })
    ).json()) as PreviewResponse;
    assert.equal(model.requests.length, 1, "supplement must not call the model");
    assert.equal(filled.rows[0].targetRel, "Mystery (1999)/a.mkv");
    assert.equal(filled.companions[0].targetRel, "Mystery (1999)/a.zh.srt");
    assert.equal(filled.companions[0].problem, "");

    const submitted = (await (
      await request(server, "/aiRename/submit", {
        method: "POST",
        body: JSON.stringify({
          batchId: filled.batchId,
          version: filled.version,
        }),
      })
    ).json()) as SubmitResponse;
    assert.equal(submitted.failed.length, 0);
    assert.equal(submitted.completed.length, 2);
    assert.equal(
      await readFile(path.join(targetRoot, "Mystery (1999)", "a.zh.srt"), "utf8"),
      "sub",
    );
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("companion target conflict blocks the whole batch", async () => {
  const dataPath = await createFixtureRoot("cc-data");
  const sourceRoot = await createFixtureRoot("cc-src");
  const targetRoot = await createFixtureRoot("cc-dst");
  const server = await start(dataPath);
  const video = path.join(sourceRoot, "a.mkv");
  const subtitle = path.join(sourceRoot, "a.zh.srt");
  await writeFile(video, "a");
  await writeFile(subtitle, "sub");
  const model = await startMockModel(() =>
    chatCompletion(
      JSON.stringify([{ id: "L001", title: "Conflict", year: 2018 }]),
    ),
  );

  try {
    const generated = (await (
      await request(server, "/aiRename/generate", {
        method: "POST",
        body: JSON.stringify({
          files: [fileObj(video)],
          baseDir: sourceRoot,
          targetRoot,
          preset: "movie",
          instruction: "电影保存为 片名 (年份)/原文件名",
          service: { baseUrl: model.url, model: "m" },
        }),
      })
    ).json()) as PreviewResponse;
    const comp = generated.companions[0];
    assert.equal(comp.problem, "");

    // 手工把附属文件目标改成与视频相同：批次内目标冲突
    const edited = (await (
      await request(server, "/aiRename/preview/validate", {
        method: "POST",
        body: JSON.stringify({
          batchId: generated.batchId,
          rows: [
            ...generated.rows.map((row) => ({
              id: row.id,
              targetRel: row.targetRel,
            })),
            { id: comp.id, targetRel: generated.rows[0].targetRel, edited: true },
          ],
        }),
      })
    ).json()) as PreviewResponse;
    assert.match(edited.companions[0].problem, /目标路径重复/);

    const blocked = await request(server, "/aiRename/submit", {
      method: "POST",
      body: JSON.stringify({
        batchId: generated.batchId,
        version: edited.version,
      }),
    });
    assert.equal(blocked.status, 400);
    assert.equal(await readFile(video, "utf8"), "a");
    assert.equal(await readFile(subtitle, "utf8"), "sub");
  } finally {
    await server.close();
    await model.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(targetRoot, { recursive: true, force: true });
  }
});
