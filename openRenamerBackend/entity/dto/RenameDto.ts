import FileObj from "../vo/FileObj.ts";

export default interface PreviewDto {
  /**
   * 文件列表
   */
  fileList: Array<FileObj>;

  /**
   * 修改后的文件信息
   */
  changedFileList: Array<FileObj>;

  /**
   * 修改模式
   * direct：直接修改
   * hardLink：新建硬链接修改
   * hardLinkNewFolder：新建硬链接修改并移动到指定目录
   */
  editMode: string;

  /**
   * 修改目标文件夹
   */
  editTargetFoler: string;
}
