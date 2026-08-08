# Email Confirmation Setup Guide

This application now sends confirmation emails for all bookings and trips. Here's how to configure it.

## Features

### 1. **Booking Confirmations**
Automatically sends email confirmations for:
- ✅ Hotel bookings
- ✅ Restaurant/Café reservations
- ✅ Transport bookings (Car, Bike, Bus, Train, Flight, Ship)
- ✅ Package bookings

### 2. **Trip Confirmations**
Sends email notifications when:
- ✅ Trip is created/planned
- ✅ Trip draft is saved
- ✅ Trip status changes to "upcoming"

## Email Configuration

### Step 1: Get Email Credentials

#### For Gmail:
1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an App Password:
   - Go to Security > 2-Step Verification > App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

#### For Other Email Services:
- Use your SMTP credentials provided by your email service provider

### Step 2: Set Environment Variables

Add these variables to your `.env` file in the `server` folder:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
```

**Example:**
```env
EMAIL_USER=aitripplanner@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

### Step 3: Install Required Package

The application uses `nodemailer` for sending emails. Install it:

```bash
cd server
npm install nodemailer
```

### Step 4: Test Email Sending

1. Start your server
2. Make a test booking or create a trip
3. Check your email inbox for the confirmation

## Email Templates

### Booking Confirmation Email Includes:
- 🎉 Visual confirmation header
- 📋 Booking reference number
- 📅 Dates and times
- 👥 Guest/passenger details
- 💰 Pricing breakdown
- 📍 Location/route information
- ℹ️ Special requests

### Trip Confirmation Email Includes:
- ✈️ Trip status (Confirmed/Draft)
- 🆔 Trip ID
- 📍 Destination
- 📅 Travel dates
- ⏱️ Duration
- 💵 Estimated budget
- 📱 Quick access instructions

## Customization

### Change Email Service Provider

Edit `server/utils/emailService.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

### Customize Email Templates

Email templates are in `server/utils/emailService.js`:
- `sendBookingConfirmation()` - For bookings
- `sendTripConfirmation()` - For trips

Modify the HTML content in these functions to match your brand.

## User Experience

### Frontend Notifications

After successful booking/trip creation, users see:

1. **Toast Notification** with:
   - ✅ Confirmation message
   - 📧 Email sent indicator
   - 🔢 Reference number
   - ⏱️ Auto-closes after 5-8 seconds

2. **Email Notification** with:
   - Professional HTML template
   - Complete booking/trip details
   - Payment summary (for bookings)
   - Contact information

## Troubleshooting

### Emails Not Sending?

1. **Check environment variables:**
   ```bash
   # In server folder
   echo $EMAIL_USER
   echo $EMAIL_PASSWORD
   ```

2. **Check server logs:**
   - Look for "email sent" or "email error" messages
   - Email errors won't fail the booking/trip creation

3. **Gmail specific issues:**
   - Ensure 2FA is enabled
   - Use App Password, not regular password
   - Check "Less secure app access" is OFF (use App Password instead)

4. **Firewall/Network issues:**
   - Ensure port 587 (or 465 for SSL) is not blocked
   - Check if your hosting provider allows SMTP

### Email in Spam?

- Add your sender email to contacts
- Request users to mark as "Not Spam"
- Consider using a professional email service (SendGrid, AWS SES, Mailgun)

## Production Recommendations

For production environments:

1. **Use Professional Email Service:**
   - SendGrid (12,000 free emails/month)
   - AWS SES (62,000 free emails/month)
   - Mailgun (5,000 free emails/month)
   - Postmark

2. **Add Email Verification:**
   - Verify email addresses before sending
   - Implement bounce handling

3. **Add Email Queue:**
   - Use Bull/Redis for queuing emails
   - Retry failed emails automatically

4. **Monitor Email Delivery:**
   - Track delivery rates
   - Monitor bounce and complaint rates
   - Log all email activities

## Example Production Setup (SendGrid)

```javascript
// server/utils/emailService.js
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sgTransport({
  auth: {
    api_key: process.env.SENDGRID_API_KEY
  }
}));
```

## Support

If you encounter any issues:
1. Check server console logs
2. Verify environment variables
3. Test with a simple email first
4. Check email service provider status

---

**Note:** Email sending failures will NOT prevent bookings or trips from being created. They are logged but won't break the user experience.
