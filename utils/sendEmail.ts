import nodemailer from "nodemailer";

interface EmailOptions {
  email: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Validate required configuration with better error messages
    if (!process.env.SMTP_USER) throw new Error("SMTP_USER is required");
    if (!process.env.SMTP_PASS) throw new Error("SMTP_PASS is required");

    // Recommended production configuration for Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail", // Use 'service' instead of host/port for Gmail
      pool: true, // Use connection pooling
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // These settings help with Gmail's rate limits
      maxConnections: 5,
      maxMessages: 10,
      // Better error handling
      logger: process.env.NODE_ENV !== "production", // Log in dev
      debug: process.env.NODE_ENV !== "production", // Debug in dev
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Mail"}" <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
      // Add these for better email deliverability
      headers: {
        "X-Priority": "1",
        "X-Mailer": "MyAppMailer",
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.email}`, info.messageId);
    
    // In production, you might want to log this to a monitoring system
    if (process.env.NODE_ENV === "production") {
      // Add your analytics/logging here
    }
    
  } catch (error) {
    console.error(`Failed to send email to ${options.email}:`, error);
    
    // Convert error to more readable format
    const emailError = new Error(`Email failed: ${error instanceof Error ? error.message : String(error)}`);
    emailError.name = "EmailError";
    throw emailError;
  }
};