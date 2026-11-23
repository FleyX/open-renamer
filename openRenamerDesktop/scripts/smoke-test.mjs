import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { _electron as electron } from "playwright-core";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, "..");
const cliArgs = process.argv.slice(2);
const zipArgument = cliArgs.find((argument) => !argument.startsWith("--"));

function option(name, fallback) {
  const prefix = `--${name}=`;
  return (
    cliArgs
      .find((argument) => argument.startsWith(prefix))
      ?.slice(prefix.length) ?? fallback
  );
}

const expectedPlatform = option("platform", process.platform);
const expectedArch = option("arch", process.arch);
const zipPath = path.resolve(
  zipArgument ??
    path.join(
      desktopDir,
      "dist",
      `open-renamer-${expectedPlatform}-${expectedArch}.zip`
    )
);
const testResultsDir = path.join(desktopDir, "test-results");
const diagnosticsBase = path.join(
  testResultsDir,
  `electron-smoke-${expectedPlatform}-${expectedArch}`
);
const logs = [];
let app = null;
let page = null;

function record(message) {
  const text = String(message).trimEnd();
  if (text) {
    logs.push(text);
  }
}

function check(command, args, options = {}) {
  record(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} exited ${result.status}`);
  }
}

async function waitForFile(filePath, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await access(filePath);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`file did not appear: ${filePath}`);
}

function extractZip(archivePath, destination) {
  if (process.platform === "win32") {
    check("tar.exe", ["-xf", archivePath, "-C", destination]);
  } else {
    check("unzip", ["-q", archivePath, "-d", destination]);
  }
}

async function packagedExecutable(installDir) {
  const bundleDir = path.join(
    installDir,
    `open-renamer-${expectedPlatform}-${expectedArch}`
  );
  if (expectedPlatform === "darwin") {
    const bundles = (await readdir(bundleDir)).filter((name) =>
      name.endsWith(".app")
    );
    assert.equal(
      bundles.length,
      1,
      "macOS ZIP must contain exactly one application bundle"
    );
    return path.join(
      bundleDir,
      bundles[0],
      "Contents",
      "MacOS",
      "open-renamer"
    );
  }
  return path.join(
    bundleDir,
    expectedPlatform === "win32" ? "open-renamer.exe" : "open-renamer"
  );
}

async function launch(executablePath, userData, isolatedHome) {
  const launched = await electron.launch({
    executablePath,
    args: [`--user-data-dir=${userData}`, "--lang=en-US"],
    env: {
      ...process.env,
      LANG: "en_US.UTF-8",
      LC_ALL: "en_US.UTF-8",
      HOME: isolatedHome,
      XDG_CONFIG_HOME: path.join(isolatedHome, ".config"),
      APPDATA: path.join(isolatedHome, "AppData", "Roaming"),
      LOCALAPPDATA: path.join(isolatedHome, "AppData", "Local"),
    },
    timeout: 60000,
  });
  const child = launched.process();
  child.stdout?.on("data", (chunk) => record(chunk));
  child.stderr?.on("data", (chunk) => record(chunk));

  try {
    const window = await launched.firstWindow({ timeout: 60000 });
    window.on("pageerror", (error) => record(`pageerror: ${error.message}`));
    window.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        record(`console.${message.type()}: ${message.text()}`);
      }
    });
    await window
      .getByRole("button", { name: "Start renaming", exact: true })
      .waitFor({ timeout: 60000 });
    await window.waitForLoadState("domcontentloaded");
    return { launched, window };
  } catch (error) {
    await launched.close().catch((closeError) => record(closeError));
    throw error;
  }
}

async function openFilePicker(targetPage) {
  await targetPage.getByRole("button", { name: "Add", exact: true }).click();
  const dialog = targetPage.locator(".el-dialog:visible").last();
  await dialog.getByPlaceholder("Filter by keyword").waitFor();
  return dialog;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function navigateToDirectory(dialog, name) {
  const filter = dialog.getByPlaceholder("Filter by keyword");
  await filter.fill(name);
  const link = dialog
    .locator(".file-item a")
    .filter({ hasText: new RegExp(`^${escapeRegExp(name)}$`) })
    .first();
  await link.waitFor({ timeout: 15000 });
  await link.click();
  await dialog.getByText(name, { exact: true }).last().waitFor();
  await filter.fill("");
}

async function navigateToPath(dialog, targetPath) {
  await dialog
    .locator(".file-breadcrumb")
    .getByText("Root", { exact: true })
    .click();
  const root = path.parse(targetPath).root;
  if (process.platform === "win32") {
    await navigateToDirectory(dialog, root.slice(0, 2));
  }
  const segments = path
    .relative(root, targetPath)
    .split(path.sep)
    .filter(Boolean);
  for (const segment of segments) {
    await navigateToDirectory(dialog, segment);
  }
}

async function addFile(targetPage, targetPath, fileName) {
  const dialog = await openFilePicker(targetPage);
  await navigateToPath(dialog, targetPath);
  const filter = dialog.getByPlaceholder("Filter by keyword");
  await filter.fill(fileName);
  const item = dialog
    .locator(".file-item")
    .filter({ hasText: fileName })
    .first();
  await item.waitFor();
  await item.locator(".el-checkbox").click();
  const checkboxClass = await item
    .locator(".el-checkbox")
    .getAttribute("class");
  assert.equal(checkboxClass?.includes("is-checked"), true);
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
}

async function configureDirectRenameRule(targetPage) {
  const ruleBlock = targetPage.locator(".ruleBlock").first();
  const rulePanel = ruleBlock.locator("..");
  const ruleChecks = ruleBlock.locator(".el-checkbox");
  const ruleCount = await ruleChecks.count();
  for (let index = 0; index < ruleCount; index += 1) {
    await ruleChecks.nth(index).click();
  }
  await rulePanel.getByRole("button", { name: "Delete", exact: true }).click();
  await ruleBlock
    .getByText(/Insert:/)
    .waitFor({ state: "detached" })
    .catch(() => {});

  await rulePanel.getByRole("button", { name: /Add rule$/ }).click();
  const ruleDialog = targetPage.locator(".el-dialog:visible").last();
  await ruleDialog.locator("input").first().fill("direct-");
  await ruleDialog.getByText("Prefix", { exact: true }).click();
  await ruleDialog
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await ruleDialog.waitFor({ state: "hidden" });
  await ruleBlock.getByText('Insert:"direct-"', { exact: true }).waitFor();
}

async function startRename(targetPage) {
  await targetPage
    .getByRole("button", { name: "Start renaming", exact: true })
    .click();
  await targetPage
    .locator(".el-loading-mask")
    .waitFor({ state: "hidden", timeout: 15000 })
    .catch(() => {});
  await targetPage.waitForTimeout(300);
}

async function writeDiagnostics(error) {
  await mkdir(testResultsDir, { recursive: true });
  if (page) {
    await page
      .screenshot({ path: `${diagnosticsBase}.png`, fullPage: true })
      .catch((screenshotError) =>
        record(`screenshot failed: ${screenshotError}`)
      );
  }
  const details = [
    `platform=${expectedPlatform} arch=${expectedArch}`,
    `zip=${zipPath}`,
    error instanceof Error ? error.stack ?? error.message : String(error),
    "",
    "application output:",
    ...logs,
    "",
  ].join("\n");
  await writeFile(`${diagnosticsBase}.log`, details, "utf8");
}

function normalizedPath(value) {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function isInside(parent, child) {
  const relative = path.relative(normalizedPath(parent), normalizedPath(child));
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

async function main() {
  await rm(testResultsDir, { recursive: true, force: true });
  await stat(zipPath);

  const workDir = await mkdtemp(
    path.join(os.tmpdir(), "open-renamer-electron-e2e-")
  );
  const installDir = path.join(workDir, "install");
  const isolatedHome = path.join(workDir, "home");
  const userData = path.join(workDir, "user-data");
  const testRoot = await mkdtemp(
    path.join(os.tmpdir(), "open-renamer-electron-files-")
  );
  const seasonDir = path.join(testRoot, "Show", "Season 1");
  const sourcePath = path.join(seasonDir, "normal.txt");
  const targetPath = path.join(seasonDir, "direct-normal.txt");
  const templateName = `electron-template-${Date.now()}`;
  let actualUserData = null;
  let firstOrigin = null;

  try {
    await mkdir(installDir, { recursive: true });
    await mkdir(seasonDir, { recursive: true });
    await mkdir(path.join(isolatedHome, ".config"), { recursive: true });
    await mkdir(path.join(isolatedHome, "AppData", "Roaming"), {
      recursive: true,
    });
    await mkdir(path.join(isolatedHome, "AppData", "Local"), {
      recursive: true,
    });
    await writeFile(sourcePath, "normal");
    extractZip(zipPath, installDir);

    const executablePath = await packagedExecutable(installDir);
    await access(executablePath);
    let launched = await launch(executablePath, userData, isolatedHome);
    app = launched.launched;
    page = launched.window;
    firstOrigin = new URL(page.url()).origin;

    const runtime = await app.evaluate(async ({ app: electronApp }) => ({
      appPath: electronApp.getAppPath(),
      userData: electronApp.getPath("userData"),
      node: process.versions.node,
      electron: process.versions.electron,
      platform: process.platform,
      arch: process.arch,
    }));
    assert.equal(runtime.node, "24.22.3");
    assert.equal(runtime.electron, "45.4.1");
    assert.equal(runtime.platform, expectedPlatform);
    assert.equal(runtime.arch, expectedArch);
    assert.equal(
      runtime.appPath.endsWith(
        path.join(expectedPlatform === "darwin" ? "Resources" : "resources", "app.asar"),
      ),
      true
    );
    assert.equal(
      normalizedPath(runtime.userData),
      normalizedPath(userData),
      "packaged app must use the isolated test user-data directory"
    );
    assert.equal(isInside(workDir, runtime.userData), true);
    actualUserData = runtime.userData;
    assert.equal(
      await page.evaluate(() => typeof window.vueInstance !== "undefined"),
      true
    );
    assert.equal(
      await page.evaluate(() => window.location.origin),
      firstOrigin
    );
    assert.equal(
      await page.evaluate(() =>
        fetch("/openRenamer/api/applicationRule").then(
          (response) => response.status
        )
      ),
      200
    );
    console.log(
      `PASS window loads Vue with Electron ${runtime.electron}, Node ${runtime.node}, ${runtime.platform}/${runtime.arch}`
    );

    await configureDirectRenameRule(page);
    await addFile(page, seasonDir, "normal.txt");
    const preview = page.locator(".fileBlock > div").nth(1);
    await preview
      .getByText("direct-normal.txt", { exact: true })
      .waitFor({ timeout: 15000 });
    await startRename(page);
    await waitForFile(targetPath);
    assert.equal(await readFile(targetPath, "utf8"), "normal");
    await assert.rejects(stat(sourcePath));
    console.log("PASS actual file picker + preview + local file rename");

    await page
      .getByRole("button", { name: "Select template", exact: true })
      .click();
    const templateDialog = page.locator(".el-dialog:visible").last();
    await templateDialog
      .getByRole("button", { name: "新增模板", exact: true })
      .click();
    const editTemplateDialog = page.locator(".el-dialog:visible").last();
    await editTemplateDialog.locator("input").nth(0).fill(templateName);
    await editTemplateDialog
      .locator("input")
      .nth(1)
      .fill("created by packaged Electron smoke test");
    await editTemplateDialog
      .getByRole("button", { name: "提交", exact: true })
      .click();
    await templateDialog.getByText(templateName, { exact: true }).waitFor();

    const templates = await page.evaluate(() =>
      fetch("/openRenamer/api/applicationRule").then((response) =>
        response.json()
      )
    );
    assert.equal(
      templates.some((template) => template.name === templateName),
      true,
      "template must be readable through the browser session"
    );
    console.log("PASS browser session writes and reads a SQLite template");

    await app.close();
    app = null;
    const backendAlive = await fetch(
      `${firstOrigin}/openRenamer/api/file/isWindows`,
      {
        signal: AbortSignal.timeout(1500),
      }
    )
      .then(() => true)
      .catch(() => false);
    assert.equal(backendAlive, false);
    console.log("PASS local backend stops when the application exits");

    const database = new DatabaseSync(
      path.join(actualUserData, "data", "database.db")
    );
    try {
      const saved = database
        .prepare("select name, comment from application_rule where name = ?")
        .all(templateName);
      const migrations = database
        .prepare(
          "select fileName from _open_renamer_migrations order by fileName"
        )
        .all();
      assert.equal(saved.length, 1);
      assert.equal(saved[0].comment, "created by packaged Electron smoke test");
      assert.equal(migrations.length, 5);
    } finally {
      database.close();
    }
    console.log("PASS fresh SQLite database initialized with five migrations");

    launched = await launch(executablePath, actualUserData, isolatedHome);
    app = launched.launched;
    page = launched.window;
    await page
      .getByRole("button", { name: "Select template", exact: true })
      .click();
    const reopenedDialog = page.locator(".el-dialog:visible").last();
    const persistedRow = reopenedDialog.locator(".el-table__row").filter({
      hasText: templateName,
    });
    await persistedRow.waitFor();
    console.log(
      "PASS template remains available through Vue after application restart"
    );

    assert.deepEqual(
      [...new Set(logs.filter((line) => line.startsWith("pageerror:")))],
      []
    );
    await app.close();
    app = null;
    console.log("E2E_OK");
  } catch (error) {
    await writeDiagnostics(error);
    throw error;
  } finally {
    if (app) {
      await app
        .close()
        .catch((error) => console.error("app close failed", error));
    }
    await rm(testRoot, { recursive: true, force: true });
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("E2E_FAILED", error);
  process.exitCode = 1;
});
