const express = require("express");
const app = express();
const path = require("path");
// const mongoose = require("mongoose");
const morgan = require('morgan')
require('./db/sql');
// const url = "mongodb://localhost/db";
// const url ="mongodb://localhost:27017/certificate";
// mongoose.connect(url, { useNewUrlParser: true });

// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "/themes/views"));
// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


// const con = mongoose.connection;
// con.on("open", () => {
//   console.log("connected");
// });
app.use("/", express.static(path.join(__dirname, "/public")));
//this line execute index.js in api folder
app.use("/api", require("./routes/index").route);
app.listen(3434);
