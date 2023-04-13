const path = require("path")
const videoSet = new Set(["flv", 'avi', 'wmv', 'dat', 'vob', 'mpg', 'mpeg', 'mp4', '3gp', '3g2', 'mkv', 'rm', 'rmvb', 'mov', 'qt', 'ogg', 'ogv', 'oga', 'mod']);

/**
 * 判断文件后缀是否为视频类型
 * @param str 文件后缀
 */
export function isVideo(str: string) {
    if (!str) {
        return false;
    }
    return videoSet.has(str.toLowerCase());
}

const subSet = new Set(['sub', 'sst', 'son', 'srt', 'ssa', 'ass', 'smi', 'psb', 'pjs', 'stl', 'tts', 'vsf', 'zeg']);

/**
 * 判断文件是否为字幕文件
 * @param str 文件后缀
 */
export function isSub(str: string) {
    if (!str) {
        return false;
    }
    return subSet.has(str.toLowerCase());
}

/**
 * 判断文件是否为字幕文件
 * @param str 文件后缀
 */
export function isNfo(str: string) {
    if (!str) {
        return false;
    }
    return "nfo" == str;
}

let pattern1 = new RegExp(/s(eason)?\.?(\d+)/);
let pattern2 = new RegExp(/(\d+)/);
let pattern3 = new RegExp(/([一二三四五六七八九十]+)/);
let chineseNumMap = {
    "一": "1",
    "二": "2",
    "三": "3",
    "四": "4",
    "五": "5",
    "六": "6",
    "七": "7",
    "八": "8",
    "九": "9",
    "十": "1"

}

/**
 * 识别季号
 * @param name
 */
export function getSeason(name: string): string {
    name = name.replace(/[ ]+/, "").toLocaleLowerCase();
    let patternRes = name.match(pattern1);
    if (patternRes && patternRes[2]) {
        return patternRes[2];
    }
    patternRes = name.match(pattern2);
    if (patternRes && patternRes[1]) {
        return patternRes[1];
    }
    //中文支持
    patternRes = name.match(pattern3);
    if (patternRes && patternRes[1]) {
        let str = patternRes[1];
        let strs = str.split("");
        if (strs.length == 1) {
            return str == '十' ? "10" : chineseNumMap[str];
        } else if (strs.length == 2) {
            return strs[0] == '十' ? ("1" + chineseNumMap[strs[1]]) : chineseNumMap[strs[0]] + "0";
        } else if (strs.length == 3) {
            return chineseNumMap[strs[0]] + chineseNumMap[strs[2]];
        }
    }
    return "";
}