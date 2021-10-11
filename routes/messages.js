const express = require('express');
const { handleRouteErrors } = require('../tryCatch');
const { Message, validateMessage } = require('../models/messageModel');
const router = express.Router();
const { User } = require('../models/userModel');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const auth = require("../middleware/auth");

router.post('/',auth, handleRouteErrors(async (req, res) => {
  const { error } = validateMessage(req.body);
  if (error) return res.status(400).send("Bad Request")
  const { member_1, member_2, message } = req.body;
  let exist = await Message.findOne(({ member_1: member_1, member_2: member_2 }) || ({ member_1: member_2, member_2: member_1 }));
  if (!exist) {
    const messages = new Message({ member_1, member_2, message });
    await messages.save()
    return res.status(200).send(messages);
  }
  exist.message.push(message[0]);
  await exist.save();
  res.send(exist);
}));

router.post('/get',auth,handleRouteErrors(async (req, res) => {
  const { email } = req.body;
  let conversation = await Message.aggregate([
    { $match: { $or: [{ member_1: email }, { member_2: email }] } },
    { $project: { member_1: 1, member_2: 1, messages: { $arrayElemAt: ['$message', -1] } } }
  ]);
  let Index = 0;
  let ArrayOfFriends = [];
  while (Index < conversation.length) {
    let user = await User.aggregate([
      {
        $match: {
          $and: [{
            $or: [{ email: conversation[Index].member_1 },
            { email: conversation[Index].member_2 }]
          }, { email: { $ne: email } }]
        }
      },
      { $project: { email: 1, name: 1, imageUri: 1 } }
    ]);
    ArrayOfFriends.push(user[0]);
    Index = Index + 1;
  }
  res.status(200).send({ conversation, ArrayOfFriends });
}));

router.post('/userMessages',auth, handleRouteErrors(async (req, res) => {
  const { id, length } = req.body;
  let messages = await Message.aggregate([
    { $match: { _id: ObjectId(id) } },
    { $project: { member_1: 1, member_2: 1, messages: { $slice: [{ $reverseArray: "$message" }, 0, length] } } }
  ]);
  res.status(200).send(messages);
}));

module.exports = router;