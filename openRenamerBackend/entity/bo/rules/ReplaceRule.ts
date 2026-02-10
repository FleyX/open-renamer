import RuleInterface from "./RuleInterface.ts";
import * as ValUtil from "../../../util/ValUtil.ts";
import FileObj from "../../vo/FileObj.ts";
import {dealFileName} from './RuleInterface.ts';

interface ReplaceRuleData {
    type: number;
    source: string;
    target: string;
    regFlag?: boolean;
    regI?: boolean;
    ignorePostfix?: boolean;
}


export default class ReplaceRule implements RuleInterface {

    /**
     * 1:替换第一个，2：替换最后一个，3：全部替换
     */
    type: number;
    /**
     * 源
     */
    source: string;
    /**
     * 目标
     */
    target: string;
    /**
     * 是否正则模式
     */
    regFlag: boolean;
    /**
     * 是否区分大小写
     */
    regI: boolean;
    /**
     * 是否护理拓展名
     */
    ignorePostfix: boolean;

    constructor(data: ReplaceRuleData) {
        this.type = data.type;
        this.source = data.source;
        this.target = data.target;
        this.regFlag = ValUtil.nullToDefault(data.regFlag, false);
        this.regI = ValUtil.nullToDefault(data.regI, false);
        this.ignorePostfix = ValUtil.nullToDefault(data.ignorePostfix, false);
    }


    deal(file: FileObj): void {
        const targetStr = this.ignorePostfix ? file.realName : file.name;
        const res = this.regFlag ? this.dealReg(targetStr) : this.dealNoReg(targetStr);
        dealFileName(file, res, this.ignorePostfix);
    }

    private dealNoReg(targetStr: string): string {
        let start = 0;
        const arr: number[] = [];
        for (let i = 0; i < (this.type == 1 ? 1 : 1000); i++) {
            const one = targetStr.indexOf(this.source, start);
            if (one == -1) {
                break;
            }
            arr.push(one);
            start = one + this.source.length;
        }
        if (arr.length == 0) {
            return targetStr;
        }
        let res = "";
        const needDealArr: number[] = this.type === 1 ? [arr[0]] : this.type === 2 ? [arr[arr.length - 1]] : arr;
        let lastIndex = 0;
        for (let i = 0; i < needDealArr.length; i++) {
            res += targetStr.substring(lastIndex, needDealArr[i]) + this.target;
            lastIndex = needDealArr[i] + this.source.length;
        }
        res += targetStr.substring(lastIndex);
        return res;
    }

    private dealReg(targetStr: string): string {
        const templateReg = new RegExp("#\\{group(\\d+)\\}", "g");
        const templateArr: string[][] = [];
        while (true) {
            const one = templateReg.exec(this.target);
            if (one == null) {
                break;
            }
            templateArr.push([one[0], one[1]]);
        }

        const reg = new RegExp(this.source, this.regI ? "g" : "ig");
        const arr: RegExpExecArray[] = [];
        for (let i = 0; i < (this.type == 1 ? 1 : 1000); i++) {
            const one = reg.exec(targetStr);
            if (one == null) {
                break;
            }
            arr.push(one);
        }
        if (arr.length == 0) {
            return targetStr;
        }
        let res = "";
        const needDealReg: RegExpExecArray[] = this.type === 1 ? [arr[0]] : this.type === 2 ? [arr[arr.length - 1]] : arr;
        let lastIndex = 0;
        for (let i = 0; i < needDealReg.length; i++) {
            const regMatch = needDealReg[i];
            let target = this.target;
            templateArr.forEach(item => target = target.replace(item[0], ValUtil.nullToDefault(regMatch[parseInt(item[1])], '')));
            res += targetStr.substring(lastIndex, regMatch.index) + target;
            lastIndex = regMatch.index + regMatch[0].length;
        }
        res += targetStr.substring(lastIndex);
        return res;
    }
}