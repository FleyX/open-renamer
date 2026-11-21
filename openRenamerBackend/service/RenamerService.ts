import { link, mkdir, rename as renamePath, stat } from "node:fs/promises";
import path from "node:path";

import type FileObj from "../entity/vo/FileObj.ts";
import RuleObj from "../entity/vo/RuleObj.ts";
import type RuleInterface from "../entity/bo/rules/RuleInterface.ts";
import type PreviewDto from "../entity/dto/PreviewDto.ts";
import type RenameDto from "../entity/dto/RenameDto.ts";

export type MessageLookup = (key: string) => string;

class RenamerService {
  static preview(
    req: PreviewDto,
    getMessage: MessageLookup,
  ): Array<FileObj> {
    const newFolder = req.editMode === "hardLinkNewFolder";
    if (
      newFolder &&
      (req.editTargetFoler === null || req.editTargetFoler === "")
    ) {
      throw new Error(
        getMessage("rename.edit-target-folder-not-empty"),
      );
    }
    const ruleObjs = req.ruleList.map((item) => new RuleObj(item));
    const newNameSet = new Set<string>();
    for (const obj of req.fileList) {
      ruleObjs.forEach((item) => (item.data as RuleInterface).deal(obj));
      obj.path = newFolder ? req.editTargetFoler : obj.path;
      if (newNameSet.has(obj.path + obj.name)) {
        obj.errorMessage = "重名";
      }
      newNameSet.add(obj.path + obj.name);
    }
    return req.fileList;
  }

  static async rename(req: RenameDto, getMessage: MessageLookup) {
    const isHardLink = req.editMode === "hardLink" ||
      req.editMode === "hardLinkNewFolder";
    for (let i = 0; i < req.fileList.length; i++) {
      const oldPath = path.join(req.fileList[i].path, req.fileList[i].name);
      const newPath = path.join(
        req.changedFileList[i].path,
        req.changedFileList[i].name,
      );
      if (oldPath === newPath) {
        continue;
      }
      if (await exists(newPath)) {
        throw new Error(
          getMessage("rename.path-already-exists") + newPath,
        );
      }
      await realRename(oldPath, newPath, isHardLink, getMessage);
    }
  }
}

async function exists(pathStr: string): Promise<boolean> {
  try {
    await stat(pathStr);
    return true;
  } catch {
    return false;
  }
}

/**
 * 执行重命名，如果hardlink为false直接将旧路径重命名为新路径；否则使用新路径创建硬链接（需兼容windows，linux，mac），硬链接创建失败给出错误提示
 * @param oldPath 旧路径
 * @param newPath 新路径
 * @param hardlink 是否创建硬链接
 */
async function realRename(
  oldPath: string,
  newPath: string,
  hardlink: boolean,
  getMessage: MessageLookup,
): Promise<void> {
  if (hardlink) {
    await createHardLink(oldPath, newPath, getMessage);
  } else {
    await renamePath(oldPath, newPath);
  }
}

/**
 * 创建硬链接，兼容 Windows、Linux、macOS
 * @param oldPath 源文件路径
 * @param newPath 硬链接路径
 */
async function createHardLink(
  oldPath: string,
  newPath: string,
  getMessage: MessageLookup,
): Promise<void> {
  try {
    const sourceStat = await stat(oldPath);
    if (!sourceStat.isFile()) {
      throw new Error(getMessage("rename.source-not-file") + oldPath);
    }

    const targetDir = path.dirname(newPath);
    if (targetDir && !(await exists(targetDir))) {
      await mkdir(targetDir, { recursive: true });
    }

    await link(oldPath, newPath);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        getMessage("rename.hardlink-create-failed") + error.message,
      );
    }
    throw error;
  }
}

export default RenamerService;
