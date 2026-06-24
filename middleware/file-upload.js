const multer = require('multer');

const storage = multer.memoryStorage();

const fileUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    fieldSize: 10 * 1024 * 1024, // 10MB max field size (for large text fields)
    fields: 50 // max number of non-file fields
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

module.exports = fileUpload;
