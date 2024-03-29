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

	constructor(name: string, comment: string, content: string) {
		this.createdDate = Date.now();
		this.updatedDate = this.createdDate;
		this.name = name;
		this.comment = comment;
		this.content = content;
	}
}