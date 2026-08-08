# Send Confirmation Emails for Existing Records

This script allows you to send confirmation emails for bookings and trips that were created before the email feature was implemented.

## Features

- ✅ Send confirmation emails for all existing trips
- ✅ Send confirmation emails for all existing bookings
- ✅ Automatic rate limiting (2-second delay between emails)
- ✅ Detailed progress reporting
- ✅ Summary statistics after completion
- ✅ Skips records without user email

## Usage

### Send Trip Confirmations Only

```bash
cd server
node scripts/sendExistingConfirmations.js trips
```

### Send Booking Confirmations Only

```bash
cd server
node scripts/sendExistingConfirmations.js bookings
```

### Send All Confirmations (Bookings + Trips)

```bash
cd server
node scripts/sendExistingConfirmations.js all
```

## Example Output

```
==================================================
📧 SEND EXISTING CONFIRMATIONS SCRIPT
==================================================

🎯 Mode: Sending trip confirmations

🔄 Connecting to database...
✅ Connected to MongoDB

📋 Fetching existing trips...
Found 15 trips

📧 Sending confirmation emails...

[1/15] Sending email for trip: Paris Adventure
   📧 To: user1@example.com
   ✅ Success - Message ID: <abc123@gmail.com>

[2/15] Sending email for trip: Tokyo Trip
   📧 To: user2@example.com
   ✅ Success - Message ID: <def456@gmail.com>

...

==================================================
📊 EMAIL SENDING SUMMARY
==================================================
Total Trips: 15
✅ Successfully Sent: 14
❌ Failed: 0
⚠️  Skipped: 1
==================================================

🔌 Database connection closed
```

## Important Notes

### Rate Limiting

- The script includes a **2-second delay** between each email to avoid hitting Gmail's rate limits
- For large numbers of records, this may take some time
- Gmail's sending limit: ~500 emails/day for regular accounts

### Error Handling

- If an email fails to send, the script continues with the next record
- Failed sends are logged and counted in the summary
- Records without user email are automatically skipped

### Safe to Run Multiple Times

- The script doesn't track which emails have been sent
- If you run it multiple times, users will receive duplicate emails
- **Recommendation:** Run once after setting up the email feature

## Customization

### Adjust Delay Time

Edit the delay between emails in `sendExistingConfirmations.js`:

```javascript
// Current: 2 seconds (2000ms)
await delay(2000);

// Change to 5 seconds
await delay(5000);
```

### Filter Specific Records

Modify the database query to send emails only for specific records:

```javascript
// Only trips from the last 30 days
const trips = await Trip.find({
  createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
}).populate('user', 'email name');

// Only confirmed trips
const trips = await Trip.find({
  status: 'upcoming'
}).populate('user', 'email name');

// Only bookings of specific type
const bookings = await Booking.find({
  bookingType: 'hotel'
}).populate('user', 'email name');
```

## Troubleshooting

### Script Fails to Connect to Database

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:** Ensure MongoDB is running and the `MONGODB_URI` in `.env` is correct.

### No Emails Being Sent

**Check:**
1. Email credentials are set in `.env` file
2. `EMAIL_USER` and `EMAIL_PASS` are correct
3. Check server logs for detailed error messages
4. Verify Gmail App Password is being used (not regular password)

### "Booking model not found" Warning

This means bookings might be stored differently in your app. The script will automatically skip booking confirmations and only send trip confirmations.

### Gmail Blocks Suspicious Activity

If Gmail blocks the script:
1. Check your Gmail "Security" page for blocked sign-in attempts
2. Allow the activity and try again
3. Ensure you're using an App Password, not your regular password
4. Consider using a professional email service (SendGrid, AWS SES) for bulk sending

## Production Recommendations

For large-scale email sending (100+ emails):

1. **Use a Professional Email Service:**
   - SendGrid (12,000 free/month)
   - AWS SES (62,000 free/month)
   - Mailgun (5,000 free/month)

2. **Implement Batch Processing:**
   - Send emails in smaller batches
   - Add longer delays between batches
   - Run during off-peak hours

3. **Add Email Tracking:**
   - Mark which records have received confirmation emails
   - Add a `confirmationEmailSent` field to your models
   - Prevent duplicate sends

4. **Monitor Delivery:**
   - Check for bounce rates
   - Track delivery success rates
   - Handle undeliverable emails

## Example: Mark Emails as Sent

To prevent duplicate emails, you can modify your models:

```javascript
// Add to Trip and Booking schemas
confirmationEmailSent: {
  type: Boolean,
  default: false
},
confirmationEmailSentAt: Date
```

Then update the script to:
```javascript
// Only fetch records that haven't received emails
const trips = await Trip.find({
  $or: [
    { confirmationEmailSent: { $ne: true } },
    { confirmationEmailSent: { $exists: false } }
  ]
}).populate('user', 'email name');

// After successful send
if (result.success) {
  trip.confirmationEmailSent = true;
  trip.confirmationEmailSentAt = new Date();
  await trip.save();
}
```

## Support

For issues or questions, check:
- Server console logs for detailed errors
- Gmail account activity for blocked attempts
- Email service provider status pages
- [EMAIL_SETUP.md](../EMAIL_SETUP.md) for email configuration help
