const winston = require('winston');
const __prod__ = require('./init/__prod__');

exports.handleRouteErrors = function handleRouteErrors(callback) {
  return async (req, res, next) => {
    try {
      await callback(req, res);
    } catch (error) {
      if (__prod__ !== 'production') console.error(error);
      winston.error(error)
      next(error);
    }
  }
}