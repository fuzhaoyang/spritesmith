const express = require('express')
const path = require('path')
const multer = require('multer')
const { exec } = require('child_process')
const fs = require('fs')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())//数据JSON类型
app.use(bodyParser.urlencoded({ extended: false }))//解析post请求数据
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

// 上传页面路由
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

// 处理图片上传
app.post('/upload', (req, res) => {
  const { uuid, type, padding } = req.headers
  global.uuid = uuid
  if (fs.existsSync(`./src/icons/${uuid}`)) {
    if (fs.readdirSync(`./src/icons/${uuid}`).length) {
      deleteFolderRecursive(`./src/icons/${uuid}`)
    }
  } else {
    fs.mkdir(`./src/icons/${uuid}`, (err) => {
      if (err) {
        console.log('文件夹创建失败!')
      } else {
        console.log('文件夹创建成功!')
      }
    })
  }
  if (fs.existsSync(`./src/assets/${uuid}`)) {
    if (fs.readdirSync(`./src/assets/${uuid}`).length) {
      deleteFolderRecursive(`./src/assets/${uuid}`)
    }
  } else {
    fs.mkdir(`./src/assets/${uuid}`, (err) => {
      if (err) {
        console.log('文件夹创建失败!')
      } else {
        console.log('文件夹创建成功!')
      }
    })
  }
  // 设置存储引擎和文件名
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `./src/icons/${uuid}`) // 图片将会存储在 ./src/icons 目录下 
    },
    filename: function (req, file, cb) {
      console.log(file, 525252)
      cb(null, file.originalname) // 设置文件名
    }
  })
  const upload = multer({ storage: storage })
  upload.array('image')(req, res, (err) => {
    console.log(req.body, 444)
  })
  const text = `module.exports = {
    uuid: '${uuid}',
    type: '${type}',
    padding: ${padding}
  }`
  fs.writeFile('./env.js', text, (err) => {
    console.log(err)
  })
  exec('./update.sh', (error, stdout, stderr) => {
    if (error) {
      res.send(error)
      return
    }
    const imgData = fs.readFileSync(`./src/assets/${uuid}/sprite.png`)
    const cssData = fs.readFileSync(`./src/assets/${uuid}/sprite.css`, { encoding: 'utf8', flag: 'r' })
    console.log(cssData, 123456789)
    res.send({
      status: 200,
      data: {
        img: 'data:image/png;base64,' + Buffer.from(imgData).toString('base64'),
        css: cssData && cssData.replaceAll(`/www/server/nginx/html/spritesmith/src/icons/${uuid}/`, '')
      }
    })
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

