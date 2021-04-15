const route = require("express").Router();
// const template = require("../schema");
//const template2 = require("../schema2");
const template2 = require("../models/certificate");

//----------------------------------------------multer---------------------------------
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});

const filefilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("file type does not support"), false);
  }
};
const upload = multer({
  storage: storage,
  limits: {
    FileSize: 1824 * 1024 * 5,
  },
  fileFilter: filefilter,
});

//------------------Route requests------------------------------------------

// route.get("/", async (req, res) => {
//   try {
//     const datavalues = await template.find();
//     res.json(datavalues);
//   } catch (err) {
//     res.send("error" + err);
//   }
// });
route.get("/2", async (req, res) => {
  try {
    const datavalues = await template2.find();
    res.json(datavalues);
  } catch (err) {
    res.send("error" + err);
  }
});

route.get("/2/:name", async (req, res) => {
  try {
    // const datavalue = await htmlthemes.findById(req.params.id);
    const datavalue = await template2.findOne({
      "temp.name": req.params.name,
    });
    res.json(datavalue);
  } catch (err) {
    res.send("error" + err);
  }
});

route.post("/imageupload", upload.single("certiimage"), async (req, res) => {
  console.log("file properties----------------------------");
  console.log(req.file);
  console.log("file name-------------");
  console.log(req.file.filename);
  let imgname = req.file.filename;
  res.send({ status: true, name: imgname });
  //add new products
  // const value = new template({ temp: req.body });
  // try {
  //   const v1 = await value.save();
  //   res.json(v1);
  // } catch (err) {
  //   res.send(err);
  //   console.log(err);
  // }
});

//string opertaions image path and releveant things in template2 database
route.post("/template", async (req, res) => {
  //console.log(req.body);
  paramaters={"customer_id":12,
  "image_url":"Url of image"};
  
  sum=Object.assign(req.body, paramaters)
  const temp = await template2.create(sum);
  res.send({ status: true });
  // const value = new template2({ temp: req.body });
  // try {
  //   const v1 = await value.save();
  //   res.json(v1);
  // } catch (err) {
  //   res.send(err);
  //   console.log(err);
  // }
});

// route.post("/store/:themeid", async (req, res) => {
//   try {
//     const datavalue = await htmlthemes.updateOne(
//       {
//         themeid: req.params.themeid,
//       },
//       { html: req.body.html, css: req.body.css }
//     );

//     res.json(datavalue);
//   } catch (err) {
//     res.send(err);
//     console.log(err);
//   }
// });

exports = module.exports = route;
