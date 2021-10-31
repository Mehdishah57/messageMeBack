const express = require('express');
const winston = require('winston');
const config = require('config');

const app = express();

require('./init/logger')();
require('./init/config')();
require('./init/databaseConnection')();
require('./init/getRoutes')(app);

const io = require('socket.io')({
  cors: {
    origin: config.get("ORIGIN"),
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 5960;
const server = app.listen(PORT, () => { winston.info(`Listening at port:${PORT}`) });
io.attach(server);

io.on('connect', (socket) => {
  socket.on('User', user => {
    socket.join(user.email);
    io.to(user.email).emit("logger", `You Joined ${user.email}`);
  })
  socket.on("join-chat-emails", id => {
    socket.join(id)
    const clients = io.sockets.adapter.rooms.get(id);
    if(clients.size > 1) io.to(id).emit("online")
  });
  socket.on("message", (data) => {
    if (data && data.thisMessage)
      io.to(data.conversation._id).emit("user-message", data);
  })
  socket.on("joinRoom", id => {
    socket.to(id).emit("logger", "Someone want to message you bro");
    socket.on('Message', message => {
      socket.to(id).emit("logger", message)
    })
  })
  socket.on("searchedMessage", data => {
    io.to(data.item.email).emit("update-chats");
    io.to(data.thisMessage.sender).emit("update-chats")
  })
  socket.on("user-disconnect", (id)=>{
    socket.to(id).emit("offline")
  })
})