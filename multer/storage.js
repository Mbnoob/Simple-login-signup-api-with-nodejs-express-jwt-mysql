const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads')
    },
    filename: async (req, file, cb) => {
        try {
          let current = new Date();
          let cDate =
            current.getFullYear() +
            "-" +
            (current.getMonth() + 1) +
            "-" +
            current.getDate();
          let cTime =
            current.getHours() +
            "-" +
            current.getMinutes() +
            "-" +
            current.getSeconds();
          let dateTime = cDate + "__" + cTime;
          const fileName = `${dateTime}_${file.originalname}`;
          cb(null, fileName);
        } catch (err) {
          console.log(err);
        }
      }
  })
  module.exports = { storage };
  