'use server';
import nodemailer from 'nodemailer';
import hbs, { NodemailerExpressHandlebarsOptions, TemplateOptions } from 'nodemailer-express-handlebars';
import { MailOptions } from 'nodemailer/lib/json-transport';
import path from 'path';
const SMTP_SERVER_HOST = process.env.SMTP_SERVER_HOST;
const SMTP_SERVER_USERNAME = process.env.SMTP_SERVER_USERNAME;
const SMTP_SERVER_PASSWORD = process.env.SMTP_SERVER_PASSWORD;
const SMTP_SERVER_PORT = process.env.SMTP_SERVER_PORT
// const SITE_MAIL_RECIEVER = process.env.SITE_MAIL_RECIEVER;
// const handlebarOptions: NodemailerExpressHandlebarsOptions = {
//   viewEngine: {
//     extname: ".html",
//     partialsDir: path.resolve('./EmailTemplates'),
//     defaultLayout: ''
//   },
//   viewPath: path.resolve('./EmailTemplates'),
//   extName: ".html"
// }
const transporter = nodemailer.createTransport({
  service: SMTP_SERVER_HOST,
  host: SMTP_SERVER_HOST,
  port: 587,
  secure: false,
  auth: {
    user: SMTP_SERVER_USERNAME,
    pass: SMTP_SERVER_PASSWORD,
  },
});
// transporter.use('compile', hbs(handlebarOptions));

export async function sendMail({
  sendTo,
  subject,
  text,
  html,
  template,
  context
}: {
  sendTo?: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string,
  context: any
},{ extension , dirpath }: { extension?: string , dirpath?: string }) {
  try {
    const isVerified = await transporter.verify();
  } catch (error) {
    console.error('Something Went Wrong', SMTP_SERVER_USERNAME, SMTP_SERVER_PASSWORD, error);
    return;
  }
  const mailOptions : MailOptions & TemplateOptions = {
    from: process.env.MAIL_SENDER_EMAILADDRESS as string,
    to: sendTo,
    subject: subject,
    template: template,
    context: context
  }
  const handlebarOptions: NodemailerExpressHandlebarsOptions = {
    viewEngine: {
      extname: extension,
      partialsDir: path.resolve(dirpath as string),
      defaultLayout: ''
    },
    viewPath: path.resolve(dirpath as string),
    extName: extension
  }
  let info: any
  try {
    transporter.use('compile', hbs(handlebarOptions));
    // info = await transporter.sendMail(mailOptions);
    await new Promise((resolve,reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error)
          console.log(error)
        }
        else {
          console.log(info)
          resolve(info);
        }
      });
    })
    // console.log("info",info.response)
  } catch (error) {
    console.error("Error sending email:", error);
  }
  return info;
}