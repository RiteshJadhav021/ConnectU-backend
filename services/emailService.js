const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with your email
    pass: process.env.EMAIL_PASS || 'your-app-password'     // Replace with your app password
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: email,
    subject: 'ConnectU - Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome to ConnectU!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for signing up with ConnectU. To complete your registration, please use the following One-Time Password (OTP):</p>
        
        <div style="background-color: #f8fafc; border: 2px dashed #4f46e5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4f46e5; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
        </div>
        
        <p style="color: #ef4444; font-weight: bold;">⚠️ This OTP will expire in 5 minutes.</p>
        <p>If you did not request this verification, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="text-align: center; color: #6b7280; font-size: 14px;">
          Best regards,<br>
          <strong>ConnectU Team</strong>
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail
};