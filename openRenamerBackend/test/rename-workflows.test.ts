import assert from "node:assert/strict";
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

const resourceRootPath = path.resolve(import.meta.dirname, "..");

interface FileObj {
  name: string;
  realName: string;
  originName: string;
  expandName: string;
  path: string;
  isFolder: boolean;
  size: number;
  errorMessage: string;
  createdTime: number;
  updatedTime: number;
  isAdFile: boolean;
  checked?: boolean;
}

interface RuleObj {
  type: string;
  message: string;
  data: Record<string, unknown>;
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
      ...init.headers,
    },
  });
}

function encodedPathQuery(
  route: string,
  pathStr: string,
  showHidden = false,
): string {
  const params = new URLSearchParams({
    path: encodeURIComponent(pathStr),
    showHidden: showHidden ? "1" : "0",
  });
  return `${route}?${params.toString()}`;
}

async function createFixtureRoot(name: string): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), `open-renamer-${name}-`));
}

test("file selection, recursion, saved paths, and file operations", async () => {
  const dataPath = await createFixtureRoot("data");
  const fixturePath = await createFixtureRoot("files 中文% ");
  const server = await start(dataPath);

  try {
    await mkdir(path.join(fixturePath, "folder 10"));
    await mkdir(path.join(fixturePath, "folder 2", "nested"), { recursive: true });
    await mkdir(path.join(fixturePath, ".hidden-folder"));
    await writeFile(path.join(fixturePath, "folder 2", "nested", "child.txt"), "child");
    await writeFile(path.join(fixturePath, "file 10.txt"), "10");
    await writeFile(path.join(fixturePath, "file 2.txt"), "2");
    await writeFile(path.join(fixturePath, ".secret.txt"), "secret");

    const listedResponse = await request(
      server,
      encodedPathQuery("/file/query", fixturePath),
    );
    assert.equal(listedResponse.status, 200);
    const listed = (await listedResponse.json()) as FileObj[];
    assert.deepEqual(
      listed.map((item) => item.name),
      ["folder 2", "folder 10", "file 2.txt", "file 10.txt"],
    );
    assert.equal(listed[0].path, fixturePath);
    assert.equal(listed[0].isFolder, true);
    assert.equal(typeof listed[2].createdTime, "number");
    assert.equal(typeof listed[2].updatedTime, "number");

    const withHidden = (await (
      await request(
        server,
        encodedPathQuery("/file/query", fixturePath, true),
      )
    ).json()) as FileObj[];
    assert.equal(withHidden.some((item) => item.name === ".secret.txt"), true);

    const recursive = (await (
      await request(server, "/file/recursionQuery", {
        method: "POST",
        body: JSON.stringify([listed[0], listed[2]]),
      })
    ).json()) as FileObj[];
    assert.deepEqual(recursive.map((item) => item.name), ["child.txt", "file 2.txt"]);

    const missing = await request(
      server,
      encodedPathQuery("/file/query", path.join(fixturePath, "missing")),
    );
    assert.equal(missing.status, 500);
    assert.equal(await missing.text(), "路径不存在");

    const existParams = new URLSearchParams({ path: fixturePath });
    const exist = await request(
      server,
      `/file/path/exist?${existParams.toString()}`,
    );
    assert.equal(await exist.text(), "true");

    const encodedTree = JSON.stringify(["文件 目录%", "nested"]);
    const saved = (await (
      await request(server, "/file/path/save", {
        method: "POST",
        body: JSON.stringify({ name: "常用路径", content: encodedTree }),
      })
    ).json()) as { name: string; content: string; id: number };
    assert.equal(saved.name, "常用路径");
    assert.equal(saved.content, encodedTree);

    const paths = (await (await request(server, "/file/path")).json()) as Array<{
      id: number;
      name: string;
    }>;
    assert.equal(paths.length, 1);
    assert.equal(paths[0].name, "常用路径");
    assert.equal((await request(server, `/file/path/delete?id=${paths[0].id}`, {
      method: "DELETE",
    })).status, 200);
    assert.equal(
      ((await (await request(server, "/file/path")).json()) as unknown[]).length,
      0,
    );

    const source = listed.find((item) => item.name === "file 2.txt")!;
    const targetName = "重命名 文件%.txt";
    assert.equal((await request(server, "/file/rename", {
      method: "POST",
      body: JSON.stringify({ source, target: { ...source, name: targetName } }),
    })).status, 200);
    assert.equal(await readFile(path.join(fixturePath, targetName), "utf8"), "2");

    const targetFile = { ...source, name: targetName };
    assert.equal((await request(server, "/file/deleteBatch", {
      method: "POST",
      body: JSON.stringify([targetFile]),
    })).status, 200);
    await assert.rejects(stat(path.join(fixturePath, targetName)));
  } finally {
    await server.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(fixturePath, { recursive: true, force: true });
  }
});

test("saved automatic rules preview and rename files consistently", async () => {
  const dataPath = await createFixtureRoot("auto-data");
  const fixturePath = await createFixtureRoot("auto-files");
  const seasonPath = path.join(fixturePath, "Show", "Season 1");
  const server = await start(dataPath);

  try {
    await mkdir(seasonPath, { recursive: true });
    await writeFile(path.join(seasonPath, "Show.S01E02.1080p.mkv"), "episode 2");
    await writeFile(path.join(seasonPath, "Show.S01E03.720p.mkv"), "episode 3");

    const defaultRule = (await (
      await request(server, "/applicationRule/default")
    ).json()) as { content: string };
    const ruleList = JSON.parse(defaultRule.content) as RuleObj[];

    const selected = (await (
      await request(server, encodedPathQuery("/file/query", seasonPath))
    ).json()) as FileObj[];
    const previewResponse = await request(server, "/renamer/preview", {
      method: "POST",
      body: JSON.stringify({
        fileList: selected,
        ruleList,
        editMode: "direct",
        editTargetFoler: "",
      }),
    });
    assert.equal(previewResponse.status, 200);
    const preview = (await previewResponse.json()) as FileObj[];
    assert.deepEqual(preview.map((item) => item.name), [
      "Show.s1e002.1080p.mkv",
      "Show.s1e003.720p.mkv",
    ]);

    const submit = await request(server, "/renamer/submit", {
      method: "POST",
      body: JSON.stringify({
        fileList: selected,
        changedFileList: preview,
        editMode: "direct",
        editTargetFoler: "",
      }),
    });
    assert.equal(submit.status, 200);
    assert.deepEqual((await submit.json()) as Record<string, unknown>, {
      success: true,
    });
    assert.equal(
      await readFile(path.join(seasonPath, "Show.s1e002.1080p.mkv"), "utf8"),
      "episode 2",
    );
    assert.equal(
      await readFile(path.join(seasonPath, "Show.s1e003.720p.mkv"), "utf8"),
      "episode 3",
    );
    await assert.rejects(stat(path.join(seasonPath, "Show.S01E02.1080p.mkv")));

    const duplicatePath = path.join(fixturePath, "duplicates");
    await mkdir(duplicatePath);
    await writeFile(path.join(duplicatePath, "same-a.txt"), "a");
    await writeFile(path.join(duplicatePath, "same-b.txt"), "b");
    const duplicates = (await (
      await request(server, encodedPathQuery("/file/query", duplicatePath))
    ).json()) as FileObj[];
    const duplicatePreview = (await (
      await request(server, "/renamer/preview", {
        method: "POST",
        body: JSON.stringify({
          fileList: duplicates,
          ruleList: [{
            type: "insert",
            message: "replace",
            data: {
              insertContent: "same",
              type: "replace",
              atInput: 1,
              atIsRightToleft: false,
              ignorePostfix: true,
              autoSeason: false,
              endFilter: false,
              validEnd: [],
            },
          }],
          editMode: "direct",
          editTargetFoler: "",
        }),
      })
    ).json()) as FileObj[];
    assert.deepEqual(duplicatePreview.map((item) => item.name), [
      "same.txt",
      "same.txt",
    ]);
    assert.equal(duplicatePreview[1].errorMessage, "重名");
  } finally {
    await server.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(fixturePath, { recursive: true, force: true });
  }
});

test("hard links preserve sources, create target folders, and reject conflicts", async () => {
  const dataPath = await createFixtureRoot("hardlink-data");
  const fixturePath = await createFixtureRoot("hardlink-files 中文% ");
  const sourcePath = path.join(fixturePath, "incoming");
  const sourceName = "video one 中文%.mp4";
  const sourceFile = path.join(sourcePath, sourceName);
  const server = await start(dataPath);

  try {
    await mkdir(sourcePath);
    await writeFile(sourceFile, "video bytes");

    const rules: RuleObj[] = [{
      type: "insert",
      message: "prefix",
      data: {
        insertContent: "renamed-",
        type: "front",
        atInput: 1,
        atIsRightToleft: false,
        ignorePostfix: true,
        autoSeason: false,
        endFilter: false,
        validEnd: [],
      },
    }];
    const selected = (await (
      await request(server, encodedPathQuery("/file/query", sourcePath))
    ).json()) as FileObj[];

    const preview = (await (
      await request(server, "/renamer/preview", {
        method: "POST",
        body: JSON.stringify({
          fileList: selected,
          ruleList: rules,
          editMode: "hardLink",
          editTargetFoler: "",
        }),
      })
    ).json()) as FileObj[];
    assert.equal(preview[0].name, "renamed-video one 中文%.mp4");

    assert.equal((await request(server, "/renamer/submit", {
      method: "POST",
      body: JSON.stringify({
        fileList: selected,
        changedFileList: preview,
        editMode: "hardLink",
        editTargetFoler: "",
      }),
    })).status, 200);
    const linkedPath = path.join(sourcePath, "renamed-video one 中文%.mp4");
    assert.equal(await readFile(sourceFile, "utf8"), "video bytes");
    assert.equal(await readFile(linkedPath, "utf8"), "video bytes");
    assert.equal((await stat(sourceFile)).ino, (await stat(linkedPath)).ino);

    const targetFolder = path.join(fixturePath, "new target", "中文%");
    const targetPreview = (await (
      await request(server, "/renamer/preview", {
        method: "POST",
        body: JSON.stringify({
          fileList: selected,
          ruleList: rules,
          editMode: "hardLinkNewFolder",
          editTargetFoler: targetFolder,
        }),
      })
    ).json()) as FileObj[];
    assert.equal(targetPreview[0].path, targetFolder);
    assert.equal((await request(server, "/renamer/submit", {
      method: "POST",
      body: JSON.stringify({
        fileList: selected,
        changedFileList: targetPreview,
        editMode: "hardLinkNewFolder",
        editTargetFoler: targetFolder,
      }),
    })).status, 200);
    const movedLink = path.join(targetFolder, targetPreview[0].name);
    assert.equal((await stat(sourceFile)).ino, (await stat(movedLink)).ino);

    const conflictSource = path.join(fixturePath, "conflict-source.txt");
    const conflictTarget = path.join(fixturePath, "taken.txt");
    await writeFile(conflictSource, "source");
    await writeFile(conflictTarget, "taken");
    const conflictSelected = (await (
      await request(server, encodedPathQuery("/file/query", fixturePath))
    ).json()) as FileObj[];
    const conflictFile = conflictSelected.find((item) =>
      item.name === "conflict-source.txt"
    )!;
    const conflictTargetFile = conflictSelected.find((item) =>
      item.name === "taken.txt"
    )!;
    const conflict = await request(server, "/renamer/submit", {
      method: "POST",
      headers: { lang: "zh" },
      body: JSON.stringify({
        fileList: [conflictFile],
        changedFileList: [{ ...conflictFile, name: conflictTargetFile.name }],
        editMode: "direct",
        editTargetFoler: "",
      }),
    });
    assert.equal(conflict.status, 500);
    assert.match(await conflict.text(), /^路径已存在: /);
    assert.equal(await readFile(conflictSource, "utf8"), "source");
    assert.equal(await readFile(conflictTarget, "utf8"), "taken");
  } finally {
    await server.close();
    await rm(dataPath, { recursive: true, force: true });
    await rm(fixturePath, { recursive: true, force: true });
  }
});

test("large preview and submit payloads remain JSON compatible", async () => {
  const dataPath = await createFixtureRoot("large-data");
  const server = await start(dataPath);
  const rule: RuleObj = {
    type: "insert",
    message: "prefix",
    data: {
      insertContent: "large-",
      type: "front",
      atInput: 1,
      atIsRightToleft: false,
      ignorePostfix: true,
      autoSeason: false,
      endFilter: false,
      validEnd: [],
    },
  };
  const files: FileObj[] = Array.from({ length: 2000 }, (_, index) => ({
    name: `file-${index}.txt`,
    realName: `file-${index}`,
    originName: `file-${index}.txt`,
    expandName: ".txt",
    path: path.join(os.tmpdir(), "large-preview"),
    isFolder: false,
    size: index,
    errorMessage: "",
    createdTime: 0,
    updatedTime: 0,
    isAdFile: false,
  }));

  try {
    const previewResponse = await request(server, "/renamer/preview", {
      method: "POST",
      body: JSON.stringify({
        fileList: files,
        ruleList: [rule],
        editMode: "direct",
        editTargetFoler: "",
      }),
    });
    assert.equal(previewResponse.status, 200);
    const preview = (await previewResponse.json()) as FileObj[];
    assert.equal(preview.length, files.length);
    assert.equal(preview[1999].name, "large-file-1999.txt");

    const unchanged = files.map((item) => ({ ...item }));
    const submit = await request(server, "/renamer/submit", {
      method: "POST",
      body: JSON.stringify({
        fileList: files,
        changedFileList: unchanged,
        editMode: "direct",
        editTargetFoler: "",
      }),
    });
    assert.equal(submit.status, 200);
    assert.deepEqual((await submit.json()) as Record<string, unknown>, {
      success: true,
    });
  } finally {
    await server.close();
    await rm(dataPath, { recursive: true, force: true });
  }
});
