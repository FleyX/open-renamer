import RuleInterface from "../bo/rules/RuleInterface.ts";
import DeleteRule from "../bo/rules/DeleteRule.ts";
import type { DeleteRuleData } from "../bo/rules/DeleteRule.ts";
import InsertRule from "../bo/rules/InsertRule.ts";
import type { InsertRuleData } from "../bo/rules/InsertRule.ts";
import SerializationRule from "../bo/rules/SerializationRule.ts";
import type { SerializationRuleData } from "../bo/rules/SerializationRule.ts";
import AutoRule from "../bo/rules/AutoRule.ts";
import type { AutoRuleData } from "../bo/rules/AutoRule.ts";
import ReplaceRule from "../bo/rules/ReplaceRule.ts";
import type { ReplaceRuleData } from "../bo/rules/ReplaceRule.ts";
import TranslateRole from "../bo/rules/TranslateRole.ts";
import type { TranslateRoleData } from "../bo/rules/TranslateRole.ts";

export default class RuleObj {
    type: string;
    message: string;
    data: RuleInterface;

    constructor(data: Record<string, unknown>) {
        this.type = data.type as string;
        this.message = data.message as string;
        switch (this.type) {
            case "delete":
                this.data = new DeleteRule(data.data as DeleteRuleData);
                break;
            case "insert":
                this.data = new InsertRule(data.data as InsertRuleData);
                break;
            case "serialization":
                this.data = new SerializationRule(data.data as SerializationRuleData);
                break;
            case "auto":
                this.data = new AutoRule(data.data as AutoRuleData);
                break;
            case "replace":
                this.data = new ReplaceRule(data.data as ReplaceRuleData);
                break;
            case "translate":
                this.data = new TranslateRole(data.data as TranslateRoleData);
                break;
            default:
                throw new Error("不支持的规则:" + this.type);
        }
    }
}
