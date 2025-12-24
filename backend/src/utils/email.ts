import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    if (!config.email.user || !config.email.password) {
      console.warn('Email not configured. Skipping email send.');
      return false;
    }
    
    const mailOptions = {
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const verificationUrl = `${config.frontend.url}/auth/verify?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Verify Your Email Address</h1>
          <p>Thank you for signing up for Daily Task Manager!</p>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Daily Task Manager',
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const resetUrl = `${config.frontend.url}/auth/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Reset Your Password</h1>
          <p>You requested to reset your password for Daily Task Manager.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Daily Task Manager',
    html,
  });
};

export const sendTaskReminderEmail = async (
  email: string,
  taskTitle: string,
  reminderTime: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Task Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Task Reminder</h1>
          <p>This is a reminder for your task:</p>
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin: 0; color: #1F2937;">${taskTitle}</h2>
            <p style="margin: 10px 0 0 0; color: #6B7280;">Scheduled for: ${reminderTime}</p>
          </div>
          <p>Don't forget to complete this task!</p>
          <a href="${config.frontend.url}/dashboard" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            View Dashboard
          </a>
        </div>
      </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: `Reminder: ${taskTitle}`,
    html,
  });
};


