const nodemailer = require('nodemailer');
const { supabaseAdmin } = require('./supabaseClient');

// Email transporter configuration
let transporter;

// Initialize email transporter
const initializeTransporter = () => {
  // Configure based on environment variables
  const emailConfig = {
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  // For development, use ethereal email or console logging
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log('Email service running in development mode - emails will be logged to console');
    return null;
  }

  try {
    transporter = nodemailer.createTransport(emailConfig);
    console.log('Email service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize email service:', error.message);
    transporter = null;
  }
};

// Send email function
const sendEmail = async ({
  to,
  subject,
  text,
  html,
  from = process.env.FROM_EMAIL || 'noreply@ev-community.com',
  template = null,
  templateData = {}
}) => {
  try {
    // If no transporter (development mode), log to console
    if (!transporter) {
      console.log('📧 Email would be sent:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      if (html) console.log(`HTML: ${html}`);
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    // Prepare email content
    let emailContent = { text, html };
    
    // If template is specified, use it
    if (template) {
      emailContent = await generateEmailFromTemplate(template, templateData);
    }

    const mailOptions = {
      from,
      to,
      subject,
      ...emailContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log email sent
    await logEmailSent({
      to,
      subject,
      messageId: info.messageId,
      status: 'sent'
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Failed to send email:', error.message);
    
    // Log email failed
    await logEmailSent({
      to,
      subject,
      status: 'failed',
      error: error.message
    });

    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Generate email from template
const generateEmailFromTemplate = async (template, data) => {
  const templates = {
    welcome: {
      subject: 'Welcome to EV Community!',
      html: `
        <h1>Welcome ${data.username}!</h1>
        <p>Thank you for joining our EV Community platform.</p>
        <p>You can now:</p>
        <ul>
          <li>Share your EV experiences</li>
          <li>Connect with other EV enthusiasts</li>
          <li>Find charging stations</li>
          <li>Buy and sell EV-related items</li>
        </ul>
        <p><a href="${data.loginUrl}">Login to your account</a></p>
      `,
      text: `Welcome ${data.username}! Thank you for joining our EV Community platform.`
    },
    
    passwordReset: {
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>Hi ${data.username},</p>
        <p>You requested a password reset for your EV Community account.</p>
        <p><a href="${data.resetUrl}">Click here to reset your password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      text: `Hi ${data.username}, you requested a password reset. Visit: ${data.resetUrl}`
    },
    
    emailVerification: {
      subject: 'Verify Your Email Address',
      html: `
        <h1>Email Verification</h1>
        <p>Hi ${data.username},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${data.verificationUrl}">Verify Email Address</a></p>
        <p>This link will expire in 24 hours.</p>
      `,
      text: `Hi ${data.username}, please verify your email: ${data.verificationUrl}`
    },
    
    notification: {
      subject: data.subject || 'New Notification',
      html: `
        <h1>${data.title}</h1>
        <p>${data.message}</p>
        ${data.actionUrl ? `<p><a href="${data.actionUrl}">View Details</a></p>` : ''}
      `,
      text: `${data.title}: ${data.message}`
    }
  };

  const templateConfig = templates[template];
  if (!templateConfig) {
    throw new Error(`Email template '${template}' not found`);
  }

  return {
    subject: templateConfig.subject,
    html: templateConfig.html,
    text: templateConfig.text
  };
};

// Log email activity
const logEmailSent = async ({ to, subject, messageId, status, error }) => {
  try {
    await supabaseAdmin
      .from('email_logs')
      .insert({
        recipient: to,
        subject,
        message_id: messageId,
        status,
        error_message: error,
        sent_at: new Date().toISOString()
      });
  } catch (logError) {
    console.error('Failed to log email:', logError.message);
  }
};

// Send bulk emails
const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ ...email, success: true, result });
    } catch (error) {
      results.push({ ...email, success: false, error: error.message });
    }
  }
  
  return results;
};

// Send templated email
const sendTemplatedEmail = async (to, template, data) => {
  return await sendEmail({
    to,
    template,
    templateData: data
  });
};

// Initialize on module load
initializeTransporter();

module.exports = {
  sendEmail,
  sendBulkEmails,
  sendTemplatedEmail,
  generateEmailFromTemplate
};