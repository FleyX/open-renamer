import RuleInterface from "./RuleInterface";
import FileObj from "../FileObj";

export default class InsertRule implements RuleInterface {
	/**
	 * 开始位置
	 */
	start: number;
	/**
	 * 增量
	 */
	increment: number;
	/**
	 * 是否填充0
	 */
	addZero: boolean;
	/**
	 * 填充后长度
	 */
	numLength: number;
	/**
	 * 插入位置,front:前缀，backend：后缀，at：位置
	 */
	insertType: string;
	/**
	 * 插入的位置
	 */
	insertValue: number;
	/**
	 * 忽略拓展名
	 */
	ignorePostfix: boolean;

	constructor(data: any) {
		this.start = data.start;
		this.increment = data.increment;
		this.addZero = data.addZero;
		this.numLength = data.numLength;
		this.insertType = data.insertType;
		this.insertValue = data.insertValue;
		this.ignorePostfix = data.ignorePostfix;
	}

	deal(file: FileObj): string {
		return null;
	}
}