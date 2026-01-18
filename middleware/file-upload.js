const multer = require('multer');

const storage = multer.memoryStorage();

const fileUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB file size limit
  },
});

module.exports = fileUpload;
