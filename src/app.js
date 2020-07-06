const express = require("express");
const path = require("path");
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
app.use(express.static(path.join(__dirname, "../build")));
morganBody(app, {
  dateTimeFormat: "clf",
  logReqUserAgent: false,
  theme: "lightened",
});

app.use("/api/register", registerRouter);
app.use("/api/login", loginRouter);
app.use("/api/user", userRouter);
app.use("/api/folders", folderRouter);
app.use("/api/invitation", invitationRouter);

// * Unknown endpoint
app.use("/*", function (_req, res) {
  res.sendFile(path.join(__dirname, "../build/index.html"), function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
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

/*
  * instructions to run in dev mod:
   ! - replace anchor-tag in sendMail html template to http://localhost:5001/...
   ! - make sure to delete 'app.use(express.static(path.join(__dirname, "../build")))' in app.js
   ! - change controllers/users.js to redirect to http://localhost:3000 in email verification route
*/

/* 
  * instructions to run in deployment mod:
   ! - replace anchor-tag in sendMail html template to https://plan-it-make-it.herokuapp.com/...
   ! - make sure to add 'app.use(express.static(path.join(__dirname, "../build")))' before all routes middleware applied in app.js
   ! - change controllers/users.js to redirect to https://plan-it-make-it.herokuapp.com in email verification route
*/
