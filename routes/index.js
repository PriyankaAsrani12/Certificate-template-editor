const route = require("express").Router();

//now it will use api/database/{routes}
route.use("/database", require("./database"));

exports = module.exports = {
  route,
};
