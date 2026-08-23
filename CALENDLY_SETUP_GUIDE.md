# Calendly Setup Guide for Discovery Calls
**Issue**: CEL-35 - Sponsor Pitch & Partnership Development  
**Created**: Aug 23, 2026  
**Status**: Ready to Configure

---

## CALENDLY EVENT CONFIGURATION

### Step 1: Create New Event Type
1. Log in to [calendly.com](https://calendly.com)
2. Click "Create" or "+" to create new event type
3. Select "One-on-one" meeting type

### Step 2: Event Details

**Event Name**: 
```
Tennis Community Discovery Call
```

**Event Description**:
```
Let's explore how [Your Community Name] can partner with [Prospect Company]! 

During this 30-minute discovery call, we'll discuss:
- Your sponsorship objectives and budget
- Partnership activation ideas
- Community demographics and engagement
- Timeline and next steps

I look forward to connecting!
```

**Duration**: 30 minutes

**Meeting Type**: 
- [ ] Video + Phone option (Zoom meeting link + dial-in phone number)
- Or use your preferred video platform

---

### Step 3: Availability Settings

**Date Range**: Aug 26 - Sept 5, 2026

**Time Slots** (Configure weekly):
```
Monday-Friday: 9:00 AM - 5:00 PM
Saturday-Sunday: OFF (unless needed)
```

**Buffer Time**:
- Before meeting: 15 minutes (prep time)
- After meeting: 15 minutes (notes + thank you email)
- Minimum time between meetings: 15 minutes

**Advanced Options**:
- [ ] Allow 1 meeting per day? No (allow multiple)
- [ ] Require confirmation? Yes (auto-confirmation)
- [ ] Mobile app notifications? Yes

---

### Step 4: Timezone Configuration

**Timezone Handling**: Set to your primary timezone, but enable **timezone detection** so prospects see their own timezone when booking.

**Timezone Priorities**:
1. Main timezone: Eastern Time (ET)
2. Allow conversion for Pacific Time (PT) and Central Time (CT)
3. Confirm timezone in booking confirmation email

**Email Confirmation Settings**:
```
Add to email: "Time: [DATE] at [TIME] [TIMEZONE]"
```

---

### Step 5: Confirmation & Reminders

**Automatic Confirmation Email**:
- [ ] Enabled: YES
- [ ] Send to: Invitee's email
- [ ] Include: Zoom link + phone dial-in
- [ ] Include: Agenda/talking points? (optional)
- [ ] Include: Your contact info as backup

**Sample Confirmation Email**:
```
Subject: Your Discovery Call with [Your Name] is Confirmed!

Hi [Invitee Name],

Great! I'm looking forward to our discovery call on:

📅 [DATE]  
🕐 [TIME] [TIMEZONE]  
📞 [MEETING LINK/ZOOM]

We'll spend 30 minutes exploring partnership opportunities and how we can work together. Feel free to share any questions in advance!

If you need to reschedule, just click this link: [Reschedule Link]

Looking forward to connecting!

[Your Name]  
[Title]  
[Contact Info]
```

**Reminder Emails**:
- 24 hours before: Auto-send reminder
- 30 minutes before: (Optional, can skip)

---

### Step 6: Video Conferencing Setup

**Recommended Tools** (in order):
1. **Zoom** - Most reliable, allows recording
2. **Google Meet** - Good backup option
3. **Teams** - If prospect prefers

**Configuration**:
- [ ] Zoom: Generate automatic meeting link for each booking
- [ ] Recording: Enable automatic recording (save to cloud)
- [ ] Waiting room: Enable (vet callers before admitting)
- [ ] Backup phone dial-in: Enabled (in case video fails)

**Note**: Plan to ask for recording permission at start of call

---

### Step 7: Testing & Publishing

**Before Going Live**:
1. [ ] Test booking the link as "guest" (use test email)
2. [ ] Verify confirmation email arrives with correct details
3. [ ] Verify video link is active and working
4. [ ] Check timezone conversion (book in different timezone)
5. [ ] Ensure reminders send correctly
6. [ ] Test reschedule function

**Publish**:
- [ ] Set to "Available" on Calendly dashboard
- [ ] Copy public link: `https://calendly.com/[YOUR_USERNAME]/[EVENT_SLUG]`
- [ ] Test link from incognito browser (ensure publicly accessible)

---

## CALENDLY LINK PLACEMENT IN EMAILS

### Email Call-to-Action Template:
```
Ready to explore this partnership opportunity? 
Schedule a 30-minute discovery call at your convenience:

[CALENDLY LINK BUTTON]
👉 Pick a time that works for you

Can't use Calendly? Reply with 3 times you're available, and I'll send you a calendar invite.
```

### Shortened URL (Optional):
- Use bit.ly or URL shortener if Calendly link is long
- Format: `bit.ly/[COMMUNITY]-discovery-call`
- Redirect to: `[CALENDLY_PUBLIC_LINK]`

---

## PROSPECT-SPECIFIC CALENDLY LINKS

### Option A: One Universal Link (Recommended)
- Single Calendly link for all prospects
- Pros: Easy to manage, consistent experience
- Cons: Less personalization
- Use: Most efficient for Phase 1

### Option B: Prospect-Type Links (If Desired)
Create separate links for different prospect categories:
- Tier 1 prospects: `calendly.com/[you]/tier1-discovery` (shorter wait time)
- Tier 2 prospects: `calendly.com/[you]/tier2-discovery` (standard)
- Local prospects: `calendly.com/[you]/local-discovery` (high availability)

**Pros**: Can track which type books most
**Cons**: More setup and management

**Recommendation**: Use ONE universal link for simplicity in Phase 1

---

## TRACKING & ANALYTICS

### Monitor These Metrics:
1. **Click-Through Rate**: How many prospects click Calendly link from email?
2. **Booking Rate**: Of those who click, how many book?
3. **Booking Time**: How far in advance do prospects book? (Same day? 3 days?)
4. **Reschedule Rate**: How many reschedule after booking?
5. **Show Rate**: How many actually show up?

### Review in Calendly Dashboard:
- Invitations sent: [NUMBER]
- Meetings booked: [NUMBER]
- Meeting attended: [NUMBER]
- Cancellations: [NUMBER]

---

## BACKUP PHONE SCHEDULING

### If Prospect Doesn't Use Calendly:
Include in email: "Can't use Calendly? Reply with your 3 best times this week."

**Response Template**:
```
Perfect! I have you scheduled for:

📅 [DATE] at [TIME] [TIMEZONE]

I'll send a calendar invite and Zoom link shortly. 
Looking forward to our conversation!
```

---

## ZOOM RECORDING SETUP (For Call Documentation)

**Configure Zoom Recording**:
1. Log into Zoom account
2. Settings → Recording → Auto-record: "Cloud"
3. Cloud recordings: Auto-delete after 30 days (or your preference)
4. Note: Ask for permission at start of call ("Is it okay if I record this for note-taking?")

**Recording File Organization**:
- Name format: `CEL35_CALL_[PROSPECT_NAME]_[DATE]`
- Storage: Cloud drive (Google Drive or Dropbox)
- Retention: Keep for 6 months (then archive or delete)

---

## FINAL CHECKLIST

### Before Publishing Calendly Link:
- [ ] Event name set correctly
- [ ] Duration: 30 minutes
- [ ] Availability: Aug 26-Sept 5, 9am-5pm M-F
- [ ] Timezone: Your local + detection enabled
- [ ] Confirmation email configured
- [ ] Reminder emails: 24 hours before
- [ ] Video platform: Zoom/Teams configured
- [ ] Test booking completed successfully
- [ ] Public link works in incognito browser
- [ ] Link copied to clipboard ready for email templates

### Before Sending Emails (Aug 26):
- [ ] Calendly link verified as WORKING
- [ ] Link pasted into all 4 Tier 1 email drafts
- [ ] Test emails sent to yourself (verify link works)
- [ ] Phone fallback instructions included in email
- [ ] All emails proofread and ready to send

---

## QUICK SETUP SUMMARY

**Total Setup Time**: 15-20 minutes

**Your Calendly Link Will Be**: 
```
https://calendly.com/[YOUR_USERNAME]/tennis-discovery-call
```

**Paste This Into Email Template** (see OUTREACH_EMAIL_TEMPLATE.md):
```
Ready to explore this partnership? 
Schedule a discovery call here: [CALENDLY_LINK]
```

---

**Status**: Ready to Configure  
**Next Step**: Complete setup by Aug 24 EOD  
**Owner**: Business Development Lead  
**Issue**: CEL-35
