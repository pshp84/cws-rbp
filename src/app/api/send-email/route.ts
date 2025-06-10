// src/app/api/send-email/route.ts
import { EmailResponse } from '@/Types/EmailType';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import hbs, { NodemailerExpressHandlebarsOptions } from 'nodemailer-express-handlebars';
import path from 'path';

export async function POST(req: Request): Promise<NextResponse<EmailResponse>> {
 const { sendTo, subject, template, context ,extension, dirpath} = await req.json();
  // Add logging to verify environment variables

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER_HOST,
    port: Number(process.env.SMTP_SERVER_PORT), 
    secure: false, // true for 465 only
    // secureConnection: false,
    auth: {
      user: process.env.SMTP_SERVER_USERNAME,
      pass: process.env.SMTP_SERVER_PASSWORD,
    },
    // Add debug logging
    logger: true,
    debug: true,
  });

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log('Server is ready to take our messages');
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'SMTP Connection failed' },
      { status: 500 }
    );
  }

  const mailData = {
    from: `RBP Club ${process.env.MAIL_SENDER_EMAILADDRESS}`,
    to: sendTo,
    subject: subject,
    template: template,
    context: context,
    // attachments: [
    //   {
    //     filename: 'logoWhite.png',
    //     path: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}assets/images/logo/logoWhite.png`, 
    //     cid: 'logo-image-cid'
    //   }
    // ]
  };

  const handlebarOptions: NodemailerExpressHandlebarsOptions = {
    viewEngine: {
      extname: extension,
      partialsDir: path.resolve('public/email-templates'),
      defaultLayout: ''
    },
    viewPath: path.resolve('public/email-templates'),
    extName: extension
  }

  try {
    transporter.use('compile', hbs(handlebarOptions));
    const info = await transporter.sendMail(mailData);
    console.log('Message sent: %s', info.messageId);
    return NextResponse.json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}