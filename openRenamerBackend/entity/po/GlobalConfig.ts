export default class GlobalConfig {
	/**
	code
	 */
	code: string;

	/**
	规则内容，json序列化后
	 */
	val: string;
	/**
	描述
	*/
	description: string;

	constructor(code: string, val: string, desc: string) {
		this.code = code;
		this.val = val;
		this.description = desc;
	}
}