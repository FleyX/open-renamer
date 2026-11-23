/**
 * AI 命名预览中的一行，对应一个源文件
 */
export default interface AiRenameRow {
  /**
   * 行标识（发给模型的不透明标识）
   */
  id: string;
  /**
   * 源文件绝对路径（仅本地使用，不发给模型）
   */
  sourcePath: string;
  /**
   * 发给模型的相对路径
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
   * 问题描述，空字符串表示可用
   */
  problem: string;
  /**
   * 问题是否来自生成失败（模型未给出可用目标），此类行可单独重试；
   * 路径校验错误不可重试
   */
  retryable: boolean;
}
