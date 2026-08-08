import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

function getTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return null
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const transporter = getTransporter()

  if (!transporter) {
    // Log to console in dev when SMTP not configured
    console.log('\n📧 EMAIL (Console Mode - Configure SMTP to send real emails)')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${html.replace(/<[^>]*>/g, '')}`)
    console.log('─'.repeat(60))
    return { success: true, preview: true }
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@adpclergy.org',
    to,
    subject,
    html,
  })

  return { success: true, preview: false }
}

export function invitationEmailTemplate({
  name,
  email,
  tempPassword,
  inviteUrl,
}: {
  name: string
  email: string
  tempPassword: string
  inviteUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Georgia, serif; background: #f8f4f0; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #7c2d12, #9a3412); padding: 32px; text-align: center; }
        .header h1 { color: #fef3c7; margin: 0; font-size: 22px; letter-spacing: 1px; }
        .header p { color: #fde68a; margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; }
        .body p { color: #374151; line-height: 1.7; }
        .credentials { background: #fef3c7; border-left: 4px solid #b45309; padding: 16px; margin: 20px 0; border-radius: 4px; }
        .credentials p { margin: 4px 0; font-family: monospace; }
        .button { display: inline-block; background: #7c2d12; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .footer { background: #f9f5f2; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✝ Archdiocese of Diocese of Priests</h1>
          <p>Clergy Profile System — Invitation</p>
        </div>
        <div class="body">
          <p>Dear <strong>${name}</strong>,</p>
          <p>You have been invited to complete your clergy profile in the ADP Clergy Management System. Please use the credentials below to access your account and complete the questionnaire.</p>
          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p>Please click the button below to access the system and complete your profile:</p>
          <a href="${inviteUrl}" class="button">Complete My Profile →</a>
          <p><strong>Note:</strong> You will be asked to change your password upon first login. This link is secure and tied to your account.</p>
          <p>If you did not expect this invitation or have questions, please contact the ADP Administration office.</p>
          <p>May God bless your ministry.</p>
          <p><em>ADP Administration</em></p>
        </div>
        <div class="footer">
          <p>This is an automated message from the ADP Clergy Profile System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
