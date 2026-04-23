const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!env.mailHost && env.mailUser && env.mailPass) {
    // If host is omitted but credentials exist, default to Gmail SMTP.
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.mailUser,
        pass: env.mailPass,
      },
    });
    return transporter;
  }

  if (env.mailHost && env.mailUser && env.mailPass) {
    transporter = nodemailer.createTransport({
      host: env.mailHost,
      port: env.mailPort,
      secure: env.mailSecure,
      auth: {
        user: env.mailUser,
        pass: env.mailPass,
      },
    });
    return transporter;
  }

  // Development fallback transport; logs email payload instead of real delivery.
  transporter = nodemailer.createTransport({ jsonTransport: true });
  return transporter;
};

const sendEmail = async ({ to, subject, html, text, attachments }) => {
  if (!to) {
    return null;
  }

  const mailer = getTransporter();
  const info = await mailer.sendMail({
    from: env.mailFrom,
    to,
    subject,
    html,
    text,
    attachments: attachments || [],
  });

  if (!env.mailHost && !(env.mailUser && env.mailPass)) {
    // eslint-disable-next-line no-console
    console.log('Email preview (no SMTP configured):', info.message || info);
  }

  return info;
};

module.exports = sendEmail;
