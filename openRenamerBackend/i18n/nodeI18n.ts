import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

interface YamlObject {
  [key: string]: string | number | boolean | YamlObject | null;
}

const messages = new Map<string, string>();

function flatten(prefix: string, value: YamlObject): void {
  for (const [key, child] of Object.entries(value)) {
    const messageKey = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "object" && child !== null) {
      flatten(messageKey, child);
    } else {
      messages.set(messageKey, String(child));
    }
  }
}

export async function loadGlobalMessages(
  resourceRootPath: string,
): Promise<void> {
  messages.clear();
  const content = await readFile(
    path.join(resourceRootPath, "i18n", "global.yaml"),
    "utf8",
  );
  const parsed = parse(content) as YamlObject | null;
  if (parsed) {
    flatten("", parsed);
  }
}

export function getNodeMessage(lang: string | null | undefined, key: string) {
  return messages.get(`${key}.${lang || "en"}`) ?? key;
}
