const mongoose = require("mongoose");
const chalk = require("chalk");
const log = console.log;
require("dotenv").config();

const uri = process.env.MONGODB_URI;

const connectToDB = async () => {
  await mongoose.connect(
    uri,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
      useCreateIndex: true,
    },
    error => {
      if (error) log(chalk.red("error connecting to db"));
      else log(chalk.green("connected to mongodb"));
    },
  );
};

module.exports = connectToDB;
