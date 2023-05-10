import RuleInterface from "./RuleInterface";
import FileObj from "../../vo/FileObj";
import path from 'path';


export default class ReplaceRule implements RuleInterface {

    /**
     * 1:替换第一个，2：替换最后一个，3：全部替换
     */
    type: number;
    /**
     * 前面追加
     */
    source: string;
    /**
     * 后面追加
     */
    target: string;

    constructor(data: any) {
        this.type = data.type;
        this.source = data.source;
        this.target = data.target;
    }


    deal(file: FileObj): void {
        let start = 0;
        let changed = false;
        for (; ;) {
            let index = this.type == 1 || this.type == 3 ? file.name.indexOf(this.source, start) : file.name.lastIndexOf(this.source);
            if (index > -1) {
                file.name = file.name.substring(0, index) + this.target + file.name.substring(index + this.source.length);
                start = index + this.target.length;
                changed = true;
                if (this.type != 3) {
                    break;
                }
            } else {
                break;
            }
        }
        if (changed) {
            file.originName = file.name;
            file.expandName = path.extname(file.name);
            if (file.expandName && file.expandName.length > 0) {
                file.realName = file.name.substring(0, file.name.lastIndexOf("."));
            } else {
                file.realName = file.name;
            }
        }
    }
}