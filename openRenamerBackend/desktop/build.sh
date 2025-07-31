#!/bin/bash
script_abs=$(readlink -f "$0")
script_dir=$(dirname "${script_abs}")
# shellcheck disable=SC2164
cd "$script_dir"/../../openRenamerFront
npm run build
cp -r dist/* ../openRenamerBackend/static
# shellcheck disable=SC2164
cd ../openRenamerBackend

# "dev"替换为desktop
sed -i 's/"dev"/"desktop"/g' config.ts


# mac-arm-arm打包
npm run pkg-mac-arm
# 打zip包
# shellcheck disable=SC2164
cd ./desktop/mac-arm
zip renamer-mac-arm-desktop.zip renamer-mac mac-start.command
echo mac-arm over
# 解压后，首次运行会因为mac安全检查导致无法启动，解决步骤如下：
# 1. 双击renamer-mac启动应用
# 2. 此时会弹窗未打开“renamer-mac-arm" Apple无法验证。。。。。。 点击完成按钮关闭告警
# 3. 然后进入设置-隐私与安全性-安全性 点击仍要打开   弹窗选择仍要打开 完成设置
# 4. 双击mac-start.command启动脚本（此脚本会自动打开浏览器页面）
# 5. 重复2-3步骤


# mac-arm-x64打包
cd ../../
npm run pkg-mac-x64
# 打zip包
# shellcheck disable=SC2164
cd ./desktop/mac-x64
zip renamer-mac-x64-desktop.zip renamer-mac mac-start.command
echo mac-x64 over


# windows-x64打包
cd ../../
npm run pkg-win-x64
# 打zip包
# shellcheck disable=SC2164
cd ./desktop/win-x64
zip renamer-win-x64-desktop.zip renamer-win.exe win-start.bat node_sqlite3.node
echo win-x64 over


# linux-x64打包
cd ../../
npm run pkg-linux-x64
# 打zip包
# shellcheck disable=SC2164
cd ./desktop/linux-x64
zip renamer-linux-x64-desktop.zip renamer-linux linux-start.sh node_sqlite3.node
echo linux-x64 over


# linux-arm打包
cd ../../
npm run pkg-linux-arm
# 打zip包
# shellcheck disable=SC2164
cd ./desktop/linux-arm
zip renamer-linux-arm-desktop.zip renamer-linux linux-start.sh node_sqlite3.node
echo linux-arm over

# 替换回去
cd ../../
sed -i 's/"desktop"/"dev"/g' config.ts
