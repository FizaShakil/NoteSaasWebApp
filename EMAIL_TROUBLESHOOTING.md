# Email Not Working - Troubleshooting Guide

## Current Configuration ✅
- Email: fizashakil25@gmail.com
- App Password: Configured
- Template: Exists
- Code: Correct

## Most Likely Issues & Solutions

### Issue 1: Gmail App Password Not Working (Most Common)

**Symptoms:** Email fails silently or throws authentication error

**Solution:**
1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (required for app passwords)
3. Go to: https://myaccount.google.com/apppasswords
4. Create a new App Password:
   - Select app: **Mail**
   - Select device: **Other (Custom name)** → Type: "Note App"
   - Click **Generate**
5. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
6. Update `.env` file:
   ```
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```
7. Restart your backend server

### Issue 2: Less Secure App Access Disabled

**Solution:**
Gmail no longer supports "Less secure app access". You MUST use App Passwords (see Issue 1).

### Issue 3: Backend Server Not Running

**Check:**
```bash
# Make sure backend is running
cd backend
npm run dev
```

### Issue 4: Email Going to Spam

**Check:**
1. Check your spam/junk folder
2. Mark as "Not Spam" if found

### Issue 5: Wrong Email Address

**Check:**
- Make sure you're using the exact email registered in the database
- Email is case-insensitive but must match exactly

## How to Test

### Test 1: Check Backend Logs
```bash
cd backend
npm run dev
```

Then trigger forgot password from frontend. Look for:
- ✅ "Password reset email sent successfully"
- ❌ "Error: " followed by error message

### Test 2: Test Email Directly

Create a test file `backend/test-email.js`:

```javascript
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'fizashakil25@gmail.com', // Send to yourself
      subject: 'Test Email',
      text: 'If you receive this, email is working!',
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
};

testEmail();
```

Run it:
```bash
node backend/test-email.js
```

## Common Error Messages

### "Invalid login: 535-5.7.8 Username and Password not accepted"
**Fix:** Generate new App Password (see Issue 1)

### "self signed certificate in certificate chain"
**Fix:** Add to sendEmail.js:
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

### "Connection timeout"
**Fix:** Check your internet connection or firewall blocking port 587/465

## Alternative: Use Different Email Service

If Gmail continues to fail, consider:

### Option A: Use Mailtrap (Development)
```javascript
// In sendEmail.js
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "your_mailtrap_user",
    pass: "your_mailtrap_pass"
  }
});
```

### Option B: Use SendGrid (Production)
```bash
npm install @sendgrid/mail
```

## Quick Fix Checklist

- [ ] 2-Step Verification enabled on Gmail
- [ ] Generated new App Password
- [ ] Updated EMAIL_PASS in .env with new app password
- [ ] Restarted backend server
- [ ] Checked spam folder
- [ ] Tested with correct email address
- [ ] Backend logs show no errors

## Still Not Working?

Run the test email script above and share the error message. The error will tell us exactly what's wrong.
