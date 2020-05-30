require("dotenv").config();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = user => {
  const message = {
    to: user.email,
    from: process.env.FROM_EMAIL,
    subject: "Plan-It-Make-It email verification",
    text: "This email was generated automatically",
    html: `
      <p style="font-size: 16px;
      font-family: 'Dosis', sans-serif;
      color: black">Hi, ${user.name}, please <a href="http://plan-it-make-it.herokuapp.com/api/user/${user.id}/verify?token=${user.verificationToken}">click here</a> to verify your email and activate your new account on Plan-It-Make-It</p>
    `,
  };
  return new Promise((resolve, reject) => {
    sgMail.send(message, (error, result) => {
      if (error) reject(error);
      resolve(result);
    });
  });
};

module.exports = { sendMail };
