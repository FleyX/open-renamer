import RuleInterface from "./RuleInterface";
import * as ValUtil from "../../../util/ValUtil";
import FileObj from "../../vo/FileObj";
import {dealFileName} from './RuleInterface';
import path from 'path';


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

    constructor(data: any) {
        this.type = data.type;
        this.source = data.source;
        this.target = data.target;
        this.regFlag = ValUtil.nullToDefault(data.regFlag, false);
        this.regI = ValUtil.nullToDefault(data.regI, false);
        this.ignorePostfix = ValUtil.nullToDefault(data.ignorePostfix, false);
    }


    deal(file: FileObj): void {
        let targetStr = this.ignorePostfix ? file.realName : file.name;
        let res = this.regFlag ? this.dealReg(targetStr) : this.dealNoReg(targetStr);
        dealFileName(file, res, this.ignorePostfix);
    }

    private dealNoReg(targetStr: string): string {
        let start = 0;
        let arr: number[] = [];
        for (let i = 0; i < (this.type == 1 ? 1 : 1000); i++) {
            let one = targetStr.indexOf(this.source, start);
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
        let needDealArr: number[] = this.type === 1 ? [arr[0]] : this.type === 2 ? [arr[arr.length - 1]] : arr;
        let lastIndex = 0;
        for (let i = 0; i < needDealArr.length; i++) {
            res += targetStr.substring(lastIndex, needDealArr[i]) + this.target;
            lastIndex = needDealArr[i] + this.source.length;
        }
        res += targetStr.substring(lastIndex);
        return res;
    }

    private dealReg(targetStr: string): string {
        let templateReg = new RegExp("#\{group(\\d+\)}", "g");
        let templateArr: string[][] = [];
        while (true) {
            let one = templateReg.exec(this.target);
            if (one == null) {
                break;
            }
            templateArr.push([one[0], one[1]]);
        }

        let reg = new RegExp(this.source, this.regI ? "g" : "ig");
        let arr: RegExpExecArray[] = [];
        for (let i = 0; i < (this.type == 1 ? 1 : 1000); i++) {
            let one = reg.exec(targetStr);
            if (one == null) {
                break;
            }
            arr.push(one);
        }
        if (arr.length == 0) {
            return targetStr;
        }
        let res = "";
        let needDealReg: RegExpExecArray[] = this.type === 1 ? [arr[0]] : this.type === 2 ? [arr[arr.length - 1]] : arr;
        let lastIndex = 0;
        for (let i = 0; i < needDealReg.length; i++) {
            let reg = needDealReg[i];
            let target = this.target;
            templateArr.forEach(item => target = target.replace(item[0], ValUtil.nullToDefault(reg[parseInt(item[1])], '')));
            res += targetStr.substring(lastIndex, reg.index) + target;
            lastIndex = reg.index + reg[0].length;
        }
        res += targetStr.substring(lastIndex);
        return res;
    }
}