/**
 * 附属文件归属确认：附属行标识 + 候选视频行标识
 */
export default interface AiCompanionEditDto {
  /**
   * 附属行标识，必须来自原批次
   */
  id: string;
  /**
   * 归属视频行标识，必须在该附属行的候选列表中
   */
  ownerRowId: string;
}
