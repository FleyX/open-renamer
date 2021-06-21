import * as path from 'path';

//后台所在绝对路径
const rootPath = path.resolve(__dirname, '..');

let config = {
  rootPath,
  port: process.env.PORT ? parseInt(process.env.PORT) : 8089,
  urlPrefix: '/backup/api',
  //是否为windows平台
  isWindows: process.platform.toLocaleLowerCase().includes("win"),
  //需要监控的磁盘列表
  disKCheckList: ["/dev/nvme0n1", "/dev/nvme1n1"],
  mysqlConfig: {
    host: process.env.MYSQL_HOST || "localhost",
    database: "nas_backup",
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASS || "123456",
    supportBigNumbers: true,
    multipleStatements: false
  },
  bodyLimit: {
    formLimit: '2mb',
    urlencoded: true,
    multipart: true,
    formidable: {
      uploadDir: path.join(rootPath, 'files', 'temp', 'uploads'),
      keepExtenstions: true,
      maxFieldsSize: 1024 * 1024
    }
  }
};

export default config;
