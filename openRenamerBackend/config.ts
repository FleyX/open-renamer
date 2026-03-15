import * as path from "std/path/mod.ts";
import { getPort } from "./util/NetUtil.ts";
import * as logger from "std/log/mod.ts";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

const rootPath = __dirname;
const map: Record<string, string> = {};
logger.info(Deno.args);
// argv 传递 port，dataPath,env,token
for (let i = 0; i < Deno.args.length; i++) {
  if (Deno.args[i] != null && Deno.args[i] != "") {
    const strings = Deno.args[i].split(":");
    map[strings[0]] = strings[1];
  }
}

const env = map["env"]
  ? map["env"]
  : Deno.env.get("ENV")
  ? Deno.env.get("ENV")
  : "dev";
const basePort = map["port"]
  ? parseInt(map["port"])
  : Deno.env.get("PORT")
  ? parseInt(Deno.env.get("PORT")!)
  : 8089;

const config = {
  rootPath,
  dataPath: map["dataPath"]
    ? map["dataPath"]
    : Deno.env.get("DATA_PATH")
    ? Deno.env.get("DATA_PATH")!
    : env == "desktop"
    ? path.join(path.dirname(Deno.execPath()), "data")
    : path.join(rootPath, "data"),
  port: env == "desktop" ? getPort(20000, 50000) : basePort,
  token: map["token"]
    ? map["token"]
    : Deno.env.get("TOKEN")
    ? Deno.env.get("TOKEN")!
    : null,
  env,
  urlPrefix: "/openRenamer/api",
  isWindows: Deno.build.os === "windows",
  isMac: Deno.build.os === "darwin",
  publicPath: new Set(["POST/public/checkToken"]),
};

export default config;
