import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import orderRepository from '../repositories/orderRepository.js';

class NotificationService {
  constructor() {
    this.transporter = null;
    this.isMock = false;
  }

  /**
   * Lazily initialize Nodemailer transporter.
   */
  async getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    // 1. Check if real SMTP config exists in environment
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      console.log('📬 [Notification] Initializing SMTP mail transporter...');
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      this.isMock = false;
    } else {
      // 2. Set up mock Ethereal mail configuration for local testing
      console.log('📬 [Notification] SMTP config missing. Initializing mock mail transporter (Ethereal)...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        this.isMock = true;
        console.log(`📬 [Notification] Mock SMTP initialized. User: ${testAccount.user}`);
      } catch (err) {
        console.error('❌ [Notification] Failed to create mock SMTP account. Falling back to log-only transport.', err.message);
        // Log-only transport fallback
        this.transporter = {
          sendMail: async (options) => {
            console.log(`✉️ [Mailbox Log ONLY] To: ${options.to} | Subject: ${options.subject} | Text: ${options.text}`);
            return { messageId: 'log-only-id', previewUrl: null };
          }
        };
        this.isMock = true;
      }
    }

    return this.transporter;
  }

  /**
   * Universal email dispatcher supporting both Resend HTTP API and Nodemailer SMTP fallback.
   * @param {string} to 
   * @param {string} subject 
   * @param {string} text 
   */
  async sendEmail(to, subject, text) {
    // 1. SendGrid HTTP API Integration (Port 443 - Bypass Render Firewall)
    if (process.env.SENDGRID_API_KEY) {
      const apiKey = process.env.SENDGRID_API_KEY;
      // SendGrid expects verified raw email as sender address
      let fromEmail = env.SMTP_FROM || 'noreply@deliverytracker.com';
      if (fromEmail.includes('<')) {
        fromEmail = fromEmail.split('<')[1].replace('>', '').trim();
      }

      console.log(`📬 [SendGrid] Attempting HTTP API email dispatch to ${to} (Sender: ${fromEmail})...`);
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: to }]
            }],
            from: {
              email: fromEmail,
              name: 'Last Mile Tracker'
            },
            subject: subject,
            content: [{
              type: 'text/plain',
              value: text
            }]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `HTTP Status ${response.status}`);
        }

        console.log(`📬 [SendGrid] Email sent successfully via HTTP API to ${to}!`);
        return;
      } catch (error) {
        console.error(`❌ [SendGrid] HTTP API dispatch failed:`, error.message);
        console.log('🔄 [Notification] Falling back to standard SMTP / mock transporter...');
      }
    }

    // 2. Resend HTTP API Integration
    if (process.env.RESEND_API_KEY) {
      const apiKey = process.env.RESEND_API_KEY;
      let from = env.SMTP_FROM || 'onboarding@resend.dev';
      if (from === 'noreply@deliverytracker.com') {
        from = 'onboarding@resend.dev'; // Fallback to Resend onboarding sandbox email
      }
      
      console.log(`📬 [Resend] Attempting HTTP API email dispatch to ${to}...`);
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            from: from.includes('<') ? from : `"Last Mile Tracker" <${from}>`,
            to,
            subject,
            text
          })
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.message || JSON.stringify(resData));
        }

        console.log(`📬 [Resend] Email sent successfully via HTTP API! ID: ${resData.id}`);
        return;
      } catch (error) {
        console.error(`❌ [Resend] HTTP API dispatch failed:`, error.message);
        console.log('🔄 [Notification] Falling back to standard SMTP / mock transporter...');
      }
    }

    // Standard Nodemailer SMTP / Mock Fallback
    const client = await this.getTransporter();
    const mailOptions = {
      from: env.SMTP_FROM,
      to,
      subject,
      text
    };

    const info = await client.sendMail(mailOptions);
    console.log(`📬 [Notification] Email sent via SMTP to ${to} | Msg ID: ${info.messageId}`);
    if (this.isMock && info.previewUrl) {
      console.log(`🔗 [Notification Mock Preview]: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }

  /**
   * Send transactional email notifications on delivery status updates.
   * @param {string} orderId 
   */
  async sendOrderStatusEmail(orderId) {
    try {
      const order = await orderRepository.findById(orderId);
      if (!order || !order.customer) {
        console.error(`❌ [Notification] Order ${orderId} or customer details not found. Skipping email.`);
        return;
      }

      const customerEmail = order.customer.email;
      const customerName = order.customer.name;
      const orderNo = order.orderNumber;
      const status = order.status;

      let subject = `Delivery Update: Order ${orderNo} - ${status}`;
      let bodyText = `Hello ${customerName},\n\nYour order #${orderNo} has been updated to: ${status}.\n\n`;

      switch (status) {
        case 'CREATED':
          bodyText += 'Your order has been registered and will be matched with an agent shortly.';
          break;
        case 'ASSIGNED':
          bodyText += `An agent has been assigned to your order. Agent details: ${order.agent?.name || 'N/A'}`;
          break;
        case 'PICKED_UP':
          bodyText += 'Our agent has picked up your package and is moving towards the hub.';
          break;
        case 'IN_TRANSIT':
          bodyText += 'Your package is currently in transit between sorting centers.';
          break;
        case 'OUT_FOR_DELIVERY':
          bodyText += `Your package is out for local delivery! Please ensure someone is available at ${order.deliveryAddress}.`;
          break;
        case 'DELIVERED':
          bodyText += 'Congratulations! Your package has been successfully delivered.';
          break;
        case 'FAILED':
          const latestHistory = order.trackingHistory && order.trackingHistory.length > 0 
            ? order.trackingHistory[order.trackingHistory.length - 1] 
            : null;
          const failureReason = latestHistory?.notes || order.failedReason || 'Unspecified';
          if (failureReason.toLowerCase().includes('cancel')) {
            bodyText += `Your order has been cancelled by the administrator. Details: ${failureReason}`;
          } else {
            bodyText += `Delivery attempt failed. Reason: ${failureReason}. You can reschedule a delivery attempt from your dashboard.`;
          }
          break;
        case 'RESCHEDULED':
          bodyText += 'Your order has been successfully rescheduled for delivery.';
          break;
        default:
          bodyText += 'Your delivery order is being processed.';
      }

      bodyText += '\n\nBest regards,\nLast Mile Delivery Team';

      await this.sendEmail(customerEmail, subject, bodyText);
    } catch (error) {
      console.error('❌ [Notification] Email dispatch failed:', error.message);
    }
  }

  async sendVerificationOtp(email, name, otp) {
    try {
      const subject = 'Verify Your Last Mile Tracker Account';
      const bodyText = `Hello ${name},\n\nThank you for registering with Last Mile Delivery Tracker.\n\nYour 6-digit Email Verification OTP code is:\n\n👉  ${otp}  👈\n\nThis code will expire in 15 minutes.\n\nBest regards,\nLast Mile Delivery Team`;

      await this.sendEmail(email, subject, bodyText);
    } catch (error) {
      console.error(`❌ [Verification] Failed to send OTP to ${email}:`, error.message);
    }
  }
}

export default new NotificationService();
