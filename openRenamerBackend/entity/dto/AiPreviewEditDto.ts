import type AiRenameRow from "../vo/AiRenameRow.ts";

/**
 * 编辑预览后的重新校验请求，不请求模型
 */
export default interface AiPreviewEditDto {
  batchId: string;
  rows: Array<Pick<AiRenameRow, "id" | "targetRel">>;
}
