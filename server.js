require("dotenv").config();
const express = require("express");
const body_parser = require("body-parser");
const app = express();
const path = require("path");
const session = require('express-session');
const cookieParser = require('cookie-parser')
const flash = require('connect-flash');

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use(cookieParser())
app.use(flash());

app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: true
}))

//All Routers...............
const router = require("./router/router");

//All Handellers......
app.use("/", router);

//Define Ports......
app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server is Connected on Port No. ${process.env.PORT}🎑🎐🎐`);
  }
});
