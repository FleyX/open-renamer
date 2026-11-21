import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { startNodeServer, type RunningNodeServer } from "../index.node.ts";

const resourceRootPath = path.resolve(import.meta.dirname, "..");

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
      ...init.headers,
    },
  });
}

test("Node server migrates, serves rule APIs, and persists rule templates", async () => {
  const dataPath = await mkdtemp(path.join(os.tmpdir(), "open-renamer-node-"));
  let server = await start(dataPath);

  try {
    const unauthorized = await fetch(
      `${server.url}/openRenamer/api/applicationRule`,
    );
    assert.equal(unauthorized.status, 401);
    assert.equal(await unauthorized.text(), "Secret error");

    const isWindows = await fetch(
      `${server.url}/openRenamer/api/file/isWindows`,
    );
    assert.equal(isWindows.status, 200);
    assert.equal(typeof (await isWindows.json()), "boolean");

    const tokenCheck = await request(server, "/public/checkToken", {
      method: "POST",
      body: JSON.stringify({ token: "test-token" }),
    });
    assert.equal(await tokenCheck.json(), true);

    const initialRules = await (await request(server, "/applicationRule")).json();
    assert.equal(Array.isArray(initialRules), true);
    assert.equal(initialRules.length, 1);
    assert.equal(initialRules[0].name, "推荐剧集模板");

    const createdResponse = await request(server, "/applicationRule", {
      method: "POST",
      body: JSON.stringify({
        name: "持久化模板",
        comment: "created",
        content: "[]",
      }),
    });
    assert.equal(createdResponse.status, 200);
    const created = await createdResponse.json();
    assert.equal(created.name, "持久化模板");
    assert.equal(typeof created.id, "number");

    const updatedResponse = await request(server, "/applicationRule", {
      method: "POST",
      body: JSON.stringify({
        ...created,
        name: "更新后的模板",
        comment: "updated",
        content: '[{"type":"insert"}]',
      }),
    });
    assert.equal(updatedResponse.status, 200);

    const defaultRule = await (await request(server, "/applicationRule/default")).json();
    assert.equal(defaultRule.name, "推荐剧集模板");
    const defaultId = await (
      await request(server, "/config/code?code=defaultTempleteId")
    ).text();
    assert.equal(defaultId, String(defaultRule.id));

    const configInsert = await request(server, "/config/insertOrUpdate", {
      method: "POST",
      body: JSON.stringify({ code: "firstUse", val: "1" }),
    });
    assert.equal(configInsert.status, 200);
    const configValues = await (
      await request(server, "/config/multCode", {
        method: "POST",
        body: JSON.stringify(["firstUse"]),
      })
    ).json();
    assert.equal(configValues.firstUse, "1");

    const savedPath = await request(server, "/file/path/save", {
      method: "POST",
      body: JSON.stringify({ name: "测试路径", content: '["/tmp"]' }),
    });
    assert.equal(savedPath.status, 200);
    assert.deepEqual(await savedPath.json(), {
      name: "测试路径",
      content: '["/tmp"]',
    });
    const paths = await (await request(server, "/file/path")).json();
    assert.equal(paths.length, 1);
    assert.equal(paths[0].name, "测试路径");

    await server.close();
    server = await start(dataPath);

    const persistedRules = await (
      await request(server, "/applicationRule")
    ).json();
    const persisted = persistedRules.find(
      (rule: { id: number }) => rule.id === created.id,
    );
    assert.equal(persisted.name, "更新后的模板");
    assert.equal(persisted.comment, "updated");
    assert.equal(persisted.content, '[{"type":"insert"}]');

    const history = JSON.parse(
      await readFile(path.join(dataPath, "history.json"), "utf8"),
    ) as string[];
    assert.deepEqual(history, [
      "v001__init.sql",
      "v002__init.sql",
      "v003_新增默认模板.sql",
      "v004_新增记录表.sql",
      "v005_新增推荐规则.sql",
    ]);
  } finally {
    await server.close();
    await rm(dataPath, { recursive: true, force: true });
  }
});
