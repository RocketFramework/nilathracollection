import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    for (const line of envLines) {
        if (line.trim() && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
            }
        }
    }
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

async function verify() {
    console.log('Verifying SMTP connection...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('User:', process.env.SMTP_USER);
    try {
        const success = await transporter.verify();
        if (success) {
            console.log('✅ SMTP connection successful!');
            /* Uncomment to send a test email
            const info = await transporter.sendMail({
              from: process.env.EMAIL_FROM,
              to: process.env.SMTP_USER, // sending it to ourselves
              subject: 'Test Email from Nilathra Collection',
              text: 'This is a test email to verify SMTP configuration.',
            });
            console.log('Test email sent: ' + info.messageId);
            */
        }
    } catch (error) {
        console.error('❌ SMTP connection failed:', error);
    }
}

verify();
