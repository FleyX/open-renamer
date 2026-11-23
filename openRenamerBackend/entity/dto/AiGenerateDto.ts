import type FileObj from "../vo/FileObj.ts";

/**
 * OpenAI 兼容服务配置，API Key 只随请求进入，不回显
 */
export interface AiServiceConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

/**
 * AI 命名生成请求
 */
export default interface AiGenerateDto {
  /**
   * 所选源文件；目录选择时附带来源目录，直接选择文件时省略
   */
  files: Array<FileObj & { sourceDir?: string }>;
  /**
   * 所选目录的绝对路径（兼容旧调用方），逐文件 sourceDir 优先
   */
  baseDir?: string;
  /**
   * 目标根目录（留在本地，不发给模型），必须是已有绝对目录
   */
  targetRoot: string;
  /**
   * 命名预设；省略或 custom 时按自定义命名规范处理
   */
  preset?: "custom" | "movie" | "series";
  /**
   * 执行方式：move 移动（默认，跨盘时复制成功后删除源）或 hardlink 创建硬链接并保留源
   */
  mode?: "move" | "hardlink";
  /**
   * 命名规范
   */
  instruction: string;
  /**
   * 模型服务配置
   */
  service: AiServiceConfig;
}
