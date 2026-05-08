import { google } from 'googleapis';

export interface GmailMessage {
    id: string;
    threadId: string;
    snippet: string;
    internalDate: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    isUnread: boolean;
    bodyHtml?: string;
    bodyText?: string;
    messageIdHeader?: string;
}

export class GmailService {
    private oauth2Client;
    private gmail;

    constructor() {
        // Initialize the OAuth2 client
        // You will need to set these in your .env.local file:
        // GOOGLE_CLIENT_ID
        // GOOGLE_CLIENT_SECRET
        // GOOGLE_REFRESH_TOKEN
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            // A redirect URI is required by the constructor but not used for server-to-server with a refresh token
            'https://developers.google.com/oauthplayground'
        );

        // Set the refresh token
        this.oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        // Initialize the Gmail API client
        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }

    /**
     * Get a list of recent emails
     */
    async getRecentEmails(maxResults = 20): Promise<GmailMessage[]> {
        try {
            // Check if credentials exist before making API call
            if (!process.env.GOOGLE_REFRESH_TOKEN) {
                console.warn("Gmail API not configured: GOOGLE_REFRESH_TOKEN missing.");
                return [];
            }

            const response = await this.gmail.users.messages.list({
                userId: 'me',
                maxResults,
                q: '-in:chats to:@nilathra.com -to:admin@nilathra.com -to:champikanirosh@gmail.com', // Filter to only show emails forwarded via the @nilathra.com domain, excluding specific addresses
            });

            const messages = response.data.messages || [];
            if (messages.length === 0) return [];

            // Fetch details for each message
            const detailedMessages = await Promise.all(
                messages.map((msg) => this.getMessageDetails(msg.id!))
            );

            // Filter out nulls, apply strict recipient rules, and sort by date descending
            return detailedMessages
                .filter((msg): msg is GmailMessage => msg !== null)
                .filter(msg => {
                    const toLower = msg.to.toLowerCase();
                    return toLower.includes('@nilathra.com') && 
                           !toLower.includes('admin@nilathra.com') && 
                           !toLower.includes('champikanirosh@gmail.com');
                })
                .sort((a, b) => Number(b.internalDate) - Number(a.internalDate));
                
        } catch (error) {
            console.error('Error fetching recent emails:', error);
            return [];
        }
    }

    /**
     * Get details for a specific message
     */
    async getMessageDetails(messageId: string): Promise<GmailMessage | null> {
        try {
            const response = await this.gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full', // Request full format to get headers and body
            });

            const data = response.data;
            const headers = data.payload?.headers || [];

            // Extract specific headers
            const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
            const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
            const to = headers.find(h => h.name?.toLowerCase() === 'to')?.value || '';
            const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';
            const messageIdHeader = headers.find(h => h.name?.toLowerCase() === 'message-id')?.value || '';

            // Determine if unread
            const isUnread = data.labelIds?.includes('UNREAD') || false;

            // Extract body parts (can be nested in multipart emails)
            let bodyHtml = '';
            let bodyText = '';

            const extractBody = (part: any) => {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    bodyText += Buffer.from(part.body.data, 'base64').toString('utf-8');
                } else if (part.mimeType === 'text/html' && part.body?.data) {
                    bodyHtml += Buffer.from(part.body.data, 'base64').toString('utf-8');
                } else if (part.parts) {
                    part.parts.forEach(extractBody);
                }
            };

            if (data.payload) {
                extractBody(data.payload);
            }

            return {
                id: data.id!,
                threadId: data.threadId!,
                snippet: data.snippet || '',
                internalDate: data.internalDate || '0',
                subject,
                from,
                to,
                date,
                isUnread,
                bodyHtml,
                bodyText,
                messageIdHeader
            };
        } catch (error) {
            console.error(`Error fetching message details for ${messageId}:`, error);
            return null;
        }
    }

    /**
     * Mark an email as read
     */
    async markAsRead(messageId: string): Promise<boolean> {
        try {
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });
            return true;
        } catch (error) {
            console.error(`Error marking message ${messageId} as read:`, error);
            return false;
        }
    }

    /**
     * Reply to an email
     */
    async replyToEmail(threadId: string, to: string, subject: string, originalMessageId: string, replyHtml: string): Promise<boolean> {
        try {
            // Ensure subject has Re:
            const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
            const utf8Subject = `=?utf-8?B?${Buffer.from(replySubject).toString('base64')}?=`;
            
            const messageParts = [
                `To: ${to}`,
                `Subject: ${utf8Subject}`,
                'Content-Type: text/html; charset=utf-8',
                'MIME-Version: 1.0'
            ];
            
            if (originalMessageId) {
                messageParts.push(`In-Reply-To: ${originalMessageId}`);
                messageParts.push(`References: ${originalMessageId}`);
            }
            
            messageParts.push('', replyHtml);
            const message = messageParts.join('\n');

            // Base64url encode
            const encodedMessage = Buffer.from(message)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage,
                    threadId: threadId
                }
            });

            return true;
        } catch (error) {
            console.error('Error replying to email:', error);
            return false;
        }
    }
}

// Export singleton instance
export const gmailService = new GmailService();
