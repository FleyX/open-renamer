import * as path from 'path';

//后台所在绝对路径
const rootPath = path.resolve(__dirname, '..');

let config = {
    rootPath,
    port: process.env.PORT ? parseInt(process.env.PORT) : 8089,
    token: process.env.TOKEN ? process.env.TOKEN : null,
    urlPrefix: '/openRenamer/api',
    //是否为windows平台
    isWindows: process.platform.toLocaleLowerCase().includes("win"),
    bodyLimit: {
        formLimit: '200mb',
        jsonLimit: '200mb',
        urlencoded: true,
        multipart: true,
        formidable: {
            uploadDir: path.join(rootPath, 'files', 'temp', 'uploads'),
            keepExtenstions: true,
            maxFieldsSize: 1024 * 1024 * 200
        }
    },
    publicPath: new Set(["POST/public/checkToken"])
};

export default config;
