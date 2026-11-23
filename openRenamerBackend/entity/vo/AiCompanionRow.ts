import type { CompanionKind } from "../../media/companionFiles.ts";

/**
 * AI 命名预览中的附属文件行（字幕、NFO、封面），随归属视频进入同一目录
 */
export default interface AiCompanionRow {
  /**
   * 行标识（C001 起，仅展示与编辑用，不发给模型作为输出行）
   */
  id: string;
  /**
   * 附属文件绝对路径（仅本地使用）
   */
  sourcePath: string;
  /**
   * 发给模型的相对路径（参考信息）
   */
  contextPath: string;
  /**
   * 目标相对路径（相对目标根目录，可编辑）
   */
  targetRel: string;
  /**
   * 展示用的完整目标路径
   */
  targetAbs: string;
  /**
   * 问题描述，空字符串表示可用；归属待确认或归属视频目标不可用时非空
   */
  problem: string;
  kind: CompanionKind;
  /**
   * 同目录候选视频行标识，歧义行由用户在其中确认归属
   */
  candidateVideoIds: Array<string>;
  /**
   * 当前归属视频行标识；null 表示归属待确认
   */
  ownerRowId: string | null;
  /**
   * 目标路径是否由预设媒体字段派生；用户手工编辑后变为 false，
   * 归属或字段变更不再重算该行
   */
  presetManaged: boolean;
}
