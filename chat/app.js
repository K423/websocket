// 创建HTTP服务器
const http = require('http')
const app = require('express')()
const server = http.Server(app)
//监听端口号
server.listen(3000, () => {
    console.log("启动连接")
})

//express处理静态资源
//把public目录设置为静态资源
app.use(require('express').static('public'))
// app.use(require('express').static(path.join(__dirname, 'public')))
app.get('/', function (req, res) {
    res.redirect('/index.html')
})

// 建立socket服务
// 绑定socket.io到HTTP服务器：
// 使用socket.io的Server构造函数创建一个socket.io服务，
const {
    Server
} = require('socket.io')
// 并将其绑定到HTTP服务器上
const io = new Server(server, {
    cors: {
        "origin": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "preflightContinue": false,
        "optionsSuccessStatus": 204
    }
});

//存储已登录的用户信息 确保用户名唯一
const users = []


//监听连接
io.on("connection", (socket) => {
    console.log("用户连接")
    // 发送消息给客户端 通过emit注册事件 此处为send事件(自定义事件名)
    // socket.emit('send', "你好")
    //on 监听事件 监听浏览器的事件
    // socket.on('message', data =>{
    //     console.log(data)
    // })
    //异常错误
    socket.on('error', (error) => {
        console.log('发生错误：', error);
    });

    //监听登录事件
    socket.on('login', data => {
        // console.log(data)
        //判断用户是否存在
        let user = users.find(item => item.username == data.username)
        let idx = users.findIndex(item => item.username == data.username)
        if (user) {
            //同一用户再次登录
            if (user.password == data.password) {
                if (idx == -1) {
                    users.splice(idx + 1, 1) //删除旧信息
                    users.push(data)
                } else {
                    users.splice(idx, 1) //删除旧信息
                    users.push(data)
                }
                socket.emit('loginSuccess', data)
                io.emit('addUser', data)
                console.log('再次登录')
                //广播用户列表
                io.emit('userList', users)
            } else {
                //不同用户
                //用户名已存在 返回登录失败事件
                socket.emit('loginError', {
                    msg: '失败啦'
                })
                console.log("登录失败")
            }
        } else {
            //存储用户data
            users.push(data)
            //返回登录成功事件
            socket.emit('loginSuccess', data)
            //io.emit 广播事件 socket.emit 单独事件 
            //广播用户进入事件
            io.emit('addUser', data)
            //广播用户列表
            io.emit('userList', users)
            console.log("ok")

            //存储当前用户信息
            socket.username = data.username
            socket.password = data.password
            socket.avatar = data.avatar
            // socket.flag = data.flag //在线状态 1在线 0离线
        }
    })

    //监听断开连接
    socket.on('disconnect', () => {
        //获取用户索引
        let idx = users.findIndex(item => item.username === socket.username)
        let temp = ''
        if (idx) {
            console.log("当前" + idx)
            if (idx == -1) {
                // 更在在线状态
                users[idx + 1].flag = 0
                temp = users[idx + 1].username
            } else {
                // 更在在线状态
                users[idx].flag = 0
                temp = users[idx].username
            }
            // 更在在线状态
            // users[idx].flag = 0
            // console.log(users)
        }
        //广播用户离开信息
        io.emit('exit', {
            username: temp
        })
        //更新用户列表
        io.emit('userList', users)
    })


    //监听发送消息的事件
    socket.on('sendMessage', data => {
        //广播给所有用户
        io.emit('receiveMessage', data)
    })

    //监听发送图片的事件
    socket.on('sendImage', data => {
        //广播给所有用户
        io.emit('receiveImage', data)
    })
});