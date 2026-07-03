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

      const client = await this.getTransporter();
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

      const mailOptions = {
        from: env.SMTP_FROM,
        to: customerEmail,
        subject,
        text: bodyText
      };

      const info = await client.sendMail(mailOptions);
      console.log(`📬 [Notification] Email sent for Order ${orderNo} | Status: ${status} | Msg ID: ${info.messageId}`);
      
      if (this.isMock && info.previewUrl) {
        console.log(`🔗 [Notification Mock Preview]: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      console.error('❌ [Notification] Email dispatch failed:', error.message);
    }
  }

  async sendVerificationOtp(email, name, otp) {
    try {
      const client = await this.getTransporter();
      const subject = 'Verify Your Last Mile Tracker Account';
      const bodyText = `Hello ${name},\n\nThank you for registering with Last Mile Delivery Tracker.\n\nYour 6-digit Email Verification OTP code is:\n\n👉  ${otp}  👈\n\nThis code will expire in 15 minutes.\n\nBest regards,\nLast Mile Delivery Team`;

      const mailOptions = {
        from: env.SMTP_FROM,
        to: email,
        subject,
        text: bodyText
      };

      const info = await client.sendMail(mailOptions);
      console.log(`📬 [Verification] OTP email sent to ${email} | Msg ID: ${info.messageId}`);
      if (this.isMock && info.previewUrl) {
        console.log(`🔗 [Verification Mock Preview]: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      console.error(`❌ [Verification] Failed to send OTP to ${email}:`, error.message);
    }
  }
}

export default new NotificationService();
