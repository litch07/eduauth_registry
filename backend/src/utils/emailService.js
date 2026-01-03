const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendEmail({ to, subject, html }) {
  if (!to) {
    throw new Error('Email recipient missing');
  }

  const from = process.env.EMAIL_FROM || `EduAuth Registry <${process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };
