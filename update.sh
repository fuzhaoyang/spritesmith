echo -e "清除构建包"
rm -rf ./dist
echo -e "开始生成雪碧图"
npm run build
echo -e "雪碧图已生成"