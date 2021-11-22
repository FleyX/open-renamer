export default class ApplicationRule {
	/**
	创建时间
	 */
	createdDate: number;
	/**
	更新时间
	 */
	updatedDate: number;
	id: number;
	/**
	名称
	 */
	name: string;
	/**
	说明
	 */
	comment: string;
	/**
	规则内容，json序列化后
	 */
	content: string;
}