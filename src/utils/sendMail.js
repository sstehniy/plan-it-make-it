require("dotenv").config();
const nodeMailer = require("nodemailer");

const transporter = nodeMailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.FROM_EMAIL,
    pass: process.env.FROM_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendMail = user => {
  const message = {
    to: user.email,
    from: process.env.FROM_EMAIL,
    subject: "Plan-It-Make-It email verification",

    html: `
      <p style="font-size: 16px;
      font-family: sans-serif;
      color: black">Hi, ${user.name}, please <a href="https://plan-it-make-it.herokuapp.com/api/user/${user.id}/verify?token=${user.verificationToken}">click here</a> to verify your email and activate your new account on Plan-It-Make-It</p>
    `,
  };
  return new Promise((resolve, reject) => {
    transporter.sendMail(message, (error, result) => {
      if (error) {
        console.log(error);
        reject(error);
      }
      resolve(result);
    });
  });
};

module.exports = { sendMail };
