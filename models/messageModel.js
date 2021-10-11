const mongo = require('mongoose');
const Joi = require('joi');

const messageSchema = new mongo.Schema({
  member_1: { type: String, required: true },
  member_2: { type: String, required: true },
  message: [{
    text: { type: String, required: true },
    sender: { type: String, required: true },
    seen: { type: Boolean, default: false }
  }]
});

const Message = mongo.model('Message', messageSchema);

const validateMessage = (message) => {
  const schema = Joi.object({
    member_1: Joi.string().required(),
    member_2: Joi.string().required(),
    message: Joi.array()
  });
  return schema.validate(message);
}

exports.Message = Message;
exports.validateMessage = validateMessage;