import RuleInterface from "./RuleInterface";
import FileObj from "../../vo/FileObj";
import path from 'path';
import {getSeason} from "../../../util/MediaUtil";


export default class InsertRule implements RuleInterface {

    /**
     * 插入内容
     */
    insertContent: string;
    /**
     * 操作类别，front：前缀，backend：后缀，at:位置，replace:替换当前文件名
     */
    type: string;
    /**
     * 当type为at,时的位置,从1开始
     */
    atInput: number;
    /**
     * 当type为at,时的方向，true:从右到左，false:从左到右
     */
    atIsRightToleft: boolean;
    /**
     * 忽略拓展名，true:忽略，false：不忽略
     */
    ignorePostfix: boolean;
    /**
     自动识别季号
     */
    autoSeason: boolean;
    /**
     后缀过滤是否开启
     */
    endFilter: boolean;
    /**
     有效后缀
     */
    validEnd: Array<String>;

    constructor(data: any) {
        this.insertContent = data.insertContent;
        this.type = data.type;
        this.atInput = data.atInput;
        this.atIsRightToleft = data.atIsRightToleft;
        this.ignorePostfix = data.ignorePostfix;
        this.autoSeason = data.autoSeason;
        this.endFilter = data.endFilter;
        this.validEnd = data.validEnd;
    }


    deal(file: FileObj): void {
        if (this.endFilter && file.expandName.length > 0 && this.validEnd.indexOf(file.expandName.substring(1)) == -1) {
            //拓展名不符，跳过
            return;
        }
        let str = this.ignorePostfix ? file.realName : file.name;
        let season = '';

        if (this.autoSeason) {
            season = getSeason(path.basename(file.path));
        }
        switch (this.type) {
            case "front":
                str = this.insertContent + season + str;
                break;
            case "backend":
                str = str + this.insertContent + season;
                break;
            case "at":
                let index = this.atIsRightToleft ? str.length - this.atInput + 1 : this.atInput - 1;
                str = str.substring(0, index) + this.insertContent + season + str.substring(index);
                break;
            case "replace":
                str = this.insertContent + season;
                break;
        }


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