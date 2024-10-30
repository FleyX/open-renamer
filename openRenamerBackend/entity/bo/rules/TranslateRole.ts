import RuleInterface from "./RuleInterface";
import FileObj from "../../vo/FileObj";
import * as TranslateUtil from "../../../util/TranslateUtil";
import path from 'path';


export default class TranslateRole implements RuleInterface {

    /**
     * 1:简体转繁体 2：繁体转简体
     */
    type: number;
    /**
     *  0、繁体中文，1、港澳繁体，2、台湾正体
     */
    traditionalType: number;

    constructor(data: any) {
        this.type = data.type;
        this.traditionalType = data.traditionalType;
    }


    deal(file: FileObj): void {
        if (this.type == 1) {
            file.realName = TranslateUtil.toTraditionalChinese(file.realName, this.traditionalType);
        } else if (this.type == 2) {
            file.realName = TranslateUtil.toSimplifiedChinese(file.realName, this.traditionalType);
        }
        file.name = file.realName + file.expandName;
    }
}