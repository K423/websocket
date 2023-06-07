/*
    启动服务端程序
*/ 
const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const path = require('path'); 
const mysql = require('mysql')
//连接数据库，把用户信息存入
var connection = mysql.createConnection({     
    host     : 'localhost',       
    user     : 'root',              
    password : '123456abc',       
    port: '3306',                   
    database: 'websocket' 
})



// //支持截图功能
// const webshot = require('webshot');
//记录所有已经登陆过的用户
const users = []
var registeredUsers = []

//启动了服务器
server.listen(3000, () => {
    console.log('服务器启动成功了')
})

//express处理静态资源
//把public目录设置为静态资源
app.use(require('express').static(path.join(__dirname,'public')))
app.get('/', function(req, res) {
  res.redirect('/index.html')
})

io.on('connection', function(socket) {

    socket.on('checkoutLogin',data => {
        // 首先连接数据库，验证
        connection.connect()
        let sql ="SELECT password FROM usersInformation where username="
        sql = sql + data.username 
        console.log(sql)
        connection.query(sql,function (err, result) {
            if(err){
            //   console.log('[SELECT ERROR] - ',err.message);
            //   socket.emit('checkoutAnswer',{
            //       msg: '用户名不存在'
            //   })
            console.log('数据库错误')
              throw error
              
            }
          //输出查询到的密码
        //   console.log(result)
        console.log(result[0].password,data.password)
           if(result[0].password === data.password){
               console.log('1')
               socket.emit('checkoutAnswer',{
                msg:'用户密码正确'
            })
           } else{
               console.log('0')
               socket.emit('checkoutAnswer',{
                msg:'用户密码错误'
               })
             }
           
        })
        connection.end()
    })
    socket.on('login',data => {
        //判断，如果在data在users中存在，说明该用户登陆过了，不允许登录
        //如果data在user中不存在，说明用户没有登陆，允许登录
        let user = users.find(item => item.username === data.username)
        if(user){
            //表示用户存在
            socket.emit('loginError',{msg: '登陆失败'})
            // console.log('登陆失败')
        }else{
            //表示用户不存在,把用户存入user数组
            users.push(data)
            //告诉用户，登陆成功
            socket.emit('loginSuccess',data)
            // console.log('登陆成功')
        
        //告诉所有人，有新用户加入到了聊天室，广播消息
        //socket.emit 给当前用户发消息 io.emit 给所有用户发消息
        io.emit('addUser',data)


        //告诉所有用户，当前聊天室用户列表以及数量
        io.emit('userList',users)

        //把登陆成功的用户信息存储起来
        //socket.username ? avatar 内置对象？ 不太像
        socket.username = data.username
        socket.avatar = data.avatar
        }
    })

    //用户断开连接功能
    //监听用户断开连接
    socket.on('disconnect',() => {
        //把当前用户信息从user中删除
        let idx = users.findIndex(item => item.username === socket.username)
        //删除掉断开连接的人
        users.splice(idx, 1)
        // 1.告诉所有人，有人离开了聊天室
        io.emit('deleteUser',{
            username:socket.username,
            avatar: socket.avatar
        })
        // 2.告诉所有人，userList发生更新
        io.emit('userList',users)
    })
    
    //监听聊天的消息
    socket.on('sendMessage', data => {
        //广播给所有用户
        io.emit('receiveMessage', data)
    })

    //接受图片的信息
    socket.on('sendImage', data => {
        //广播给所有用户
        io.emit('receiveImage', data)
    })

    // //实现截图功能
    // socket.on('webshot', url => {
    //     webshot(url, 'hello_world.png', {siteType:'html'}, function(err) {
    //         // screenshot now saved to hello_world.png
    //       })
    // })

    //注册用户
    socket.on('registerUser',data => {
        console.log(data)
        //直接连上数据库
        connection.connect()
        var  addSql = 'INSERT INTO usersInformation(username,password,sex,avatar) VALUES(?,?,?,?)';
        var  addSqlParams = [data.username,data.password,data.sex,data.avatar];

        //插入之前要查询一遍，确保主键不会重复，以免出现异常导致服务器中断 暂时不写 可以catch
        connection.query(addSql,addSqlParams,function (err, result) {
            if(err){
             console.log('[INSERT ERROR] - ',err.message)
             return
            }               
        //    console.log('INSERT ID:',result);       
        })
        socket.emit('registerSuccess')
        //断开连接
        connection.end()

   })

})