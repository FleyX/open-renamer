import DeleteRule from "./rules/DeleteRule";
import InsertRule from "./rules/InsertRule";
import SerializationRule from "./rules/SerializationRule";

export default class RuleObj {
	type: string;
	message: string;
	/**
	 * 具体参数
	 */
	data: any;

	constructor(data: any) {
		this.type = data.type;
		this.message = data.message;
		switch (this.type) {
			case "delete":
				this.data = new DeleteRule(data.data);
				break;
			case "insert":
				this.data = new InsertRule(data.data);
				break;
			default:
				this.data = new SerializationRule(data.data);
		}
	}
}