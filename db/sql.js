const sequelize = require('sequelize');
const{MYSQL_DATABASE,MYSQL_USER,MYSQL_ROOT_PASSWORD,DB_HOST}=require('../env');

const db = new sequelize(
  MYSQL_DATABASE,
  MYSQL_USER,
  MYSQL_ROOT_PASSWORD,
  {
    dialect: 'mysql',
    host: DB_HOST,
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      timezone: '+05:30',
      multipleStatements: true,
    },
    timezone: '+05:30',
    operatorsAliases: false,
  }
);

db.authenticate()
  .then(() => {
    console.log('Database Connected Successfully');
  })
  .catch((e) => {
    console.log(e,'ERROR DATABASE NOT CONNECTED');
  });

module.exports = { db };