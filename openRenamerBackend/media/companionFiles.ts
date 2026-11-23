import path from "node:path";
import { isSub, isVideo } from "../util/MediaUtil.ts";

/**
 * 附属文件：随电影或剧集进入对应目录的字幕、NFO 和封面。
 * 只负责文件名层面的发现与归属判断，路径校验与移动仍由 AiRenameService 处理。
 */

export type CompanionKind = "subtitle" | "nfo" | "cover";

const COVER_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ADDITIONAL_VIDEO_EXTS = new Set(["m4v", "webm", "ts", "m2ts"]);

/** 通用封面名：目录里只有一部电影时才能自动关联 */
const GENERIC_COVER_NAMES = new Set([
  "poster",
  "fanart",
  "banner",
  "thumb",
  "landscape",
  "logo",
  "clearart",
  "disc",
  "cover",
  "folder",
  "default",
  "movie",
]);

/** 字幕语言码（zh、eng、zh-cn、pt-br 等）与字幕类别（forced、sdh 等）后缀 */
const SUFFIX_TOKEN = /^(?:[a-z]{2,3}(?:-[a-z0-9]{2,8})?|forced|sdh|cc|hi)$/i;

export function companionKindOf(fileName: string): CompanionKind | null {
  const ext = path.extname(fileName).toLowerCase();
  if (isSub(ext.slice(1)) || ext === ".vtt" || ext === ".idx" || ext === ".sup") {
    return "subtitle";
  }
  if (ext === ".nfo") {
    return "nfo";
  }
  if (COVER_EXTS.has(ext)) {
    return "cover";
  }
  return null;
}

/** 该文件名是否是受支持的附属文件名 */
export function isCompanionFileName(fileName: string): boolean {
  return companionKindOf(fileName) !== null;
}

export function isVideoFileName(fileName: string): boolean {
  const ext = path.extname(fileName).slice(1).toLowerCase();
  return isVideo(ext) || ADDITIONAL_VIDEO_EXTS.has(ext);
}

/** 通用封面名（不含扩展名，小写比较） */
export function isGenericCoverName(fileName: string): boolean {
  if (companionKindOf(fileName) !== "cover") {
    return false;
  }
  const stem = fileName.slice(0, fileName.length - path.extname(fileName).length);
  return GENERIC_COVER_NAMES.has(stem.toLowerCase());
}

/**
 * 与实际视频基本名比较，保留完整语言、类别或封面后缀。
 * 例如 Show.S01E01.zh-cn.forced.srt 保留 .zh-cn.forced.srt。
 */
export function companionSuffix(
  fileName: string,
  videoBase: string,
  kind: CompanionKind,
): string | null {
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  if (stem.slice(0, videoBase.length).toLowerCase() === videoBase.toLowerCase()) {
    const extra = stem.slice(videoBase.length);
    if (!extra || (extra.startsWith(".") &&
      extra.slice(1).split(".").every((token) => SUFFIX_TOKEN.test(token))) ||
      (kind === "cover" && /^[.-]/.test(extra) &&
        GENERIC_COVER_NAMES.has(extra.slice(1).toLowerCase()))) {
      return extra + ext;
    }
  }
  return null;
}
