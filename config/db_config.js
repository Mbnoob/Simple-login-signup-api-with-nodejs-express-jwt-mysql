const mysql = require("mysql");

const myconnections = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  DB_PORT: process.env.DB_PORT,
});

myconnections.connect((err) => {
  if (!err) {
    console.log("🎊Database Connected Sucessfully 🎉");
  } else {
    console.log(err);
  }
});

module.exports = myconnections;