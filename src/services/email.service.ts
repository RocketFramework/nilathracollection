import nodemailer from 'nodemailer';

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    /**
     * Send an email using standard configured settings
     */
    async sendEmail(options: SendEmailOptions) {
        const fromAddress = options.from || process.env.EMAIL_FROM || process.env.SMTP_USER;

        if (!fromAddress) {
            throw new Error('No sender address (from) configured for email service.');
        }

        const mailOptions = {
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    /**
     * Verify SMTP connection configuration
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('SMTP Server connection verified successfully');
            return true;
        } catch (error) {
            console.error('SMTP Server connection failed:', error);
            return false;
        }
    }
}

// Export a singleton instance for direct use
export const emailService = new EmailService();
