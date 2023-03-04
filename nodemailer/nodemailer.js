let nodemailer = require("nodemailer");
//let path = require("path");
//let hbs = require("nodemailer-express-handlebars");
//let express = require("express");
let ejs = require("ejs");
const path = require("path");

sendEmail = (email, subject, text) => {
  let transporter = nodemailer.createTransport({
    host: process.env.HOST,
    service: process.env.SERVICE,
    port: 587,
    secure: true,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

  ejs.renderFile(path.resolve("./views/verify.ejs"), { email, text }, (err, data) => { //test
    if (err) {
      throw new ExpressError("An error occured", 400);
    } else {
      var mailOptions = {
        from: process.env.USER,
        to: email,
        subject: subject,
        html: data
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          throw new ExpressError("An error occured", 400);
        }
      });
    }
  });
};

sendEmailPw = (email, subject, text) => {
  let transporter = nodemailer.createTransport({
    host: process.env.HOST,
    service: process.env.SERVICE,
    port: 587,
    secure: true,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

  ejs.renderFile(path.resolve("./views/emailpw.ejs"), { email, text }, (err, data) => {
    if (err) {
      throw new ExpressError("An error occured", 400);
    } else {
      var mailOptions = {
        from: process.env.USER,
        to: email,
        subject: subject,
        html: data
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          throw new ExpressError("An error occured", 400);
        }
      });
    }
  });
};

module.exports = sendEmail;