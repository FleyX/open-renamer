#!/bin/bash

# 检测是否为中国服务器
is_china_server() {
    # 尝试ping国内服务器
    if ping -c 1 -W 2 www.baidu.com > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# 配置Deno镜像加速
configure_deno_mirror() {
    if is_china_server; then
        echo "检测到中国服务器，配置Deno镜像加速..."
        export DENO_DIR="$HOME/.deno"
        export DENO_INSTALL_ROOT="$HOME/.deno"
        # 配置Deno镜像
        export DENO_MIRROR="https://cdn.npmmirror.com/binaries/deno/"
        export DENO_PKG_MIRROR="https://cdn.npmmirror.com/packages/"
        export NPM_CONFIG_REGISTRY="https://registry.npmmirror.com"
        echo "Deno镜像加速已配置"
    else
        echo "非中国服务器，使用默认配置"
    fi
}

# 启动应用
start_application() {
    echo "启动Open Renamer后端服务..."
    deno run --allow-all index.ts
}

# 主执行流程
echo "===== Open Renamer 后端启动脚本 ====="
configure_deno_mirror
echo "===================================="
start_application
