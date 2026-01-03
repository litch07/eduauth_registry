const fs = require('fs');
const path = require('path');

function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
}

function toPublicUploadPath(filePath) {
  if (!filePath) return null;
  const uploadsRoot = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', '..', 'uploads'));
  const normalizedRoot = uploadsRoot.replace(/\\/g, '/');
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (normalizedPath.startsWith(normalizedRoot)) {
    const relative = normalizedPath.slice(normalizedRoot.length);
    return `/uploads${relative}`;
  }
  return filePath;
}

function toAbsoluteUploadPath(publicPath) {
  if (!publicPath) return null;
  const uploadsRoot = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', '..', 'uploads'));
  if (publicPath.startsWith('/uploads')) {
    const relative = publicPath.replace('/uploads', '');
    return path.join(uploadsRoot, relative);
  }
  return publicPath;
}

module.exports = { safeUnlink, toPublicUploadPath, toAbsoluteUploadPath };
