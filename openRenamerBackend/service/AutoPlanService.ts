import * as path from 'std/path/mod.ts';

import AutoPlanConfigDto from '../entity/dto/AutoPlanConfigDto.ts';
import GlobalConfig from '../entity/po/GlobalConfig.ts';
import GlobalConfigService from './GlobalConfigService.ts';
import ErrorHelper from '../util/ErrorHelper.ts';
import TimeUtil from '../util/TimeUtil.ts';
import { isSub, isVideo } from '../util/MediaUtil.ts';
import * as log from 'std/log/mod.ts';

const autoConfigCode = "autoConfig";
let isReadDir = false;
/** 需要处理的文件 */
const needDeal: string[] = [];
/** 自动化配置 */
let autoConfig: AutoPlanConfigDto | null = null;


class AutoPlanService {

	static async init() {
		const str = await GlobalConfigService.getVal(autoConfigCode);
		if (str != null) {
			autoConfig = JSON.parse(str);
		}
		setTimeout(async () => {
			while (true) {
				try {
					await TimeUtil.sleep(1000);
					await work();
				} catch (err) {
					console.log(err);
				}
			}
		}, 1000);
	}

	/**
	 * 保存配置
	 */
	static async saveAutoConfig(body: AutoPlanConfigDto): Promise<void> {
		if (isReadDir) {
			throw ErrorHelper.Error400("正在处理中，请稍后再试");
		}
		if (body.start) {
			if (body.paths.length == 0) {
				throw ErrorHelper.Error400("视频路径为空");
			}
			if (body.rules.length == 0) {
				throw ErrorHelper.Error400("规则为空");
			}
		}
		const configBody: GlobalConfig = {
			code: autoConfigCode,
			val: JSON.stringify(body),
			description: "自动化计划配置"
		};
		await GlobalConfigService.insertOrReplace(configBody);
		autoConfig = body;
		if (body.start && !body.ignoreExist) {
			setTimeout(async () => {
				isReadDir = true;
				try {
					await readDir(body.paths);
				} finally {
					isReadDir = false;
				}
			}, 1);
		}
	}
}

/**
 * 读取目录，获取文件列表
 * @param dirList 要读取的目录
 */
async function readDir(dirList: Array<string>): Promise<void> {
	if (!dirList) {
		return;
	}
	for (const pathStr of dirList) {
		if (checkIgnore(path.basename(pathStr))) {
			continue;
		}
		const stat = await Deno.stat(pathStr);
		if (!stat.isDirectory) {
			const fileName = path.basename(pathStr);
			const strs = fileName.split('.').reverse();
			if (strs.length > 0 && (isSub(strs[0]) || isVideo(strs[1]))) {
				needDeal.push(pathStr);
			}
			continue;
		}
		let childs: string[] | null = null;
		try {
			childs = [];
			for await (const entry of Deno.readDir(pathStr)) {
				childs.push(entry.name);
			}
		} catch (error) {
			console.warn("读取报错:{}", error);
		}
		if (childs != null) {
			await readDir(childs.map(item => path.join(pathStr, item)));
		}
	}
}

/**
 * 检查文件名是否被忽略的
 */
function checkIgnore(str: string): boolean {
	if (!autoConfig) return false;
	for (const pattern of autoConfig.ignorePaths) {
		if (str.match(pattern)) {
			return true;
		}
	}
	return false;
}

/**
 * 开始处理
 */
async function work() {
	if (autoConfig == null || !autoConfig.start) {
		return;
	}
	while (needDeal.length > 0) {
		const file = needDeal.pop();
		try {
			await dealOnePath(file!);
		} catch (error) {
			log.error("处理文件报错:{}", file);
			console.error(error);
		}
	}
}

/**
 * 处理一个文件路径
 * @param filePath 路径
 */
async function dealOnePath(filePath: string) {
	try {
		await Deno.stat(filePath);
	} catch {
		return;
	}
	if (!autoConfig) return;
	let basePath: string | null = null;
	for (const p of autoConfig.paths) {
		if (filePath.startsWith(p)) {
			basePath = p;
			break;
		}
	}
	if (basePath == null) {
		log.warning("无法识别的文件:{}", filePath);
		return;
	}
	const _relativePath = filePath.replace(basePath, "");
	const _pathArrs = _relativePath.split(path.sep).filter(item => item.length > 0);
	// TODO: 待实现具体处理逻辑
}

export default AutoPlanService;
