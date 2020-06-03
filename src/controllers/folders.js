const router = require("express").Router();
const mongoose = require("mongoose");
const User = require("../models/user");
const Folder = require("../models/folder");
const { validateToken } = require("../utils/validateToken");

// ! Following endpoints are only for development

// * Fetch all folders
router.get("/test", async (_, res) => {
  const allFolders = await Folder.find({}).populate("todos");
  res.status(200).json(allFolders.map(f => f.toJSON()));
});

// * Fetch single folder
router.get("/:id/test", async (req, res) => {
  const { id } = req.params;
  const folder = await Folder.findById(id).populate("todos");
  res.status(200).json(folder.toJSON());
});

// * Fetch all todos in a folder
router.get("/:folderId/todos", async (req, res, next) => {
  const { folderId } = req.params;
  try {
    const folder = await Folder.findById(folderId).populate("todos");
    res.status(200).json(folder.todos.map(t => t.toJSON()));
  } catch (error) {
    next({ status: 500, message: "Error while fetching the resource" });
  }
});

// * Fetch a single todo in a folder
router.get("/:folderId/todos/:todoId", async (req, res, next) => {
  const { folderId, todoId } = req.params;
  try {
    const folder = await Folder.findById(folderId);
    const todo = folder.todos.id(todoId);
    res.status(200).json(todo);
  } catch (error) {
    next({ status: 500, message: "Error while fetching the resource" });
  }
});

// ! All request from this point will be funneled through the token validation middleware

router.use(validateToken);

// ! Folders

// * Create a folder
router.post("/", async (req, res, next) => {
  const { body, decodedToken } = req;
  const { title, id } = body;
  const user = await User.findById(decodedToken.id);
  console.log(user);
  const folder = new Folder({
    title: id,
    users: [user._id],
    updatedBy: user._id,
  });
  try {
    const savedFolder = await folder.save();
    user.folders = [...user.folders, savedFolder];
    await user.save();
    res.json(savedFolder.toJSON());
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// * Change folders title | todos
router.patch("/:id", async (req, res, next) => {
  const { body } = req;
  if (!body) next({ status: 400, message: "Request body is missing" });
  const { id } = req.params;
  const folderToPatch = await Folder.findById(id);
  if (!folderToPatch) next({ status: 500, message: "No folder with given ID was found" });

  const query = { $set: {} };
  for (const key in body) {
    if (
      folderToPatch[key] &&
      folderToPatch[key] !== body[key] &&
      key !== "_id" &&
      key !== "users"
    ) {
      query.$set[key] = body[key];
    }
  }
  const updatedFolder = await Folder.findByIdAndUpdate(id, query, { new: true });
  res.status(200).send(updatedFolder);
});

// * Delete the entire folder
router.delete("/:id", async (req, res, _next) => {
  const { id } = req.params;
  const folderToDelete = await Folder.findById(id);
  try {
    await Folder.deleteOne({ _id: folderToDelete._id });
    await User.updateMany({}, { $pull: { folders: folderToDelete._id } });
    res.status(204).json({ message: "folder deleted" });
  } catch (error) {
    console.log(error);
  }
});

// * Get the latest version of a shared Folder
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  const { decodedToken } = req;
  try {
    const folder = await Folder.findById(id);
    console.log(decodedToken);
    if (!folder.users.find(u => u.toString() === decodedToken.id))
      return next({ status: 409, message: "Permission denied" });

    res.status(200).json(folder.toJSON());
  } catch (error) {
    next({ status: 500, message: "Failed to fetch resource" });
  }
});

// ! Todos

// * Create a todo associated with a folder
router.post("/:id/todos", async (req, res, next) => {
  const { body } = req;
  const { title, description } = body;
  const { id } = req.params;
  const { decodedToken } = req;
  if (!body || !title) next({ status: 400, message: "Todo title missing" });
  try {
    const folder = await Folder.findById(id);
    if (!folder.users.find(u => u.toString() === decodedToken.id))
      return next({ status: 409, message: "Permission denied" });
    const newTodo = {
      title,
      description,
    };
    folder.todos.push(newTodo);
    const savedFolder = await folder.save();
    res.status(200).json(savedFolder.todos.map(t => t.toJSON()));
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// * Toggle single todos checked field
router.post("/:folderId/todos/:todoId/toggle", async (req, res, next) => {
  const { folderId, todoId } = req.params;
  const folder = await Folder.findById(folderId).populate("todos");
  if (!folder) next({ status: 500, message: "No folder with given ID" });
  const todo = folder.todos.id(todoId);
  todo.checked = !todo.checked;
  const savedFolder = await folder.save();
  res.status(200).json(savedFolder.todos.id(todoId));
});

// * Change the title | description of a single todo
router.patch("/:folderId/todos/:todoId", async (req, res, next) => {
  const { folderId, todoId } = req.params;
  const { body } = req;
  const folder = await Folder.findById(folderId).populate("todos");
  if (!folder) next({ status: 500, message: "No folder with given ID" });
  const todo = folder.todos.id(todoId);

  for (const key in body) {
    if ((todo[key] || todo[key] === "") && todo[key] !== body[key]) {
      todo[key] = body[key];
    }
  }
  const savedFolder = await folder.save();
  res.status(200).json(savedFolder.toJSON());
});

// * Delete single todo
router.delete("/:folderId/todos/:todoId", async (req, res, next) => {
  const { folderId, todoId } = req.params;
  const folder = await Folder.findById(folderId).populate("todos");
  if (!folder) next({ status: 500, message: "No folder with given ID" });
  const todo = folder.todos.id(todoId);
  await Folder.updateOne({ _id: folderId }, { $pull: { todos: { _id: todo._id } } });
  res.status(200).json("oj");
});

module.exports = router;
