import FileObj from "../vo/FileObj.ts";

export default interface PreviewDto {
  /**
   * 文件列表
   */
  fileList: Array<FileObj>;
  /**
   * 规则列表
   */
  ruleList: Array<Record<string, unknown>>;
  /** */
  editMode: string;
  editTargetFoler: string;
}
