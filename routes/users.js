const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const winston = require('winston');
const { handleRouteErrors } = require('../tryCatch');
const router = express.Router();
const { User, validateUser, tokenGenerator } = require('../models/userModel');
const fs = require('fs');
const path = require('path');
const config = require('config');
const { google } = require('googleapis')
const auth = require("../middleware/auth");

router.post('/', async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  res.status(200).send(user);
})


router.post('/login', handleRouteErrors(async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    var user = await User.findOne({ email: req.body.email });
  }
  catch (error) {
    winston.error(error); /*Update Line Number for Error Track*/
    res.status(500).send("Something Went Wrong");
    process.exit(-1);
  }
  if (!user) return res.status(400).send("Invalid Credentials");
  const result = await bcrypt.compare(req.body.password, user.password);
  if (!result) return res.status(400).send("Invalid Credentials");
  const token = tokenGenerator(user)
  res.header("auth-token").send(token);
}));

router.post('/signup', handleRouteErrors(async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already Registered");
  const new_User = new User({
    email: req.body.email,
    name: req.body.name,
    password: req.body.password
  });
  const salt = await bcrypt.genSalt(10);
  const HASHED_PASS = await bcrypt.hash(new_User.password, salt);
  new_User.password = HASHED_PASS;
  await new_User.save();
  const token = tokenGenerator(new_User);
  res.status(200).send(token);
}))

router.put('/img',auth, handleRouteErrors(async (req, res) => {
  if (req.files === null)
    return res.status(400).send("No Image Uploaded");
  if (req.body.email === null)
    return res.status(403).send("Not authorized");
  let user = await User.findOne({ email: req.body.email })

  const CLIENT_ID = config.get('CLIENT_ID');
  const CLIENT_SECRET = config.get("CLIENT_SECRET");
  const REDIRECT_URI = config.get('REDIRECT_URI');
  const REFRESH_TOKEN = config.get("REFRESH_TOKEN");

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  oauth2Client.generateAuthUrl({
    access_type: 'offline',
  });

  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
  });

  var dir = `${__dirname}/${req.body.email}`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const image = req.files.file;
  let oldName = image.name.split('');
  let endIndex = oldName.indexOf('.');
  let imageExtension = [];

  for (let i = 0; i < 6; i++) {
    imageExtension[i] = oldName[endIndex];
    endIndex = endIndex + 1;
  }

  let imgExtension = imageExtension.join("");
  image.name = "profile" + imgExtension;
  image.mv(`${__dirname}/${req.body.email}/${image.name}`, async err => {
    async function uploadToDrive() {
      try {
        if (user.imageId) await deleteFile(user.imageId);
        const response = await drive.files.create({
          requestBody: {
            name: image.name,
            mimeType: image.mimetype
          },
          media: {
            mimetype: image.mimetype,
            body: fs.createReadStream(`${__dirname}/${req.body.email}/${image.name}`)
          },
        })
        user.imageId = response.data.id;
        let imageUri = await getUrl(response.data.id);
        user.imageUri = imageUri.webContentLink;
        await user.save();
        res.status(200).send(user.imageUri);
      } catch (error) {
        console.error(error);
      }
    }
    await uploadToDrive();
    async function deleteFile(id) {
      try {
        const response = await drive.files.delete({
          fileId: id
        })
      } catch (error) {
        console.error(error);
      }
    }

    async function getUrl(id) {
      try {
        await drive.permissions.create({
          fileId: id,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        })
        const result = await drive.files.get({
          fileId: id,
          fields: 'webContentLink'
        })
        return result.data;
      } catch (error) {
        console.log(error);
      }
    }
  });
}));

router.post('/search',auth, handleRouteErrors(async (req, res) => {
  const { value, pageNumber, pageSize } = req.body;
  if (!value) return res.status(400).send("Bad Request");
  let user;
  if (value.match(/^[0-9a-fA-F]{24}$/)) {
    user = await User.find({ _id: value }).select(['_id', 'name', 'imageUri', 'email'])
      .skip((pageNumber - 1) * pageSize).limit(pageSize);
  }
  if (user) return res.status(200).send(user);
  user = await User.find({ 'name': { '$regex': value, '$options': 'i' }, private: false }).select(['_id', 'name', 'imageUri', 'email'])
    .skip((pageNumber - 1) * pageSize).limit(pageSize);
  if (!user) return res.status(404).send("No Matches")
  res.status(200).send(user);
}));

router.post('/name', auth, handleRouteErrors(async(req,res) => {
  const user = await User.findOne({_id: req.user._id});
  user.name = req.body.name;
  await user.save();
  const token = tokenGenerator(user);
  res.status(200).send(token);
}))

router.post("/privacy", auth, handleRouteErrors(async(req,res) => {
  await User.updateOne({_id: req.user._id},{active:req.body.checked});
  res.status(200).send("Success");
}));

const validateLogin = loginRequest => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(100).required()
  });
  return schema.validate(loginRequest);
}

module.exports = router;