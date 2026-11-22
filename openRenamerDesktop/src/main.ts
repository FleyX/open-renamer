import { randomBytes } from "node:crypto";
import path from "node:path";
import {
  app,
  BrowserWindow,
  dialog,
  session,
  shell,
  type Session,
} from "electron";
import { startNodeServer, type RunningNodeServer } from "./node-server.js";

const SESSION_PARTITION = "persist:open-renamer";
const API_PREFIX = "/openRenamer/api";

let mainWindow: BrowserWindow | null = null;
let startingServer: Promise<RunningNodeServer> | null = null;
let cleanupComplete = false;
let fatalHandled = false;
let quitRequested = false;
let shuttingDown: Promise<void> | null = null;

function focusMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

function isLocalUrl(url: string, origin: string): boolean {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function openExternalUrl(url: string): void {
  if (!isHttpsUrl(url)) {
    return;
  }
  void shell.openExternal(url).catch((error: unknown) => {
    console.error("无法在系统浏览器中打开链接", error);
  });
}

function configureApiToken(
  browserSession: Session,
  webContentsId: number,
  origin: string,
  token: string,
): void {
  browserSession.webRequest.onBeforeSendHeaders(
    { urls: [`${origin}${API_PREFIX}/*`] },
    (details, callback) => {
      const requestUrl = new URL(details.url);
      if (
        details.webContentsId !== webContentsId ||
        requestUrl.origin !== origin ||
        !requestUrl.pathname.startsWith(`${API_PREFIX}/`)
      ) {
        callback({ requestHeaders: details.requestHeaders });
        return;
      }
      callback({
        requestHeaders: {
          ...details.requestHeaders,
          token,
        },
      });
    },
  );
}

function configureWindowNavigation(window: BrowserWindow, origin: string): void {
  window.webContents.on("will-navigate", (event, url) => {
    if (isLocalUrl(url, origin)) {
      return;
    }
    event.preventDefault();
    openExternalUrl(url);
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!isLocalUrl(url, origin)) {
      openExternalUrl(url);
    }
    return { action: "deny" };
  });

  window.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });
}

async function closeBackend(): Promise<void> {
  const server = await startingServer?.catch(() => null);
  try {
    await server?.close();
  } catch (error) {
    console.error("关闭本地后端失败", error);
  }
}

function cleanupBeforeQuit(): Promise<void> {
  shuttingDown ??= closeBackend().finally(() => {
    cleanupComplete = true;
  });
  return shuttingDown;
}

async function handleFatalError(error: unknown): Promise<void> {
  if (fatalHandled || quitRequested) {
    return;
  }
  fatalHandled = true;
  const message = error instanceof Error ? error.message : String(error);
  console.error("Open Renamer 桌面客户端启动失败", error);
  try {
    dialog.showErrorBox("Open Renamer", message);
  } catch {
    // Dialog is unavailable when Electron is not ready.
  }
  mainWindow?.destroy();
  mainWindow = null;
  await cleanupBeforeQuit();
  app.exit(1);
}

async function startDesktopClient(): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  startingServer = startNodeServer({
    host: "127.0.0.1",
    port: 0,
    dataPath: path.join(app.getPath("userData"), "data"),
    resourceRootPath: app.getAppPath(),
    token,
  });
  const runningServer = await startingServer;
  if (quitRequested) {
    return;
  }
  console.info(`Open Renamer 本地后端已启动: ${runningServer.url}`);

  const browserSession = session.fromPartition(SESSION_PARTITION);
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: "Open Renamer",
    webPreferences: {
      partition: SESSION_PARTITION,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  configureApiToken(browserSession, mainWindow.webContents.id, runningServer.url, token);
  configureWindowNavigation(mainWindow, runningServer.url);
  mainWindow.once("ready-to-show", () => focusMainWindow());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
      if (!quitRequested && isMainFrame && errorCode !== -3) {
        void handleFatalError(
          new Error(
            `页面加载失败 (${errorCode}): ${errorDescription} ${validatedUrl}`,
          ),
        );
      }
    },
  );
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    if (!quitRequested) {
      void handleFatalError(new Error(`渲染进程异常退出: ${details.reason}`));
    }
  });

  await mainWindow.loadURL(runningServer.url);
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => focusMainWindow());
  app.on("before-quit", (event) => {
    quitRequested = true;
    if (cleanupComplete) {
      return;
    }
    event.preventDefault();
    void cleanupBeforeQuit().finally(() => app.quit());
  });
  app.on("window-all-closed", () => app.quit());
  app.on("activate", () => focusMainWindow());
  app.whenReady()
    .then(startDesktopClient)
    .catch((error: unknown) => void handleFatalError(error));
}
