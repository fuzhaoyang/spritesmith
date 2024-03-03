const express = require('express')
const path = require('path')
const multer = require('multer')
const { exec } = require('child_process')
const fs = require('fs')
const Jimp = require('jimp')
const svg2img = require('svg2img')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())//数据JSON类型
app.use(bodyParser.urlencoded({ extended: false }))//解析post请求数据
let isBuild = false
let buildParams
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

// 刷新
app.get('/upload/:id', (req, res) => {
  const uuid = req.params.id
  const imgData = fs.readFileSync(`./src/assets/${uuid}/sprite.png`)
  const cssData = fs.readFileSync(`./src/assets/${uuid}/sprite.css`, { encoding: 'utf8', flag: 'r' })
  res.send({
    status: 200,
    data: {
      img: 'data:image/png;base64,' + Buffer.from(imgData).toString('base64'),
      css: cssData && cssData.replaceAll(`/www/server/nginx/html/spritesmith/src/icons/${uuid}/`, '')
    }
  })
})

// 处理图片上传
app.post('/upload', (req, res) => {
  if (isBuild && buildParams.uuid !== req.headers.uuid) {
    res.send({
      status: 502,
      msg: '网络占用,请重试！'
    })
    return
  }
  const { uuid, type, padding } = req.headers
  buildParams = {
    uuid: uuid,
    type: type,
    padding: padding,
    res: res
  }
  isBuild = true
  if (fs.existsSync(`./src/icons/${buildParams.uuid}`)) {
    if (fs.readdirSync(`./src/icons/${buildParams.uuid}`).length) {
      deleteFolderRecursive(`./src/icons/${buildParams.uuid}`)
    }
  } else {
    fs.mkdir(`./src/icons/${buildParams.uuid}`, (err) => {
      if (err) {
        console.log('文件夹创建失败!')
      } else {
        console.log('文件夹创建成功!')
      }
    })
  }
  if (fs.existsSync(`./src/assets/${buildParams.uuid}`)) {
    if (fs.readdirSync(`./src/assets/${buildParams.uuid}`).length) {
      deleteFolderRecursive(`./src/assets/${buildParams.uuid}`)
    }
  } else {
    fs.mkdir(`./src/assets/${buildParams.uuid}`, (err) => {
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
      cb(null, `./src/icons/${buildParams.uuid}`) // 图片将会存储在 ./src/icons 目录下 
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) // 设置文件名
    }
  })
  const upload = multer({ storage: storage })
  const arr = []
  upload.array('image')(req, res, (err) => {
    req.files.forEach(item => {
      console.log(item.mimetype)
      if (item.mimetype !== 'image/png') {
        arr.push({
          path: item.path,
          mimetype: item.mimetype,
          name: `${item.filename.split('.')[0]}.png`
        })
      }
    })
    console.log(arr)
    arr.forEach(item => {
      if (item.mimetype === 'image/jpeg' || item.mimetype === 'image/gif') {
        Jimp.read(item.path, (err, image) => {
          image.write(`./src/icons/${buildParams.uuid}/${item.name}`)
          if (err) {
            console.error("转换失败", err)
          }
        })
      }
      if (item.mimetype === 'image/svg+xml') {
        svg2img(item.path, { format: 'png' }, function (error, buffer) {
          fs.writeFileSync(`./src/icons/${buildParams.uuid}/${item.name}`, buffer) // 保存生成的PNG图像到指定位置
        })
      }
      exec(`rm -rf ${item.path}`, (error, stdout, stderr) => {
        if (error) {
          console.error("删除失败", err)
        } else {
          console.log("删除成功", err)
        }
      })
    })
    const text = `module.exports = {
      uuid: '${buildParams.uuid}',
      type: '${buildParams.type}',
      padding: ${buildParams.padding}
    }`
    fs.writeFile('./env.js', text, (err) => {
      console.log(err)
    })
    exec('./update.sh', (error, stdout, stderr) => {
      if (error) {
        res.send(error)
        return
      }
      const imgData = fs.readFileSync(`./src/assets/${buildParams.uuid}/sprite.png`)
      const cssData = fs.readFileSync(`./src/assets/${buildParams.uuid}/sprite.css`, { encoding: 'utf8', flag: 'r' })
      isBuild = false
      buildParams.res.send({
        status: 200,
        data: {
          img: 'data:image/png;base64,' + Buffer.from(imgData).toString('base64'),
          css: cssData && cssData.replaceAll(`/www/server/nginx/html/spritesmith/src/icons/${buildParams.uuid}/`, '')
        }
      })
    })
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

