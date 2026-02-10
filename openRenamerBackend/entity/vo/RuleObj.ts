import RuleInterface from "../bo/rules/RuleInterface.ts";
import DeleteRule from "../bo/rules/DeleteRule.ts";
import InsertRule from "../bo/rules/InsertRule.ts";
import SerializationRule from "../bo/rules/SerializationRule.ts";
import AutoRule from "../bo/rules/AutoRule.ts";
import ReplaceRule from "../bo/rules/ReplaceRule.ts";
import TranslateRole from "../bo/rules/TranslateRole.ts";

export default class RuleObj {
    type: string;
    message: string;
    data: RuleInterface;

    constructor(data: Record<string, unknown>) {
        this.type = data.type as string;
        this.message = data.message as string;
        switch (this.type) {
            case "delete":
                this.data = new DeleteRule(data.data as Parameters<typeof DeleteRule.prototype.constructor>[0]);
                break;
            case "insert":
                this.data = new InsertRule(data.data as Parameters<typeof InsertRule.prototype.constructor>[0]);
                break;
            case "serialization":
                this.data = new SerializationRule(data.data as Parameters<typeof SerializationRule.prototype.constructor>[0]);
                break;
            case "auto":
                this.data = new AutoRule(data.data as Parameters<typeof AutoRule.prototype.constructor>[0]);
                break;
            case "replace":
                this.data = new ReplaceRule(data.data as Parameters<typeof ReplaceRule.prototype.constructor>[0]);
                break;
            case "translate":
                this.data = new TranslateRole(data.data as Parameters<typeof TranslateRole.prototype.constructor>[0]);
                break;
            default:
                throw new Error("不支持的规则:" + this.type);
        }
    }
}
