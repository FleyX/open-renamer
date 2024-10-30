import DeleteRule from "../bo/rules/DeleteRule";
import InsertRule from "../bo/rules/InsertRule";
import SerializationRule from "../bo/rules/SerializationRule";
import AutoRule from "../bo/rules/AutoRule";
import ReplaceRule from "../bo/rules/ReplaceRule";
import TranslateRole from "../bo/rules/TranslateRole";

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
            case "serialization":
                this.data = new SerializationRule(data.data);
                break;
            case "auto":
                this.data = new AutoRule(data.data);
                break;
            case "replace":
                this.data = new ReplaceRule(data.data);
                break;
            case "translate":
                this.data = new TranslateRole(data.data);
                break;
            default:
                throw new Error("不支持的规则:" + this.type);
        }
    }
}