import nodemailer from 'nodemailer';

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    attachments?: { filename: string; content?: Buffer | string; path?: string; contentType?: string }[];
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
            attachments: options.attachments,
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
     * Helper to generate standard Nilathra branded email template
     */
    generateEmailHtml(headline: string, preheader: string, contentHtml: string) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${preheader}</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EF;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#1B3A2D;padding:36px 48px;text-align:center;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;">Nilathra Collection</p>
              <h1 style="margin:12px 0 0;font-size:26px;font-weight:400;color:#ffffff;font-style:italic;">${headline}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F5F3EF;padding:28px 48px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Nilathra Collection · Luxury Unfiltered</p>
              <p style="margin:0;font-size:11px;color:#c3c3c3;">Colombo, Sri Lanka · <a href="https://www.nilathra.com" style="color:#C9A84C;text-decoration:none;">nilathra.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }

    /**
     * Notify the customer that an agent has been assigned to their request
     */
    async sendAgentAssignedEmail(options: {
        customerEmail: string;
        customerName: string;
        agentName: string;
        requestId: string;
        packageName?: string;
    }) {
        const { customerEmail, customerName, agentName, requestId, packageName } = options;

        const subject = `Your Request Has Been Assigned – Nilathra Collection`;

        const contentHtml = `
              <p style="margin:0 0 24px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Dear ${customerName},
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                We are delighted to inform you that your travel request${packageName ? ` for <strong>${packageName}</strong>` : ''} has been reviewed and a dedicated travel specialist has been personally assigned to curate your Sri Lankan experience.
              </p>

              <!-- Agent Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EF;border-left:3px solid #C9A84C;border-radius:4px;margin:28px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;">Your Assigned Specialist</p>
                    <p style="margin:0;font-size:20px;font-weight:600;color:#1B3A2D;">${agentName}</p>
                    <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Nilathra Collection – Travel Design Expert</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                <strong>${agentName}</strong> will be reaching out to you shortly to discuss the finer details of your itinerary, preferred experiences, and any special requirements you may have. Please keep an eye on your inbox.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                In the meantime, should you have any urgent questions, please do not hesitate to contact us directly at <a href="mailto:concierge@nilathra.com" style="color:#C9A84C;text-decoration:none;font-weight:600;">concierge@nilathra.com</a> or via WhatsApp at <a href="https://wa.me/94777278282" style="color:#C9A84C;text-decoration:none;font-weight:600;">+94 77 727 8282</a>.
              </p>

              <!-- Reference -->
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;">Reference</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;font-family:monospace;">${requestId}</p>
`;

        const html = this.generateEmailHtml('Your Journey is in Expert Hands', 'Agent Assigned', contentHtml);

        const text = `Dear ${customerName},\n\nYour travel request has been assigned to ${agentName}, your dedicated travel specialist at Nilathra Collection.\n\n${agentName} will be contacting you shortly to begin curating your Sri Lankan journey.\n\nFor urgent enquiries, please reach us at concierge@nilathra.com or WhatsApp +94 77 727 8282.\n\nRequest Reference: ${requestId}\n\nWarm regards,\nNilathra Collection`;

        return this.sendEmail({ to: customerEmail, subject, html, text });
    }

    /**
     * Notify the customer of a status update on their request
     */
    async sendRequestStatusUpdateEmail(options: {
        customerEmail: string;
        customerName: string;
        newStatus: string;
        requestId: string;
        packageName?: string;
        statusNote?: string;
    }) {
        const { customerEmail, customerName, newStatus, requestId, packageName, statusNote } = options;

        const statusMessages: Record<string, { headline: string; body: string; color: string }> = {
            'Pending': {
                headline: 'We Have Received Your Request',
                body: 'Your travel request has been received and is currently under review by our concierge team. We will notify you as soon as a specialist is assigned to your journey.',
                color: '#D97706',
            },
            'Assigned': {
                headline: 'Your Request is Being Planned',
                body: 'A dedicated travel specialist has been assigned to your request and is actively working on crafting your bespoke Sri Lankan itinerary. You will hear from us very soon.',
                color: '#2563EB',
            },
            'Active': {
                headline: 'Your Tour is Now Active',
                body: 'Wonderful news — your tour is now officially active and in full planning mode. Your specialist is finalising all the details to ensure your journey exceeds every expectation.',
                color: '#16A34A',
            },
            'Completed': {
                headline: 'Your Journey Has Been Completed',
                body: 'We hope your Sri Lankan experience was everything you dreamed of and more. It has been our honour to curate this journey for you. We would love to hear your feedback.',
                color: '#1B3A2D',
            },
            'Cancelled': {
                headline: 'Your Request Has Been Cancelled',
                body: 'Your travel request has been marked as cancelled. If this was done in error or you would like to revisit your plans, please do not hesitate to get in touch with us.',
                color: '#DC2626',
            },
        };

        const statusInfo = statusMessages[newStatus] || {
            headline: `Request Update: ${newStatus}`,
            body: 'There has been an update to your travel request. Please contact us for more details.',
            color: '#1B3A2D',
        };

        const subject = `Travel Request Update: ${statusInfo.headline} – Nilathra Collection`;

        const contentHtml = `
              <div style="background:${statusInfo.color};padding:14px 48px;text-align:center;margin:-48px -48px 48px -48px;">
                <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;">Status Updated: ${newStatus}</p>
              </div>
              <p style="margin:0 0 24px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Dear ${customerName},
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                ${statusInfo.body}
              </p>
              ${packageName ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EF;border-left:3px solid #C9A84C;border-radius:4px;margin:28px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;">Your Journey</p>
                    <p style="margin:0;font-size:18px;font-weight:600;color:#1B3A2D;">${packageName}</p>
                  </td>
                </tr>
              </table>` : ''}
              ${statusNote ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:4px;margin:24px 0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#92400e;">Note from Your Specialist</p>
                    <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${statusNote}</p>
                  </td>
                </tr>
              </table>` : ''}
              <p style="margin:24px 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                For any questions, please reach our concierge team at <a href="mailto:concierge@nilathra.com" style="color:#C9A84C;text-decoration:none;font-weight:600;">concierge@nilathra.com</a> or via WhatsApp at <a href="https://wa.me/94777278282" style="color:#C9A84C;text-decoration:none;font-weight:600;">+94 77 727 8282</a>.
              </p>

              <!-- Reference -->
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;">Request Reference</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;font-family:monospace;">${requestId}</p>
`;

        const html = this.generateEmailHtml(statusInfo.headline, 'Request Update', contentHtml);

        const text = `Dear ${customerName},\n\n${statusInfo.body}${statusNote ? `\n\nNote: ${statusNote}` : ''}\n\nRequest Status: ${newStatus}${packageName ? `\nJourney: ${packageName}` : ''}\n\nFor enquiries: concierge@nilathra.com | WhatsApp +94 77 727 8282\n\nRequest Reference: ${requestId}\n\nWarm regards,\nNilathra Collection`;

        return this.sendEmail({ to: customerEmail, subject, html, text });
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
