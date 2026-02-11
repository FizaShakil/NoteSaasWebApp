import nodemailer from 'nodemailer'

const sendEmail = async ({ to, subject, html }) => {
  // Create transporter using Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  // Email options
  const mailOptions = {
   from: `"Note App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  }

  // Send email
  await transporter.sendMail(mailOptions)
}

export default sendEmail