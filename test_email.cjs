const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function run() {
    try {
        console.log(`Sending test email using ${process.env.SMTP_USER}`);
        const info = await transporter.sendMail({
          from: `"Alerta Criminal Teste" <${process.env.SMTP_USER}>`,
          to: 'viciowins@gmail.com',
          subject: 'Teste Direto',
          html: '<h1>Funcionou!</h1>',
        });
        console.log("E-mail enviado: %s", info.messageId);
    } catch (e) {
        console.error('Failed to send', e);
    }
}
run();
