const router = require("express").Router();
const bcrypt = require("bcrypt");
const { sendMail } = require("../utils/sendMail");
const User = require("../models/user");
require("dotenv").config();

router.post("/", async (req, res, next) => {
  const { body } = req;
  const { name, username, email, password } = body;

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = await bcrypt.hash(process.env.VERIFICATION_SECRET, 10);

  const newUser = User({
    name,
    username,
    email,
    passwordHash,
    verificationToken,
  });
  try {
    const savedUser = await newUser.save();
    const result = await sendMail(savedUser);
    console.log(result);
    res.status(200).json(savedUser);
  } catch (error) {
    next({ status: 409, message: "Registration error", data: error.errors });
  }
});

module.exports = router;
