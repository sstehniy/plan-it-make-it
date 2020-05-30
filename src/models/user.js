const mongoose = require("mongoose");
const validator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: true,
    },
    receivedInvitations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "invitation",
      },
    ],
    sentInvitations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "invitation",
        index: true,
      },
    ],
    passwordHash: {
      type: String,
      required: true,
    },
    folders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "folder",
      },
    ],
  },
  { versionKey: false },
);

userSchema.set("toJSON", {
  transform: (pre, ret) => {
    ret.id = pre._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

userSchema.plugin(validator);

const User = mongoose.model("user", userSchema);

module.exports = User;
