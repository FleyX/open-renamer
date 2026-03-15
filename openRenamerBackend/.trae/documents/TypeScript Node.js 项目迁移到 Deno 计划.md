# TypeScript Node.js 项目迁移到 Deno 计划

## 重点关注：动态路由注册机制迁移

### 当前路由注册机制分析
1. **实现方式**：
   - 使用 `tsc` 编译 TypeScript 到 `dist/` 目录
   - 使用 `fs-extra` 同步遍历 `dist/api` 目录
   - 使用 `require()` 加载编译后的 `.js` 文件
   - 基于 HTTP 方法注册路由
   - 过滤掉以 `Helper.js` 结尾的文件

2. **关键流程**：
   ```
   tsc 编译 → dist/api/*.js → require() 加载 → 注册路由
   ```

### Deno 路由注册方案（直接处理 .ts 文件）

#### 1. 核心改进
- **移除编译步骤**：Deno 直接运行 `.ts` 文件
- **同步 → 异步**：Deno 文件操作和模块导入都是异步的
- **CommonJS → ES 模块**：使用 `import()` 动态导入
- **直接处理源代码**：遍历 `api/` 目录而非 `dist/api/`
- **路径处理**：使用 `import.meta.url` 替代 `__dirname`

#### 2. 具体实现步骤

##### 2.1 修改 `middleware/controllerEngine.ts`
```typescript
// 从同步遍历改为异步遍历
async function addControllers(router, filePath: string) {
  // 使用 Deno.readDir 异步遍历目录
  for await (const entry of Deno.readDir(filePath)) {
    const temp = path.join(filePath, entry.name);
    const state = await Deno.stat(temp);
    
    if (state.isDirectory) {
      await addControllers(router, temp);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('Helper.ts')) {
      log.info(`\n--开始处理: ${entry.name}路由`);
      await addMapping(router, temp);
    }
  }
}

// 从同步 require 改为异步动态导入
async function addMapping(router, filePath: string) {
  // 使用 import() 动态导入 TypeScript 模块
  const mapping = await import(filePath);
  for (const url in mapping.default) {
    // 路由注册逻辑保持不变
    if (url.startsWith('GET ')) {
      let temp = url.substring(4);
      router.get(temp, mapping[url]);
    } else if (url.startsWith('POST ')) {
      let temp = url.substring(5);
      router.post(temp, mapping[url]);
    }
    // ... 其他 HTTP 方法
  }
}

// 引擎函数改为异步
async function engine(router, folder: string) {
  await addControllers(router, folder);
  return router.routes();
}
```

##### 2.2 修改 `index.ts` 中的调用
```typescript
// 1. 替换路径：从 dist/api 改为 api
// 2. 从同步调用改为异步调用
app.use(await RouterMW(router, path.join(config.rootPath, "api")));
```

##### 2.3 调整配置文件 `config.ts`
```typescript
// 使用 import.meta.url 获取当前文件路径
const rootPath = path.dirname(path.fromFileUrl(import.meta.url));

// 移除指向 dist/ 目录的配置
// 直接使用源代码目录
```

### 完整迁移计划

#### 1. 配置文件创建
- 创建 `deno.jsonc`：配置 TypeScript 和依赖映射
- 配置 `imports` 字段：映射常用依赖到 CDN URL

#### 2. 核心依赖替换
| Node.js 依赖 | Deno 替代方案 |
|--------------|---------------|
| koa          | oak@12.6.1    |
| koa-router   | oak/router    |
| koa-body     | oak/body      |
| fs-extra     | Deno.fs       |
| koa-static   | oak/static    |
| sqlite3      | deno-sqlite@3.8.0 |
| log4js       | std/log       |

#### 3. 迁移步骤

##### 3.1 修改入口文件 `index.ts`
- 替换 Koa 为 Oak
- 调整路由注册为异步调用
- 调整路由目录为 `api/` 而非 `dist/api/`
- 替换静态文件服务

##### 3.2 迁移路由引擎 `middleware/controllerEngine.ts`
- 实现异步路由加载
- 使用 `Deno.readDir` 替代 `fs.readdirSync`
- 使用 `import()` 动态导入 `.ts` 文件
- 调整文件过滤条件为 `.ts` 结尾

##### 3.3 迁移配置文件 `config.ts`
- 使用 `import.meta.url` 处理路径
- 移除编译相关配置
- 调整 API 目录路径

##### 3.4 迁移其他中间件和工具类
- 替换所有 Node.js 内置模块调用
- 调整文件操作 API 为 Deno.fs
- 调整日志工具为 Deno 标准库

##### 3.5 修改构建脚本
- 移除 `tsc` 编译步骤
- 添加 `deno run` 启动命令
- 使用 `deno compile` 打包应用
- 调整多平台构建脚本

#### 4. 关键技术点

##### 4.1 异步处理
```typescript
// 原代码（同步）
let files = fs.readdirSync(filePath);
for (let file of files) {
  // 处理文件
}

// 新代码（异步）
for await (const entry of Deno.readDir(filePath)) {
  // 处理文件
}
```

##### 4.2 动态导入
```typescript
// 原代码
const mapping = require(filePath).default;

// 新代码
const mapping = await import(filePath);
```

##### 4.3 路径处理
```typescript
// 原代码
const rootPath = path.resolve(__dirname, '..');

// 新代码
const rootPath = path.dirname(path.fromFileUrl(import.meta.url));
```

##### 4.4 路由注册调用
```typescript
// 原代码（同步）
app.use(RouterMW(router, path.join(config.rootPath, "dist/api")));

// 新代码（异步）
app.use(await RouterMW(router, path.join(config.rootPath, "api")));
```

### 预期成果

1. **简化开发流程**：直接运行 `.ts` 文件，无需编译
2. **保持原有功能**：路由注册机制功能不变
3. **异步化改进**：使用 Deno 异步 API，性能更好
4. **减少依赖**：使用 Deno 内置 API，减少外部包
5. **支持直接打包**：使用 `deno compile` 生成可执行文件

### 关键调整点

| 调整项 | 原实现 | Deno 实现 |
|--------|--------|-----------|
| 路由文件扩展名 | `.js` | `.ts` |
| 路由目录 | `dist/api/` | `api/` |
| 遍历方式 | 同步 `fs.readdirSync` | 异步 `Deno.readDir` |
| 模块加载 | 同步 `require()` | 异步 `import()` |
| 路由注册调用 | 同步 | 异步 `await` |

## 风险评估

1. **异步迁移**：需要确保所有异步操作都正确处理
2. **依赖兼容性**：部分 Node.js 依赖可能需要替代方案
3. **路径处理**：需要仔细调整所有路径相关代码
4. **权限管理**：需要正确配置 Deno 运行权限

## 解决方案

1. **异步处理**：使用 `async/await` 确保异步操作正确执行
2. **依赖兼容**：寻找合适的 Deno 替代品或使用 `npm:` 前缀
3. **路径处理**：统一使用 `import.meta.url` 处理路径
4. **权限管理**：在 `deno.jsonc` 中配置默认权限

### 最终路由注册流程

```
api/*.ts → Deno.readDir 遍历 → import() 动态导入 → 注册路由
```

这个方案完全利用了 Deno 直接运行 TypeScript 的特性，简化了开发流程，同时保持了原有路由注册机制的功能完整性。