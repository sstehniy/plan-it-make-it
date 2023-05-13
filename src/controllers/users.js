const router = require("express").Router();
const User = require("../models/user");
const Folder = require("../models/folder");
const { sendMail } = require("../utils/sendMail");
const { validateToken } = require("../utils/validateToken");

router.get("/", async (_, res) => {
  const allUsers = await User.find({}).populate(["folders", "invitations"]);
  res.status(200).json(allUsers.map(u => u.toJSON()));
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  res.status(200).json(user);
});

router.get("/:id/verify", async (req, res, next) => {
  const { id } = req.params;
  const { token } = req.query;
  console.log(id);
  console.log(token);
  if (!id || !token) next({ status: 403, message: "Failed to verify email" });
  try {
    const user = await User.findById(id);
    console.log(user);
    if (!user) next({ status: 403, message: "Failed to verify email" });
    const { verificationToken } = user;
    if (verificationToken + "" === token + "") {
      user.emailVerified = true;
      const savedUser = await user.save();
      console.log("saved user", savedUser);
      res.status(200).redirect(`https://web-production-35b5.up.railway.app/`);
    }
  } catch (error) {
    console.log(error);
    next({ status: 403, message: "Failed to verify email" });
  }
});

router.post("/:id/resend-verification", async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    await sendMail(user);
  } catch (error) {
    return next({ status: 500, message: "Error while fetching resource" });
  }
  res.status(200).json({ message: "Email resent succesfully" });
});

router.use(validateToken);

// * Get all verified users matching the query string, sends back a username array
router.get("/:id/search", async (req, res, _next) => {
  const username = req.query.username;
  const { id } = req.params;
  const usernameRegex = new RegExp(`^${username}`);
  try {
    const users = await User.find({
      username: { $regex: usernameRegex },
      _id: { $ne: id },
      emailVerified: true,
    }).select(["-passwordHash"]);
    res.status(200).send(users.map(u => u.toJSON()));
  } catch (error) {
    res.status(200).send([]);
  }
});

// * Fetch all folders of a user
router.get("/:id/folders", async (req, res, next) => {
  const { id } = req.params;
  try {
    const folders = await Folder.find({ users: id });
    res.status(200).json(folders.map(f => f.toJSON()));
  } catch (error) {
    next({ status: 500, message: "Failed to load resource" });
  }
});

// * Fetch all invitations of a user
router.get("/:id/invitations", async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).populate([
      { path: "receivedInvitations", populate: ["from", "to", "folder"] },
      { path: "sentInvitations", populate: ["from", "to", "folder"] },
    ]);
    const resData = {
      received: user.receivedInvitations.map(i => i.toJSON()),
      sent: user.sentInvitations.map(i => i.toJSON()),
    };
    res.status(200).json(resData);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch resource" });
  }
});

module.exports = router;
