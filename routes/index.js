const route = require("express").Router();

route.use("/database", require("./database"));
// route.use("/databasenewsletter", require("./databasenewsletter"));

exports = module.exports = {
  route,
};
