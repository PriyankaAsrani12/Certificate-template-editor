const express = require("express");
const app = express();
const path = require("path");
// const mongoose = require("mongoose");
const morgan = require('morgan')
const template2=require('./models/certificate')
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
app.use("/edit/:id", express.static(path.join(__dirname, "/edit")));

// app.get('/edit/:id', async (req, res) =>
//   res.sendFile(path.join(__dirname, '/edit/index.html'))
// );


app.get('/findAll', async (req, res) => {
    try {
      const result = await template2.findAll(
        {
          attributes: ['image_url', 'certificate_id', 'name'],
        },
      );
      if (!result)
        return res.status(400).json({
          success: 0,
          error: 'Failed to fetch certificates',
        });
      return res.status(200).json({
        success: 1,
        certificates: result,
      });
    } catch (e) {
      console.log(e);
      return res.status(400).json({
        success: 0,
        error: 'Could not fetch certificates',
        errorReturned: JSON.stringify(e),
      });
    }
});
  
app.get('/delete/:id', async (req, res) => {
    try {
      if (!req.params.id)
        return res.status(400).json({
          success: 0,
          error: 'Certificate id not provided',
        });
      const result = await template2.destroy({
        where: {
          certificate_id: req.params.id,
        },
      });
      if (!result)
        return res.status(400).json({
          success: 0,
          error: 'failed to delete template',
        });
      return res.status(200).json({
        success: 1,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: 0,
        error: 'Unable to delete template',
        errorReturned: JSON.stringify(err),
      });
    }
});

//this line execute index.js in api folder
app.use("/api", require("./routes/index").route);
app.listen(3434);
