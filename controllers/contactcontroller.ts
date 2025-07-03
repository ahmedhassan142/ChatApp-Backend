
import { Request, Response } from 'express';
import { sendEmail } from '../utils/sendEmail.js'; // Adjust path as needed

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

export const contactController = async (req: Request, res: Response) => {
  try {
    const { name, email, message }: ContactRequest = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required: name, email, message' 
      });
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide a valid email address' 
      });
    }

    // Prepare email content
    const emailSubject = `New Contact Form Submission from ${name}`;
    const emailText = `
      Name: ${name}
      Email: ${email}
      Message: ${message}
    `;
    const emailHtml = `
      <h2>New Contact Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p>Sent from your chat application</p>
    `;

    // Send to your admin email (from .env)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';
    
    await sendEmail({
      email: adminEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    // Optional: Send confirmation to user
    await sendEmail({
      email: email,
      subject: 'We received your message!',
      text: `Thank you ${name} for contacting us! We'll get back to you soon.`,
      html: `
        <h2>Thank you for reaching out, ${name}!</h2>
        <p>We've received your message and will respond shortly.</p>
        <p><strong>Your message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>The ${process.env.APP_NAME || 'Chat App'} Team</p>
      `
    });

    return res.status(200).json({ 
      success: true,
      message: 'Contact form submitted successfully' 
    });

  } catch (error) {
    console.error('Contact controller error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to process contact form',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};