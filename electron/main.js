// main.js
// 控制应用生命周期和创建原生浏览器窗口的模组
const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')
const fs = require('fs');
const {spawn} = require('child_process');
const net = require('net');
const log = require('electron-log');


const userHome = process.env.HOME || process.env.USERPROFILE;
const dataPath = path.join(userHome, "openRenamer");

log.transports.file.resolvePathFn = () => path.join(dataPath, 'logs/main.log');

async function createWindow() {
    // 隐藏菜单栏
    Menu.setApplicationMenu(null)
    // 创建浏览器窗口
    const win = new BrowserWindow({
        //width: 800,   //窗口宽度,单位像素. 默认是 800
        //height: 600,  //窗口高度,单位像素. 默认是 600
        icon: './logo.ico', // 设置窗口左上角的图标
        show: false, //窗口创建的时候是否显示. 默认为 true
        webPreferences: {
            nodeIntegration: true, // 是否完整支持node。默认为 true
            preload: path.join(__dirname, 'preload.js')  //界面的其它脚本运行之前预先加载一个指定脚本。
        }
    });
    //打开调试
    // win.webContents.openDevTools();

    win.loadFile('./index.html');
    let startTime = Date.now();

    // 下面这两行代码配合上面 new BrowserWindow 里面的 show: false，可以实现打开时窗口最大化
    win.maximize()
    win.show()
    log.info(__dirname);
    let port = await startBackend()
    log.info("backend service started")

    let diff = Date.now() - startTime;
    let time = 2000;
    if (diff < time) {
        await sleep(time - diff);
    }
    win.loadURL(`http://localhost:` + port);
    // win.webContents.openDevTools()
}

// Electron会在初始化完成并且准备好创建浏览器窗口时调用这个方法
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(createWindow)
// 当所有窗口都被关闭后退出
app.on('windows-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

/**
 * 启动后台服务
 * @returns {Promise<number>}
 */
async function startBackend() {
    let port = 51000;
    while (true) {
        let ok = await checkPort(port);
        if (ok) {
            break;
        }
        port = port + 1;
    }
    log.info("start check folder exist", __dirname, __filename)
    let exist = fs.existsSync("openRenamerBackend");
    const childProcess = spawn('node', [(exist ? '' : '../') + 'openRenamerBackend/dist/index.js'], {
        env: {
            "PORT": port,
            "DATA_PATH": dataPath
        }
    });

    childProcess.stdout.on('data', (data) => {
        log.info(`stdout: ${data}`);
    });

    childProcess.stderr.on('data', (data) => {
        log.error(`stderr: ${data}`);
    });

    childProcess.on('close', (code) => {
        log.info(`child process exited with code ${code}`);
    });
    log.info("check service start");
    while (true) {
        await sleep(100);
        let success = !(await checkPort(port));
        if (success) {
            log.info("service start");
            break;
        }
    }
    return port;
}

/**
 * 判断端口是否可用
 * @param port
 * @returns {Promise<unknown>}
 */
function checkPort(port) {
    return new Promise((resolve, reject) => {
        let server = net.createServer().listen(port);
        server.on("listening", function () {
            server.close();
            resolve(true);
        })
        server.on("error", function (err) {
            console.error(err);
            resolve(false);
        })
    })
}

function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), time);
    })
}