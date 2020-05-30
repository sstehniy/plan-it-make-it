const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "folder",
  },
  status: {
    type: String,
    required: true,
    default: "pending",
  },
});

invitationSchema.set("toJSON", {
  transform: (pre, ret) => {
    ret.id = pre._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Invitation = mongoose.model("invitation", invitationSchema);

module.exports = Invitation;
