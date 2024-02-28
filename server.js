const express = require('express')
const path = require('path')
const multer = require('multer')
const { exec } = require('child_process')
const fs = require('fs')
const { stdout, stderr } = require('process')
const app = express()
function deleteFolderRecursive (folderPath) {
  //判断文件夹是否存在
  if (fs.existsSync(folderPath)) {
    //读取文件夹下的文件目录，以数组形式输出
    fs.readdirSync(folderPath).forEach((file) => {
      //拼接路径
      const curPath = path.join(folderPath, file)
      //判断是不是文件夹，如果是，继续递归
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath)
      } else {
        //删除文件或文件夹
        fs.unlinkSync(curPath)
      }
    })
    //仅可用于删除空目录
    //fs.rmdirSync(folderPath);
  }
}
// 设置存储引擎和文件名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (fs.readdirSync('./src/icons').length) {
      deleteFolderRecursive('./src/icons')
    }
    cb(null, './src/icons') // 图片将会存储在 ./src/icons 目录下 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // 设置文件名
  }
})

const upload = multer({ storage: storage })

// 上传页面路由
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

// 处理图片上传
app.post('/upload', upload.array('image'), (req, res) => {
  exec('./update.sh', (error, stdout, stderr) => {
    if (error) {
      console.log(error)
      res.send(error)
      return
    }
    res.send({
      status: 200,
      data: '雪碧图已生成'
    })
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

