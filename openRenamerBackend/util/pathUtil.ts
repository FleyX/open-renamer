import path, { dirname } from 'path'

class pathUtil {
    static getPath(pathStr) {
        return path.resolve(pathUtil.getRootPath(), pathStr);
    }

    static getRootPath() {
        return path.resolve(__dirname, '..');
    }
}


export default pathUtil