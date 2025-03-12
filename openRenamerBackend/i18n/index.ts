import YAML from 'yaml';
import fs from 'fs-extra';
import path from 'path'
import config from '../config'
import logger from '../util/LogUtil';

const map = {};

export function init() {
    let i18nFolder = path.join(config.rootPath, 'i18n');
    let files = fs.readdirSync(i18nFolder).filter(item => item.endsWith(".yaml"));
    files.forEach(file => {
        let res = YAML.parse(fs.readFileSync(path.join(i18nFolder, file), 'utf-8'));
        dealYaml("", res);
    })
    logger.info("i18n加载完毕");
}

export function getMessage(lang: string, key: string): string {
    let val = map[key + "." + (lang ? lang : 'en')];
    return val ? val : key;
}

function dealYaml(pre: string, res: any) {
    Object.keys(res).forEach(key => {
        let val = res[key];
        let mapKey = pre == '' ? key : (pre + "." + key);
        if (typeof val != "object") {
            map[mapKey] = val;
        } else {
            dealYaml(mapKey, val);
        }
    })
}