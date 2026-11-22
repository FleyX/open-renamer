import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { build as esbuild } from "esbuild";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, "..");
const repositoryRoot = path.resolve(desktopDir, "..");
const frontendDir = path.join(repositoryRoot, "openRenamerFront");
const backendDir = path.join(repositoryRoot, "openRenamerBackend");
const stageDir = path.join(desktopDir, ".stage");
const appDir = path.join(stageDir, "app");
const packageJson = JSON.parse(
  await readFile(path.join(desktopDir, "package.json"), "utf8"),
);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} 执行失败: ${result.status}`);
  }
}

function bundleOptions(entryPoint, outfile, external = []) {
  return {
    absWorkingDir: desktopDir,
    entryPoints: [entryPoint],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node24",
    external: ["electron", ...external],
    banner: {
      js: 'import { createRequire as __openRenamerCreateRequire } from "node:module"; const require = __openRenamerCreateRequire(import.meta.url);',
    },
    logLevel: "info",
  };
}

export async function buildDesktopApp({ skipFrontend = false } = {}) {
  if (!skipFrontend) {
    run("pnpm", ["--dir", frontendDir, "build"]);
  }

  await rm(stageDir, { recursive: true, force: true });
  await mkdir(appDir, { recursive: true });

  const frontendDist = path.join(frontendDir, "dist");
  try {
    await cp(frontendDist, path.join(appDir, "static"), {
      recursive: true,
      filter: (source) => !source.endsWith(".map"),
    });
  } catch (error) {
    throw new Error(
      `无法复制 Vue 构建产物，请先构建前端或去掉 --skip-frontend: ${error}`,
      { cause: error },
    );
  }
  const sqlDir = path.join(backendDir, "sqls");
  await cp(sqlDir, path.join(appDir, "sqls"), {
    recursive: true,
    filter: (source) => source === sqlDir || source.endsWith(".sql"),
  });
  await mkdir(path.join(appDir, "i18n"), { recursive: true });
  await cp(
    path.join(backendDir, "i18n", "global.yaml"),
    path.join(appDir, "i18n", "global.yaml"),
  );

  await esbuild(
    bundleOptions("src/node-server.ts", path.join(appDir, "node-server.js")),
  );
  await esbuild(
    bundleOptions("src/main.ts", path.join(appDir, "main.js"), [
      "./node-server.js",
    ]),
  );

  const stagedPackageJson = {
    name: "open-renamer",
    productName: "Open Renamer",
    version: packageJson.version,
    description: "Open Renamer desktop client",
    private: true,
    type: "module",
    main: "main.js",
  };
  await writeFile(
    path.join(appDir, "package.json"),
    `${JSON.stringify(stagedPackageJson, null, 2)}\n`,
  );

  return appDir;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  try {
    const appPath = await buildDesktopApp({
      skipFrontend: process.argv.includes("--skip-frontend"),
    });
    console.info(`Electron 应用输入目录已生成: ${appPath}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
