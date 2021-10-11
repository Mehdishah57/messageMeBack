const mongo = require('mongoose');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const config = require('config');

const userSchema = new mongo.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  verificationKey: { type: String, default: '' },
  imageId: { type: String },
  imageUri: { type: String },
  private: { type: Boolean, default: false }
});

const tokenGenerator = user => {
  const token = jwt.sign({ _id: user._id, name: user.name, email: user.email }, config.get('jwtPrivateKey'));
  return token;
}

const User = mongo.model("User", userSchema);

const validateUser = user => {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(100).required(),
    verificationKey: Joi.string(),
    imageId: Joi.string(),
    imageUri: Joi.string(),
    private: Joi.boolean()
  })
  return schema.validate(user);
}

exports.User = User;
exports.validateUser = validateUser;
exports.tokenGenerator = tokenGenerator;
exports.userSchema = userSchema;