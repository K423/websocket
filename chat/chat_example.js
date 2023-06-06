const {
    createServer
} = require("http");
const {
    Server
} = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        "origin": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "preflightContinue": false,
        "optionsSuccessStatus": 204
    }
});

//监听连接
io.on("connection", (socket) => {
    console.log("用户连接")
    // 发送消息给客户端 通过emit注册事件 此处为send事件(自定义事件名)
    socket.emit('send', "你好")
    //on 监听事件 监听浏览器的事件
    socket.on('message', data =>{
        console.log(data)
    })

});



httpServer.listen(8001, () => {
    console.log("启动连接")
});