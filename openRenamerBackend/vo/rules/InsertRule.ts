import RuleInterface from "./RuleInterface";
import FileObj from "../FileObj";

export default class InsertRule implements RuleInterface {

	/**
	 * 插入内容
	 */
	insertContent: string;
	/**
	 * 操作类别，front：前缀，backend：后缀，at:位置，replace:替换当前文件名
	 */
	type: string;
	/**
	 * 当type为at,时的位置,从1开始
	 */
	atInput: number;
	/**
	 * 当type为at,时的方向，true:从右到左，false:从左到右
	 */
	atIsRightToleft: boolean;
	/**
	 * 忽略拓展名，true:忽略，false：不忽略
	 */
	ignorePostfix: boolean;

	constructor(data: any) {
		this.insertContent = data.insertContent;
		this.type = data.type;
		this.atInput = data.atInput;
		this.atIsRightToleft = data.atIsRightToleft;
		this.ignorePostfix = data.ignorePostfix;
	}


	deal(file: FileObj): string {
		return null;
	}
}