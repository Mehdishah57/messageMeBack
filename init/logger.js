const winston = require('winston');
module.exports = function () {
  winston.exceptions.handle(
    new winston.transports.File({ filename: 'unCaughtExceptions.log' })
  );
  const logFile = new winston.transports.File({ filename: "logFile.log" });
  const myConsole = new winston.transports.Console();
  winston.add(logFile);
  winston.add(myConsole);
}