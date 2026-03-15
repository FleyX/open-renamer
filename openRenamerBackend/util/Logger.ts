import * as log from 'std/log/mod.ts';

// 初始化日志配置
log.setup({
    handlers: {
        console: new log.handlers.ConsoleHandler("DEBUG", {
            formatter: (logRecord) => {
                const timestamp = new Date(logRecord.datetime).toISOString().slice(0, 23).replace('T', ' ');
                return `[${timestamp}] [${logRecord.levelName}] ${logRecord.msg}`;
            },
        }),
    },
    loggers: {
        default: {
            level: "DEBUG",
            handlers: ["console"],
        },
    },
});

class LoggerWrapper {
    private static getFileAndLine(): { file: string; line: number } {
        const stack = new Error().stack;
        if (stack) {
            // 解析调用栈，找到调用日志函数的文件和行号
            const lines = stack.split('\n');
            // 跳过前几行（Error构造和当前函数），找到实际调用者
            for (let i = 3; i < lines.length; i++) {
                const match = lines[i].match(/at\s+(?:\w+\s+)?\(?(.+?):(\d+):\d+\)?$/);
                if (match) {
                    const filePath = match[1];
                    const lineNumber = parseInt(match[2]);
                    // 排除日志相关的内部文件
                    if (!filePath.includes('Logger.ts') && !filePath.includes('log/mod.ts')) {
                        const fileName = filePath.split('/').pop() || 'unknown';
                        return { file: fileName, line: lineNumber };
                    }
                }
            }
        }
        return { file: 'unknown', line: 0 };
    }

    static info(message: string, ...args: unknown[]) {
        const { file, line } = this.getFileAndLine();
        const formattedMsg = this.formatMessage(message, args);
        log.info(`[${file}:${line}] ${formattedMsg}`);
    }

    static error(message: string, ...args: unknown[]) {
        const { file, line } = this.getFileAndLine();
        const formattedMsg = this.formatMessage(message, args);
        log.error(`[${file}:${line}] ${formattedMsg}`);
    }

    static debug(message: string, ...args: unknown[]) {
        const { file, line } = this.getFileAndLine();
        const formattedMsg = this.formatMessage(message, args);
        log.debug(`[${file}:${line}] ${formattedMsg}`);
    }

    static warning(message: string, ...args: unknown[]) {
        const { file, line } = this.getFileAndLine();
        const formattedMsg = this.formatMessage(message, args);
        log.warning(`[${file}:${line}] ${formattedMsg}`);
    }

    private static formatMessage(message: string, args: unknown[]): string {
        if (args.length === 0) {
            return message;
        }
        // 支持类似 console.log 的格式化
        return message.replace(/{}/g, () => {
            const arg = args.shift();
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        }) + (args.length > 0 ? ' ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') : '');
    }
}

export default LoggerWrapper;
