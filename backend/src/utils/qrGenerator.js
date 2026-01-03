const QRCode = require('qrcode');

async function generateQrDataUrl(data) {
  return QRCode.toDataURL(data, { margin: 1, width: 300 });
}

module.exports = { generateQrDataUrl };
