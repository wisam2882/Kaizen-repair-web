const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Logging function
function logSubmission(data, status, error = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    status,
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      service: data.service,
      message: data.message?.substring(0, 100) + (data.message?.length > 100 ? '...' : '') // Truncate long messages
    },
    error: error?.message || null
  };
  
  const logFile = path.join(logsDir, `contact-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// Nodemailer transporter with better error handling
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add timeout and retry settings
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000,    // 5 seconds
  socketTimeout: 10000,     // 10 seconds
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready');
  }
});

// Enhanced input validation
function validateInput(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Please provide a valid email address');
  }
  
  if (!data.service || data.service.trim().length < 2) {
    errors.push('Please specify the service you need');
  }
  
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters long');
  }
  
  if (data.phone && !/^[\d\s\-\+\(\)\.]+$/.test(data.phone)) {
    errors.push('Please provide a valid phone number');
  }
  
  return errors;
}

// Contact form endpoint with comprehensive error handling
app.post('/contact', async (req, res) => {
  const { name, email, phone, service, message } = req.body;
  
  // Validate input
  const validationErrors = validateInput(req.body);
  if (validationErrors.length > 0) {
    logSubmission(req.body, 'validation_error', { message: validationErrors.join(', ') });
    return res.status(400).json({ 
      error: 'Please correct the following errors:', 
      details: validationErrors 
    });
  }

  // Enhanced email content
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject: `🔧 New Repair Service Inquiry from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>📧 Customer Details:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone || 'Not provided'}</li>
            <li><strong>Service Needed:</strong> ${service}</li>
          </ul>
        </div>
        <div style="background: #fff; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
          <p><strong>💬 Message:</strong></p>
          <p style="line-height: 1.6;">${message}</p>
        </div>
        <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            <strong>Submission Time:</strong> ${new Date().toLocaleString()}<br>
            <strong>Reply promptly to maintain customer satisfaction!</strong>
          </p>
        </div>
      </div>
    `,
    // Also include plain text version
    text: `
      New Contact Form Submission
      
      Name: ${name}
      Email: ${email}
      Phone: ${phone || 'Not provided'}
      Service Needed: ${service}
      Message: ${message}
      
      Submitted: ${new Date().toLocaleString()}
    `,
  };

  try {
    // Send email with verification
    const info = await transporter.sendMail(mailOptions);
    
    // Log successful submission
    logSubmission(req.body, 'success');
    
    console.log('Email sent successfully:', info.messageId);
    
    res.status(200).json({ 
      message: 'Thank you for contacting us! We\'ll get back to you within 24 hours.',
      success: true 
    });
    
  } catch (error) {
    // Log the error
    logSubmission(req.body, 'error', error);
    console.error('Email sending failed:', error);
    
    // Send user-friendly error message
    res.status(500).json({ 
      error: 'We\'re experiencing technical difficulties. Please try again or call us directly.',
      success: false 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    emailReady: transporter.transporter ? true : false
  });
});

// Endpoint to check recent submissions (for debugging)
app.get('/admin/recent-logs', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `contact-${today}.log`);
    
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
        .slice(-10); // Last 10 entries
      
      res.json({ logs });
    } else {
      res.json({ logs: [], message: 'No logs found for today' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve logs' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Repair Service Contact API running on http://localhost:${port}`);
  console.log(`📧 Email configured for: ${process.env.EMAIL_USER}`);
  console.log(`📬 Emails will be sent to: ${process.env.RECIPIENT_EMAIL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Server shutting down gracefully...');
  process.exit(0);
});