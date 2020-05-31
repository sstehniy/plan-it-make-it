const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectToDB = require("./db.config");
const morganBody = require("morgan-body");
require("dotenv").config();

const registerRouter = require("./controllers/register");
const loginRouter = require("./controllers/login");
const userRouter = require("./controllers/users");
const folderRouter = require("./controllers/folders");
const invitationRouter = require("./controllers/invitations");

const port = process.env.PORT || 5001;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
morganBody(app, {
  dateTimeFormat: "clf",
  logReqUserAgent: false,
  theme: "lightened",
});

app.use((req, res, next) => {
  req.rootUrl = req.protocol + "://" + req.host + ":3000";
  next();
});

app.use(express.static(__dirname, "build"));
app.use("/api/register", registerRouter);
app.use("/api/login", loginRouter);
app.use("/api/user", userRouter);
app.use("/api/folders", folderRouter);
app.use("/api/invitation", invitationRouter);

// * Unknown endpoint
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// * Error Handling middleware
app.use((error, _req, res, _) => {
  return error.data
    ? res.status(error.status).json({ message: error.message, data: error.data })
    : res.status(error.status).json({ message: error.message });
});

new Promise((resolve, _) => {
  resolve(app.listen(port, () => console.log(`server running on port ${port}`)));
}).then(_ => connectToDB());
