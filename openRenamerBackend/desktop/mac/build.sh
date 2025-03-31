#!/bin/bash
script_abs=$(readlink -f "$0")
script_dir=$(dirname "${script_abs}")
# shellcheck disable=SC2164
cd "$script_dir"/../../../openRenamerFront
npm run build
cp -r dist/* ../openRenamerBackend/static
# shellcheck disable=SC2164
cd ../openRenamerBackend
npm run ncc
npm run pkg

# 打zip包
# shellcheck disable=SC2164
cd ./desktop/mac
zip mac-desktop.zip macapp mac-start.command