const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

function buildUpload({ subfolder, allowedMimeTypes, maxFileSize }) {
  const uploadsRoot = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', '..', 'uploads'));
  const uploadDir = path.join(uploadsRoot, subfolder);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${extension}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type.'), false);
    }
    return cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
    },
  });
}

module.exports = { buildUpload };
