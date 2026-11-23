import type AiRenameRow from "../vo/AiRenameRow.ts";
import type AiCompanionEditDto from "./AiCompanionEditDto.ts";

/**
 * 作品组补充字段：年份填一次，更新同组所有条目
 */
export interface AiGroupSupplement {
  /**
   * 作品组标识（来自预览响应）
   */
  key: string;
  /**
   * 四位年份；null 表示清除补充，回到待补充
   */
  year?: number | null;
}

/**
 * 剧集行补充字段：季号、集号按行填写
 */
export interface AiRowSupplement {
  /**
   * 行标识，必须来自原批次
   */
  id: string;
  /**
   * 季号（0-999）；null 表示清除补充
   */
  season?: number | null;
  /**
   * 集号（1-999）；null 表示清除补充
   */
  episode?: number | null;
}

/**
 * 编辑预览后的重新校验请求，不请求模型
 */
export default interface AiPreviewEditDto {
  batchId: string;
  rows: Array<Pick<AiRenameRow, "id" | "targetRel"> & { edited?: boolean }>;
  /**
   * 电影/剧集预设的作品组年份补充
   */
  groups?: Array<AiGroupSupplement>;
  /**
   * 剧集预设的行季号、集号补充
   */
  rowFields?: Array<AiRowSupplement>;
  /**
   * 附属文件归属确认：附属行标识 + 候选视频行标识
   */
  companions?: Array<AiCompanionEditDto>;
  /**
   * 切换执行方式（移动/硬链接）：只重新校验路径，不请求模型
   */
  mode?: "move" | "hardlink";
}
