cd ../openRenamerFront
yarn
npm run build
cd ../openRenamerBackend
yarn
tsc
rm -rf ./static/js
rm -rf ./static/css
cp -r ../openRenamerFront/dist/* ./static
cd ../electron
mkdir -p dist
npm run build