const route = require("express").Router();
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

//Fetch a particular certificate template 
route.get("/2/:name", async (req, res) => {
  try {
    const datavalue = await template2.findAll({
      where:{certificate_id: req.params.name}
    });
    res.json(datavalue);
  } catch (err) {
    res.send("error" + err);
  }
});

//Uploads image
route.post("/imageupload", upload.single("certiimage"), async (req, res) => {
  console.log("file properties----------------------------");
  console.log(req.file);
  console.log("file name-------------");
  console.log(req.file.filename);
  let imgname = req.file.filename;
  res.send({ status: true, name: imgname });
});

//string opertaions image path and releveant things in template2 database
route.post("/template", async (req, res) => {
  paramaters={"customer_id":12,
  "image_url":"Url of image"};
  
  sum=Object.assign(req.body, paramaters)
  try{
    const temp = await template2.create(sum);
    res.send({ status: true });
  }
  catch(err){
    res.send("error"+err)
  }
});

//When done editing and when click on save this route will get hit
route.post('/template/edit', async (req, res) => {
  try {
    console.log(req.body);
    const { certificate_id, name, doctemp, operations, image_url } = req.body;

    const value = await template2.update(
      {
        name,
        doctemp,
        operations,
        image_url,
      },
      { where: { certificate_id } }
    );

    if (!value)
      return res.status(400).json({
        status: false,
        error: 'could not update template',
      });

    return res.status(200).json({
      status: true,
      value,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      status: false,
      err,
    });
  }
});

exports = module.exports = route;