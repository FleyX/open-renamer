import RuleInterface from "./RuleInterface";
import FileObj from "../../vo/FileObj";
import path from 'path';

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
    regI: boolean;

    constructor(data: any) {
        this.type = data.type;
        this.regI = data.regI != undefined && data.regI;
        this.start = new DeleteRuleItem(data.start, this.regI);
        this.end = new DeleteRuleItem(data.end, this.regI);
        this.ignorePostfix = data.ignorePostfix;
    }


    deal(file: FileObj): void {
        if (this.type === 'deleteAll') {
            file.realName = "";
            if (!this.ignorePostfix) {
                file.expandName = "";
            }
        } else {
            let str = file.realName + (this.ignorePostfix ? "" : file.expandName);
            let startIndex = this.start.calIndex(str, false);
            let endIndex = this.end.calIndex(str, true);
            if (startIndex < 0 || endIndex < 0 || startIndex > endIndex) {
                return;
            }
            str = str.substring(0, startIndex) + str.substring(endIndex + 1);
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
        }

        file.name = file.realName + file.expandName;
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
    /**
     * 正则对象
     */
    reg: RegExp;

    constructor(data: any, regI: boolean) {
        this.type = data.type;
        this.value = data.value;
        if (this.type === 'reg') {
            this.reg = regI ? new RegExp(this.value) : new RegExp(this.value, 'i');
        }
    }

    /**
     * 计算位置
     * @param str 字符串
     * @param end 是否末尾计算
     */
    calIndex(str: string, end: boolean): number {
        if (this.type === 'location') {
            let val = parseInt(this.value);
            return val > 0 ? val - 1 : str.length + val;
        } else if (this.type === 'text') {
            return str.indexOf(this.value);
        } else if (this.type === 'end') {
            return str.length - 1;
        } else if (this.type === 'reg') {
            let res = this.reg.exec(str);
            return res == null ? -1 : (res.index + (end ? 0 : res[0].length));
        }
        return -1;
    }
}
