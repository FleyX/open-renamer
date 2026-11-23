import type { AiServiceConfig } from "./AiGenerateDto.ts";

/**
 * 重试生成失败行的请求：只重发这些行的相对路径，
 * 其他行保留当前已确认的目标映射
 */
export default interface AiRetryDto {
  batchId: string;
  version: number;
  /**
   * 要重试的失败行标识，必须来自原批次且为生成失败行
   */
  rowIds: Array<string>;
  /**
   * 本次模型服务配置，批次不保存 API Key
   */
  service: AiServiceConfig;
}
