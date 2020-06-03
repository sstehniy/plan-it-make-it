const mongoose = require("mongoose");
const validator = require("mongoose-unique-validator");

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    checked: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false },
);

const folderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: false,
    },
    shared: {
      type: Boolean,
      default: false,
    },
    todos: [todoSchema],
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user",
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true },
);

folderSchema.plugin(validator);
folderSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = doc._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
todoSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = doc._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Folder = mongoose.model("folder", folderSchema);
Folder.collection.dropIndexes();
module.exports = Folder;
