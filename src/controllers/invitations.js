const router = require("express").Router();
const User = require("../models/user");
const Folder = require("../models/folder");
const Invitation = require("../models/invitation");
const { validateToken } = require("../utils/validateToken");

router.get("/", async (_req, res) => {
  const invitations = await Invitation.find().populate(["from", "to", "folder"]);
  res.status(200).json(invitations.map(i => i.toJSON()));
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const invitation = await Invitation.findById(id).populate(["from", "to", "folder"]);
  res.status(200).json(invitation.toJSON());
});

// ! Token validation middleware
router.use(validateToken);

// * If you send somebody an invitation
router.post("/", async (req, res, next) => {
  const { username, folderId } = req.body;
  const { decodedToken } = req;
  console.log(decodedToken);

  try {
    const fromUser = await User.findById(decodedToken.id);
    if (!fromUser.emailVerified)
      return next({ status: 403, message: "Permission denied" });
    const toUser = await User.findOne({ username });
    const folderToShare = await Folder.findById(folderId);
    const invitationExists = await Invitation.findOne({
      from: fromUser._id,
      to: toUser._id,
      folder: folderToShare._id,
    });
    console.log("folder", invitationExists);
    if (invitationExists)
      return next({
        status: 400,
        message: "You already sent an invitation to this user to share yhe folder",
      });
    if (folderToShare.shared)
      return next({ status: 400, message: "Resource with given id is already shared" });

    const newInvitation = {
      from: fromUser._id,
      to: toUser._id,
      folder: folderToShare._id,
    };
    const invitation = Invitation(newInvitation);

    const savedInvitation = await invitation.save();
    fromUser.sentInvitations.push(savedInvitation._id);
    toUser.receivedInvitations.push(savedInvitation._id);
    await fromUser.save();
    await toUser.save();
    res.status(200).json(savedInvitation.toJSON());
  } catch (error) {
    // next({ status: 500, message: "Error while creating resource" });
    console.log(error);
  }
});

// * If you cancel the invitation before it was accepted
router.post("/cancel", async (req, res, next) => {
  const { id } = req.body;
  const { decodedToken } = req;
  try {
    const invitation = await Invitation.findById(id);
    if (!invitation)
      return next({ status: 400, message: "No invitation with provided ID" });
    if (decodedToken.id !== invitation.from.toString())
      return next({ status: 409, message: "Permission denied" });
    await User.updateOne(
      { _id: invitation.from },
      { $pull: { sentInvitations: invitation._id } },
      (err, raw) => console.log(raw),
    );
    await User.updateOne(
      { _id: invitation.to },
      { $pull: { receivedInvitations: invitation._id } },
      (err, raw) => console.log(raw),
    );

    await invitation.remove((err, doc) => {
      if (err) console.log(err);
      else console.log(doc);
    });
    res.status(200).json({ message: "Successfuly updated resource" });
  } catch (error) {
    next({ status: 500, message: "Failed to update resource" });
  }
});

// * If the recipient accepts the invitation
router.post("/accept", async (req, res, next) => {
  const { decodedToken } = req;
  const { id } = req.body;
  try {
    const invitation = await Invitation.findById(id);

    console.log("decoded token", decodedToken.id);
    console.log("invitation", invitation.to);
    if (!invitation)
      return next({ status: 400, message: "No invitation with provided id" });
    if (decodedToken.id !== invitation.to.toString())
      return next({ status: 409, message: "Permission denied" });

    const folder = await Folder.findById(invitation.folder);
    folder.shared = true;
    folder.users.push(invitation.to);
    const savedFolder = await folder.save();
    await User.update(
      { _id: invitation.to },
      {
        $pull: { receivedInvitations: invitation._id },
        $addToSet: { folders: savedFolder._id },
      },
      (err, res) => console.log(res),
    );
    await User.updateOne(
      { _id: invitation.from },
      {
        $pull: { sentInvitations: invitation._id },
      },
      (err, res) => console.log(res),
    );
    await invitation.remove();
    res.status(200).json(savedFolder.toJSON());
  } catch (error) {
    // next({ status: 500, message: "Failed to load resource" });
    console.log(error);
  }
});

// * If the recipient declines the invitation
router.post("/decline", async (req, res, next) => {
  const { decodedToken } = req;
  const { id } = req.body;
  try {
    const invitation = await Invitation.findById(id);
    if (!invitation)
      return next({ status: 400, message: "No invitation with provided id" });
    if (decodedToken.id !== invitation.to.toString())
      return next({ status: 409, message: "Permission denied" });

    await User.update(
      { _id: invitation.to },
      { $pull: { receivedInvitations: { _id: invitation._id } } },
    );
    await User.update(
      { _id: invitation.from },
      { $pull: { sentInvitations: { _id: invitation._id } } },
    );
    await invitation.remove();

    res.status(200).json({ message: "Successfuly updated resource" });
  } catch (error) {
    next({ status: 500, message: "Error while updating resource" });
  }
});

module.exports = router;
