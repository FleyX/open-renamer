/**
 * 提交已确认的整批映射，只接收批次标识和版本，
 * 目标映射完全使用服务器当前已校验的结果
 */
export default interface AiSubmitDto {
  batchId: string;
  version: number;
}
