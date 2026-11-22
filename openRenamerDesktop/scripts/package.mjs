import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { packager } from "@electron/packager";
import { buildDesktopApp } from "./build.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, "..");
const outputDir = path.join(desktopDir, "dist");
const { devDependencies } = JSON.parse(
  await readFile(path.join(desktopDir, "package.json"), "utf8"),
);

const { values } = parseArgs({
  options: {
    platform: { type: "string", default: "linux" },
    arch: { type: "string", default: "x64" },
    "skip-frontend": { type: "boolean", default: false },
  },
});

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

async function main() {
  const appDir = await buildDesktopApp({
    skipFrontend: values["skip-frontend"],
  });
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const appPaths = await packager({
    dir: appDir,
    out: outputDir,
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
  const zipPath = path.join(
    outputDir,
    `open-renamer-${values.platform}-${values.arch}.zip`,
  );
  run("zip", ["-qr", zipPath, path.basename(appPath)], {
    cwd: outputDir,
  });
  console.info(`Electron 应用目录: ${appPath}`);
  console.info(`Electron ZIP: ${zipPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
