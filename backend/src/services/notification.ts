import axios from 'axios';

interface NotificationOptions {
  phone: string;
  name: string;
  status: 'approved' | 'rejected';
  email?: string;
  password?: string;
}

class NotificationService {
  private authKey: string;
  private senderId: string;
  private whatsappSenderId: string;
  private lmsUrl: string;

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY || '';
    this.senderId = process.env.MSG91_SENDER_ID || 'LMSAPP';
    this.whatsappSenderId = process.env.MSG91_WHATSAPP_SENDER_ID || 'LMSAPP';
    this.lmsUrl = process.env.LMS_URL || 'http://localhost:3000';
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    if (!this.authKey || !phone) {
      console.log('SMS skipped: Missing auth key or phone');
      return false;
    }

    try {
      const response = await axios.get('https://api.msg91.com/api/v5/sendsms', {
        params: {
          authkey: this.authKey,
          mobiles: `91${phone}`,
          message: message,
          sender: this.senderId,
          route: '4',
        },
        timeout: 10000,
      });

      if (response.data.type === 'success') {
        console.log(`SMS sent successfully to ${phone}`);
        return true;
      }
      console.log(`SMS failed: ${response.data.message}`);
      return false;
    } catch (error: any) {
      console.error('SMS sending failed:', error.message);
      return false;
    }
  }

  async sendWhatsApp(phone: string, templateName: string, parameters: string[]): Promise<boolean> {
    if (!this.authKey || !phone) {
      console.log('WhatsApp skipped: Missing auth key or phone');
      return false;
    }

    try {
      const response = await axios.post(
        'https://api.msg91.com/api/v5/whatsapp/send-template',
        {
          authkey: this.authKey,
          whtasappTemplate: {
            to: `91${phone}`,
            template: {
              name: templateName,
              namespace: 'your_namespace_here',
              language: { code: 'en' },
              components: {
                body: parameters.map(param => ({ type: 'text', text: param })),
              },
            },
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      if (response.data.type === 'success') {
        console.log(`WhatsApp sent successfully to ${phone}`);
        return true;
      }
      console.log(`WhatsApp failed: ${response.data.message}`);
      return false;
    } catch (error: any) {
      console.error('WhatsApp sending failed:', error.message);
      return false;
    }
  }

  async notifyStudent(options: NotificationOptions): Promise<void> {
    const { phone, name, status, email, password } = options;

    if (!phone) {
      console.log('Notification skipped: No phone number');
      return;
    }

    const cleanName = name.trim();

    if (status === 'approved') {
      const smsMessage = `Dear ${cleanName}, your registration has been APPROVED! Login credentials - Email: ${email}, Password: ${password}. Visit ${this.lmsUrl}/login to login.`;
      await this.sendSMS(phone, smsMessage);
      
      await this.sendWhatsApp(phone, 'registration_approved', [cleanName, email || '', password || '']);
    } else {
      const smsMessage = `Dear ${cleanName}, your registration has been REJECTED. Please contact the admin for more information.`;
      await this.sendSMS(phone, smsMessage);
      
      await this.sendWhatsApp(phone, 'registration_rejected', [cleanName]);
    }
  }
}

export const notificationService = new NotificationService();
