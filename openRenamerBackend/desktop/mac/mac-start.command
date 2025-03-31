#!/bin/bash
script_abs=$(readlink -f "$0")
script_dir=$(dirname "${script_abs}")
echo 当前目录："$script_dir"
# 删除历史port文件
rm "$script_dir"/data/port
# 启动应用
"$script_dir"/macapp env:desktop &
# 循环等待启动成功
while [ ! -f "$script_dir"/data/port ]; do
    echo 等待程序启动
    sleep 1
done
port=$(cat "$script_dir"/data/port)
echo $port
open 'http://localhost:'"$port"
