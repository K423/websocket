/*
websocket 基本用法
*/
//导入nodejs-websocket
const {
    connect
} = require('http2')
const ws = require('nodejs-websocket')

//自定义端口号
const PORT = 8001
/*
定义消息对象
type 消息类型 0表示进入聊天室 1表示离开聊天室 2表示聊天信息
msg 消息内容
time 时间
name 用户名
*/
const TYPE_ENTER = 0
const TYPE_LEAVE = 1
const TYPE_MESSAGE = 2


//记录当前连接用户数目
let count = 0

//创建server
//一旦有用户进入，改函数就会执行，建立连接
const server = ws.createServer(connect => {
    console.log("用户连接")
    count++
    connect.username = `用户${count}`
    //广播处理
    // broadcast(`${connect.username}进入聊天室`)
    broadcast({
        type: TYPE_ENTER,
        msg: `${connect.username}进入聊天室`,
        time: new Date().toLocaleTimeString(),
        name: connect.username
    })
    //处理请求（当有数据传递，text事件就会触发）
    connect.on('text', data => {
        // console.log("接受数据信息：", data)
        // 给用户一个响应
        // connect.send("这是响应测试: " + data)
        // broadcast(data)
        broadcast({
            type: TYPE_MESSAGE,
            msg: data,
            time: new Date().toLocaleTimeString(),
            name: connect.username
        })
    })

    //连接关闭时处理
    connect.on('close', () => {
        console.log("连接断开")
        // broadcast(connect.username + "离开聊天室")
        broadcast({
            type: TYPE_LEAVE,
            msg: connect.username + "离开聊天室",
            time: new Date().toLocaleTimeString(),
            name: connect.username
        })
    })

    //连接异常处理
    connect.on('error', () => {
        console.log("异常连接处理")
    })
})

//广播,发送消息给所有连接用户
function broadcast(Obj) {
    //server.connections 表示所有连接用户信息 一个连接数组
    server.connections.forEach(item => {
        item.send(JSON.stringify(Obj))  //将msg对象转我json字符串
    })
}

//随时监听
server.listen(PORT, () => {
    console.log("监听端口：" + PORT)
})