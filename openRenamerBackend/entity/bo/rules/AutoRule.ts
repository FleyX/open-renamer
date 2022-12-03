import RuleInterface from "./RuleInterface";
import FileObj from "../../vo/FileObj";
import path from 'path';


let pattern = new RegExp(/s(eason)?(\d+)/);
let eNumPatternArr = [new RegExp(/e(\d+)/), new RegExp(/\((\d+)\)/), new RegExp(/（(\d+)）/), new RegExp(/\.(\d+)\./), new RegExp(/-(\d+)-/), new RegExp(/(\d+)/)];
let resolutionPattern = new RegExp(/(\d+[pP])/);
let resolutionArr = ['1k', '1K', '2k', '2K', '4k', '4K', '8k', '8K'];
let charSet = new Set([' ', '[', '.', '(', '（']);
export default class InsertRule implements RuleInterface {

	/**
	 * 识别类型，season：季号，name：剧名/电影名识别
	 */
	type: string;
	/**
	 * 前面追加
	 */
	frontAdd: string;
	/**
	 * 后面追加
	 */
	endAdd: string;
	eNumWidth: number;

	constructor(data: any) {
		this.type = data.type;
		this.frontAdd = data.frontAdd;
		this.endAdd = data.endAdd;
	}


	deal(file: FileObj): void {
		//识别到的内容
		let getStr = null;
		let patternRes = path.basename(file.path).replace(/[ ]+/, "").toLocaleLowerCase().match(pattern);
		if (this.type === 'season') {
			if (patternRes && patternRes[2]) {
				getStr = patternRes[2];
			}
		} else if (this.type === 'name') {
			let originName = null;
			if (patternRes && patternRes[2]) {
				//说明是剧集,取父文件夹的父文件夹名称
				originName = path.basename(path.resolve(file.path, '..'));
			} else {
				//说明是电影
				originName = path.basename(file.path);
			}
			getStr = '';
			for (let i = 0; i < originName.length; i++) {
				let char = originName.charAt(i);
				if (charSet.has(char)) {
					break;
				}
				getStr += char;
			}
		} else if (this.type === 'eNum') {
			let lowName = file.originName.toLocaleLowerCase().replace(/ /g, '');
			for (let i in eNumPatternArr) {
				let patternRes = lowName.match(eNumPatternArr[i]);
				if (patternRes && patternRes.length > 1) {
					getStr = patternRes[1];
					for (let i = 0; i < this.eNumWidth - getStr.length; i++) {
						getStr = '0' + getStr;
					}
					break;
				}
			}
		} else if (this.type === 'resolution') {
			let res = file.originName.match(resolutionPattern);
			if (res && res.length > 1) {
				getStr = res[1];
			} else {
				for (let i = 0; i < resolutionArr.length; i++) {
					if (file.originName.indexOf(resolutionArr[i]) > -1) {
						getStr = resolutionArr[i];
						break;
					}
				}
			}
		}
		if (getStr && getStr.length > 0) {
			file.realName = file.realName + this.frontAdd + getStr + this.endAdd;
			file.name = file.realName + file.expandName;
		}
	}
}