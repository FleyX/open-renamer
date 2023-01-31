export default interface AutoPlanConfigDto {
	/**
	 * 待处理的路径
	 */
	paths: Array<string>;
	/**
	 * 版本
	 */
	version: Number;
	/**
	 * 是否忽略season 0
	 */
	ignoreSeason0: Boolean;
	/**
	 * 忽略的文件名
	 */
	ignorePaths: Array<string>;
	/**
	 * 是否删除小于2m的视频文件
	 */
	deleteSmallVideo: boolean;
	/**
	 * 重命名规则
	 */
	rules: Array<string>;
	/**
	 * 是否忽略现有的文件
	 */
	ignoreExist: boolean;
	/**
	 * 是否开始任务
	 */
	start: boolean;
}