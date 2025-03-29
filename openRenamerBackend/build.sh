# shellcheck disable=SC2164
cd ../openRenamerFront
npm run build
cp -r dist/* ../openRenamerBackend/static
cd ../openRenamerBackend
npm run ncc
npm run pkg