import { mkdir, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { packager } from "@electron/packager";
import { buildDesktopApp } from "./build.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, "..");
const outputDir = path.join(desktopDir, "dist");
const packageDir = path.join(desktopDir, ".stage", "package");
const { devDependencies } = JSON.parse(
  await readFile(path.join(desktopDir, "package.json"), "utf8")
);

const { values } = parseArgs({
  args: process.argv.slice(2).filter((argument) => argument !== "--"),
  options: {
    platform: { type: "string", default: "linux" },
    arch: { type: "string", default: "x64" },
    "skip-frontend": { type: "boolean", default: false },
  },
});

const supportedTargets = new Set(["linux-x64", "win32-x64", "darwin-arm64"]);
const targetName = `${values.platform}-${values.arch}`;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} 执行失败: ${result.status}`);
  }
}

async function findMacAppBundle(parentDir) {
  const entries = await readdir(parentDir, { withFileTypes: true });
  const bundles = entries.filter(
    (entry) => entry.isDirectory() && entry.name.endsWith(".app")
  );
  if (bundles.length !== 1) {
    throw new Error(`预期一个 macOS .app bundle，实际为 ${bundles.length} 个`);
  }
  return path.join(parentDir, bundles[0].name);
}

function createZip(platform, archivePath, bundleName) {
  if (process.platform === "win32" && platform === "win32") {
    run("tar.exe", ["-a", "-cf", archivePath, bundleName], { cwd: outputDir });
    return;
  }

  const args =
    platform === "darwin"
      ? ["-yqr", archivePath, bundleName]
      : ["-qr", archivePath, bundleName];
  run("zip", args, { cwd: outputDir });
}

async function main() {
  if (!supportedTargets.has(targetName)) {
    throw new Error(
      `不支持的 Electron 目标 ${targetName}；仅支持 ${[
        ...supportedTargets,
      ].join(", ")}`
    );
  }

  const appDir = await buildDesktopApp({
    skipFrontend: values["skip-frontend"],
  });
  await rm(packageDir, { recursive: true, force: true });
  await mkdir(packageDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  const appPaths = await packager({
    dir: appDir,
    out: packageDir,
    platform: values.platform,
    arch: values.arch,
    electronVersion: devDependencies.electron,
    name: "open-renamer",
    executableName: "open-renamer",
    asar: true,
    overwrite: true,
    prune: true,
  });
  if (appPaths.length !== 1) {
    throw new Error(`预期生成一个应用目录，实际为 ${appPaths.length} 个`);
  }

  const appPath = appPaths[0];
  await stat(appPath);
  const bundleDir = path.join(outputDir, `open-renamer-${targetName}`);
  const zipPath = path.join(outputDir, `open-renamer-${targetName}.zip`);

  await rm(bundleDir, { recursive: true, force: true });
  await rm(zipPath, { force: true });
  await rename(appPath, bundleDir);

  if (values.platform === "darwin" && process.platform === "darwin") {
    const macAppBundle = await findMacAppBundle(bundleDir);
    run("codesign", ["--force", "--deep", "--sign", "-", macAppBundle]);
  }

  createZip(values.platform, zipPath, path.basename(bundleDir));
  const archiveStat = await stat(zipPath);
  if (archiveStat.size === 0) {
    throw new Error(`生成的 ZIP 为空: ${zipPath}`);
  }

  console.info(`Electron 应用目录: ${bundleDir}`);
  console.info(`Electron ZIP: ${zipPath} (${archiveStat.size} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
