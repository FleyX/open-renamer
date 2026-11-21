import path from "node:path";
import { pathToFileURL } from "node:url";
import { startNodeServer, type RunningNodeServer } from "./server/app.ts";

export { startNodeServer };
export type { NodeServerOptions, RunningNodeServer } from "./server/app.ts";

let activeServer: RunningNodeServer | null = null;

async function main(): Promise<void> {
  activeServer = await startNodeServer();
  console.info(`server listened ${activeServer.port}`);
}

async function shutdown(signal: string): Promise<void> {
  console.info(`received ${signal}, shutting down`);
  await activeServer?.close();
  activeServer = null;
}

const entryPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (entryPath === import.meta.url) {
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
