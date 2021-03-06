const Jwt = require('jsonwebtoken');
const config = require("config");

const auth = (req,res,next) => {
  const token = req.header('messageMeToken');
  if(!token) return res.status(403).send("No token provided");
  try {
    const user = Jwt.verify(token, config.get("jwtPrivateKey"));
    req.user = user;
    next();
  } catch (error) {
    res.status(400).send("Invalid Token");
  }
}

module.exports = auth;