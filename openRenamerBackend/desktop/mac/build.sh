#!/bin/bash
script_abs=$(readlink -f "$0")
script_dir=$(dirname "${script_abs}")
# shellcheck disable=SC2164
cd "$script_dir"/../../../openRenamerFront
npm run build
cp -r dist/* ../openRenamerBackend/static
# shellcheck disable=SC2164
cd ../openRenamerBackend
npm run pkg-mac

# 打zip包
# shellcheck disable=SC2164
cd ./desktop/mac
zip renamer-mac-desktop.zip renamer-mac mac-start.command

# 解压后，首次运行会因为mac安全检查导致无法启动，解决步骤如下：
# 1. 双击renamer-mac启动应用
# 2. 此时会弹窗未打开“renamer-mac" Apple无法验证。。。。。。 点击完成按钮关闭告警
# 3. 然后进入设置-隐私与安全性-安全性 点击仍要打开   弹窗选择仍要打开 完成设置
# 4. 双击mac-start.command启动脚本（此脚本会自动打开浏览器页面）
# 5. 重复2-3步骤
