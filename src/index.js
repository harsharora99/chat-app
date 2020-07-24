const path = require('path')  //core node module(no need to install)
const http=require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} =require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')


const app = express()
const server=http.createServer(app)   //creating htttp server
const io=socketio(server)   //instance of socketio to configure socketio with the server

const port = process.env.PORT || 3000
const publicDirectoryPath=path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))



//server (emit) -> client (receive) - countUpdated
//client (emit) -> server (receive) - increment

//let count = 0
// io.on('connect', (socket) => {    //listening for event to occur
//     console.log('New websocket connection')
//     socket.emit('countUpdated')
// })

io.on('connect', (socket) => { //listening for event to occur
    console.log('New websocket connection')
    // socket.emit('countUpdated', count)
    // socket.on('increment', () => {
    //     count++
    //     //socket.emit('countUpdated',count)   //emits event only to a single socket/client
    //     io.emit('countUpdated',count)  //emits event to all the connections
    // })

    // socket.emit('message', "Welcome!")
    // socket.emit("message", generateMessage('Welcome!'));
    // socket.broadcast.emit('message', generateMessage('A new user has joined!'))

    socket.on('join', (options, callback) => {
        const {error,user} = addUser({id:socket.id,...options})
        if (error) {
            return callback(error)
        }
        socket.join(user.room)    //socket or new client connection is connected to the specified room
        socket.emit("message", generateMessage('Admin','Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })
    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)
        
        const filter = new Filter()
        if (filter.isProfane(msg)) {
            return callback('Profanity(Bad words) are not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, msg))
        callback()
    })
    socket.on('sendLocation', (coords, callback) => {
        const user=getUser(socket.id)
        // io.emit('message',`location: ${coords.latitude}, ${coords.longitude}`)
         io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps/?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})


server.listen(port, () => {    //starting server
    console.log(`Server is up on ${port}!`)
})