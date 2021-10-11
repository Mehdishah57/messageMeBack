const users = require('../routes/users');
const messages = require('../routes/messages');
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const config = require("config");

module.exports = function (app) {
  app.use(cors({
    origin: config.get("ORIGIN")
  }));
  app.use(fileUpload());
  app.use(express.json({ limit: '5mb' }));
  app.use(`/api/users`, users);
  app.use(`/api/messages`, messages);
}