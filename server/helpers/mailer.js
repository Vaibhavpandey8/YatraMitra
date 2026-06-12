const nodeMailer = require("nodemailer");

exports.sendEmail = emailData => {
  const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.userEmail,
      pass: process.env.userPass
    },
    tls: {
      rejectUnauthorized: false
    },
    family: 4,          // Force IPv4 — avoids IPv6 ETIMEDOUT issues
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });
  return transporter
    .sendMail(emailData)
    .then(info => console.log(`Message sent: ${info.response}`))
    .catch(err => console.log(`Problem sending email: ${err}`));
};