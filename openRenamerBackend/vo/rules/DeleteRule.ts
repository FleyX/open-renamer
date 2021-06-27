import RuleInterface from "./RuleInterface";
import FileObj from "../FileObj";

export default class DeleteRule implements RuleInterface {
	/**
	 * 类别：deletePart:部分删除，deleteAll:全部删除
	 */
	type: string;
	/**
	 * 部分删除时的开始信息
	 */
	start: DeleteRuleItem;
	/**
	 * 部分删除时的结束信息

	 */
	end: DeleteRuleItem;
	/**
	 * 忽略拓展名，true:忽略，false：不忽略
	 */
	ignorePostfix: boolean;

	constructor(data: any) {
		this.type = data.type;
		this.start = new DeleteRuleItem(data.start);
		this.end = new DeleteRuleItem(data.end);
		this.ignorePostfix = data.ignorePostfix;
	}



	deal(file: FileObj): string {
		return null;
	}

}

class DeleteRuleItem {
	/**
	 * location:位置，text:文本，end:直到末尾
	 */
	type: string;
	/**
	 * 对应的值
	 */
	value: string;

	constructor(data: any) {
		this.type = data.type;
		this.value = data.value;
	}
}
