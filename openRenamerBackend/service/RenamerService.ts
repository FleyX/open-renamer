import { join, dirname } from "std/path/mod.ts";
import { exists } from "std/fs/mod.ts";
import { Context } from "oak";

import FileObj from "../entity/vo/FileObj.ts";
import RuleObj from "../entity/vo/RuleObj.ts";
import RuleInterface from "../entity/bo/rules/RuleInterface.ts";
import PreviewDto from "../entity/dto/PreviewDto.ts";
import { getCtxMessage } from "../i18n/index.ts";
import RenameDto from "../entity/dto/RenameDto.ts";

class RenamerService {
  static preview(req: PreviewDto, ctx: Context): Array<FileObj> {
    const newFolder = req.editMode === "hardLinkNewFolder";
    if (
      newFolder &&
      (req.editTargetFoler === null || req.editTargetFoler == "")
    ) {
      throw new Error(
        getCtxMessage(ctx, "rename.edit-target-folder-not-empty"),
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

  static async rename(req: RenameDto, ctx: Context) {
    const isHardLink = req.editMode === "hardLink" ||
      req.editMode === "hardLinkNewFolder";
    for (let i = 0; i < req.fileList.length; i++) {
      const oldPath = join(req.fileList[i].path, req.fileList[i].name);
      const newPath = join(
        req.changedFileList[i].path,
        req.changedFileList[i].name,
      );
      if (oldPath === newPath) {
        continue;
      }
      if (await exists(newPath)) {
        throw new Error(
          getCtxMessage(ctx, "rename.path-already-exists") + newPath,
        );
      }
      await realRename(oldPath, newPath, isHardLink, ctx);
    }
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
  ctx: Context,
): Promise<void> {
  if (hardlink) {
    // 创建硬链接
    await createHardLink(oldPath, newPath, ctx);
  } else {
    // 直接重命名
    await Deno.rename(oldPath, newPath);
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
  ctx: Context,
): Promise<void> {
  try {
    // 检查源文件是否存在且是文件
    const stat = await Deno.stat(oldPath);
    if (!stat.isFile) {
      throw new Error(getCtxMessage(ctx, "rename.source-not-file") + oldPath);
    }

    // 确保目标目录存在
    const targetDir = dirname(newPath);
    if (targetDir && !(await exists(targetDir))) {
      await Deno.mkdir(targetDir, { recursive: true });
    }

    // 根据操作系统选择合适的命令
    const os = Deno.build.os;
    let cmd: string[];

    switch (os) {
      case "windows":
        // Windows 使用 mklink /H
        cmd = ["cmd", "/c", "mklink", "/H", newPath, oldPath];
        break;
      case "darwin": // macOS
      case "linux":
        // Unix-like 系统使用 ln
        cmd = ["ln", oldPath, newPath];
        break;
      default:
        throw new Error(getCtxMessage(ctx, "rename.unsupported-os") + os);
    }

    const command = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdout: "piped",
      stderr: "piped",
    });

    const output = await command.output();

    if (!output.success) {
      const stderr = new TextDecoder().decode(output.stderr);
      throw new Error(
        getCtxMessage(ctx, "rename.hardlink-create-failed") + stderr,
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        getCtxMessage(ctx, "rename.hardlink-create-failed") + error.message,
      );
    }
    throw error;
  }
}

export default RenamerService;
