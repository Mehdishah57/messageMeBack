const config = require('config');
module.exports = function () {
  if (!config.get('jwtPrivateKey') || !config.get("ORIGIN") || !config.get('mongoUrl') || !config.get('CLIENT_ID') || !config.get("CLIENT_SECRET") || !config.get('REDIRECT_URI') || !config.get("REFRESH_TOKEN"))
  throw new Error("Enviornment Variable Error Error: Enviornment Variables not Set");
}