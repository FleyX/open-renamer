import RuleInterface from "./RuleInterface";
import FileObj from "../FileObj";
import path from 'path';

export default class InsertRule implements RuleInterface {
	/**
	 * 开始位置
	 */
	start: number;
	/**
	 * 记录当前的值是多少
	 */
	currentIndex: number;
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
		this.currentIndex = data.start;
		this.increment = data.increment;
		this.addZero = data.addZero;
		this.numLength = data.numLength;
		this.insertType = data.insertType;
		this.insertValue = data.insertValue;
		this.ignorePostfix = data.ignorePostfix;
	}

	deal(file: FileObj): void {
		let length = this.currentIndex.toString().length;
		let numStr = (this.addZero && this.numLength > length ? "0".repeat(this.numLength - length) : "") + this.currentIndex;
		let str = this.ignorePostfix ? file.realName : file.name;
		switch (this.insertType) {
			case "front":
				str = numStr + str;
				break;
			case "backend":
				str = str + numStr;
				break;
			case "at":
				str = str.substring(0, this.insertValue - 1) + numStr + str.substring(this.insertValue - 1);
				break;
		}
		this.currentIndex += this.increment;

		if (this.ignorePostfix) {
			file.realName = str;
		} else {
			file.expandName = path.extname(str);
			if (file.expandName.length > 0) {
				file.realName = str.substring(0, str.lastIndexOf("."));
			} else {
				file.realName = str;
			}
		}

		file.name = file.realName + file.expandName;
	}
}