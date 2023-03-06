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