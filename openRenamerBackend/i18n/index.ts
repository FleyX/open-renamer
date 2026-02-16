/// <reference lib="deno.ns" />
import * as yaml from "std/yaml/mod.ts";
import * as path from "std/path/mod.ts";
// 导入Deno标准库日志模块
import * as logger from "std/log/mod.ts";
import { Context } from "oak";

// 为 map 添加类型定义
const map: Record<string, string> = {};

export function init() {
  // 使用相对路径指向当前文件所在的i18n目录
  const i18nFolder = path.dirname(path.fromFileUrl(import.meta.url));

  // 使用 Deno.readDir 替代 fs-extra.readdirSync
  (async () => {
    try {
      for await (const entry of Deno.readDir(i18nFolder)) {
        if (entry.isFile && entry.name.endsWith(".yaml")) {
          const content = await Deno.readTextFile(
            path.join(i18nFolder, entry.name),
          );
          const res = yaml.parse(content);
          dealYaml("", res as YamlObject);
        }
      }
      logger.info("i18n加载完毕");
    } catch (e) {
      logger.error("i18n初始化失败:", e);
    }
  })();
}

export function getMessage(lang: string, key: string): string {
  const val = map[key + "." + (lang ? lang : "en")];
  return val ? val : key;
}

export function getCtxMessage(ctx: Context, key: string): string {
  const lang = ctx.request.headers.get("lang") || "";
  const val = map[key + "." + (lang ? lang : "en")];
  return val ? val : key;
}

// 定义更具体的类型来替代 any
interface YamlObject {
  [key: string]: string | number | boolean | YamlObject;
}

function dealYaml(pre: string, res: YamlObject) {
  Object.keys(res).forEach((key) => {
    const val = res[key];
    const mapKey = pre == "" ? key : (pre + "." + key);
    if (typeof val != "object" || val === null) {
      map[mapKey] = String(val);
    } else {
      dealYaml(mapKey, val as YamlObject);
    }
  });
}
