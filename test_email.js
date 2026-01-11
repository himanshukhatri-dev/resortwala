const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, 'prod.env');
console.log('Reading .env from:', envPath);
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.replace(/\r\n/g, '\n').split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx !== -1) {
        const key = line.substring(0, idx).trim();
        let val = line.substring(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        env[key] = val;
    }
});

console.log('Parsed Config:');
console.log('MAIL_HOST:', `[${env.MAIL_HOST}]`);
console.log('MAIL_PORT:', `[${env.MAIL_PORT}]`);
console.log('MAIL_USERNAME:', `[${env.MAIL_USERNAME}]`);
console.log('MAIL_ENCRYPTION:', `[${env.MAIL_ENCRYPTION}]`);

const port = parseInt(env.MAIL_PORT);
const secure = (env.MAIL_ENCRYPTION === 'ssl' || port === 465);

console.log(`Creating transport: host=${env.MAIL_HOST}, port=${port}, secure=${secure}`);

const transporter = nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: port,
    secure: secure,
    auth: {
        user: env.MAIL_USERNAME,
        pass: env.MAIL_PASSWORD
    }
});

const mailOptions = {
    from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_ADDRESS}>`,
    to: 'support@resortwala.com',
    subject: 'ResortWala SMTP Test (Debug)',
    text: 'Testing SMTP credentials.'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('--- SEND ERROR ---');
        console.error(error);
    } else {
        console.log('--- SUCCESS ---');
        console.log('Message ID:', info.messageId);
    }
});
