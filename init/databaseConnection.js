const mongo = require('mongoose');
const winston = require('winston');
const config = require('config');

module.exports = async function () {
  try {
    await mongo.connect(
      config.get('mongoUrl'),
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
      }
    );
    winston.info("Connection with DataBase Successful at: " + config.get('mongoUrl'))
  } catch (error) {
    winston.error('Error Connecting To Database: ', error);
  }
}