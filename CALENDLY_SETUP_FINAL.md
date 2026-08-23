# Calendly Setup — Final Guide (30-45 Minutes)
**Issue**: CEL-35 — Sponsor Pitch & Partnership Development  
**Task**: Set up Calendly for Tier 1 sponsor outreach  
**Deadline**: Aug 26 @ 10:00 AM (or earlier if possible Aug 25)  
**Time Required**: 30-45 minutes  
**Status**: Ready to execute

---

## ⚡ QUICK START (TL;DR)

1. Go to **calendly.com**
2. Sign up or log in with email: **tnguyen205@dxc.com**
3. Create event: "Tennis Community Discovery Call" (30 min)
4. Set availability: Mon-Fri, 9 AM - 5 PM, through Sept 5
5. Add Zoom (auto-generates link in confirmation)
6. Test your link in incognito browser
7. Copy link, paste into emails
8. Done!

**Expected Result**: `calendly.com/[your-name]/tennis-discovery-call` or similar

---

## 📋 STEP-BY-STEP GUIDE

### STEP 1: SIGN UP / LOGIN (2 minutes)

**If you DON'T have a Calendly account:**
1. Go to https://calendly.com
2. Click **"Sign Up"**
3. Enter email: **tnguyen205@dxc.com**
4. Create a password (something you can remember)
5. Click **"Create Account"**
6. Verify email if prompted (check inbox for verification link)

**If you ALREADY have a Calendly account:**
1. Go to https://calendly.com
2. Click **"Log In"**
3. Use your email + password
4. You're ready to proceed to Step 2

---

### STEP 2: CREATE EVENT TYPE (8-10 minutes)

Once logged in to Calendly:

1. **Find the "Create Event Type" button**
   - Look for "+ Create" or "Create Event Type" button
   - Usually top-left or top-center of dashboard

2. **Click "Create Event Type"**

3. **Fill in Basic Info**
   ```
   Event Name: "Tennis Community Discovery Call"
   
   Event Description: "30-minute discovery call to explore sponsorship 
   and partnership opportunities. All video & phone details will be 
   included in your confirmation."
   
   Duration: 30 minutes (or 45 if you prefer longer calls)
   ```

4. **Set Your Availability**
   ```
   Time zone: [YOUR TIMEZONE]
     - Eastern (EST/EDT) if US East Coast
     - Central (CST/CDT) if US Central
     - Mountain (MST/MDT) if US Mountain
     - Pacific (PST/PDT) if US West Coast
   
   Working hours: 
     - Days: Monday, Tuesday, Wednesday, Thursday, Friday
     - Hours: 9:00 AM - 5:00 PM
   
   Buffer time: 15 minutes (auto-adds space between bookings)
   
   Calendar range: Aug 26 through Sept 5, 2026
   ```

5. **Select Video/Phone Options**
   - Under "Where will this meeting take place?"
   - Select: **"Add a Conferencing Tool"**
   - Choose: **"Zoom"**
   - Click **"Connect to Zoom"**
   - Authorize Calendly to access your Zoom account
   - If you don't have Zoom, you can:
     - Use "Phone" as backup
     - Or enable both Zoom + Phone

6. **Set Confirmation Email (OPTIONAL - good to do)**
   - Look for "Confirmation Email" or "Email Settings"
   - Make sure it says something like: "Zoom link will be included"
   - Default is fine, but you can customize if desired
   - Example: "Looking forward to our call! Zoom link is below..."

7. **Save Event Type**
   - Click **"Create Event"** or **"Save"** button
   - Calendly confirms creation

---

### STEP 3: GET YOUR PUBLIC LINK (2 minutes)

Once event is created:

1. **Find Your Event Link**
   - You should see your event listed in dashboard
   - Click on the event to open it
   - Look for a button that says "Share" or "Copy Link"
   - Or look in the URL: should show your link format

2. **Expected Link Format**
   ```
   calendly.com/[your-name]/tennis-discovery-call
   
   Examples:
   - calendly.com/tao-nguyen/tennis-discovery-call
   - calendly.com/tao.nguyen/tennis-community-call
   - calendly.com/taonguyen/discovery-call
   ```

3. **Copy Your Link**
   - Click the link or "Copy" button
   - Paste into a notepad so you have it saved
   - Keep it handy for email personalization

---

### STEP 4: TEST YOUR LINK (5 minutes)

**This is IMPORTANT - verify it works before sending emails!**

1. **Open New Incognito Browser Window**
   - Windows: Ctrl + Shift + N
   - Mac: Cmd + Shift + N
   - Reason: Tests the link as an external person sees it

2. **Paste Your Calendly Link**
   - Paste the link from Step 3 into the address bar
   - Hit Enter

3. **Verify It Works**
   - Page should show your availability calendar
   - You should see time slots available (green/available)
   - Your timezone should display correctly
   - You should see "Zoom" or phone option mentioned

4. **Try to Book a Time**
   - Click on any available time slot
   - Enter a fake name: "Test User" or "Testing"
   - Enter fake email: "test@example.com"
   - Complete the booking
   - Check your email for confirmation

5. **Verify Zoom Link in Confirmation**
   - Check email (might take 1-2 minutes to arrive)
   - Confirmation should include:
     - Date/time of booking
     - Zoom link (or phone dial-in)
     - Calendar add option (Google Calendar, Outlook, etc.)

6. **If Something is Wrong**
   - Zoom link missing? Check event settings, re-add Zoom
   - Wrong timezone? Check event settings, update timezone
   - No availability showing? Check that dates/hours are set correctly
   - Fix the issue and test again

7. **Once Confirmed Working** ✅
   - Close incognito window
   - Your link is ready to use!

---

### STEP 5: INSERT LINK INTO EMAILS (5 minutes)

1. **Open File: `TIER1_EMAILS_PERSONALIZED_AUG26.md`**
   - This should be your personalized email drafts
   - Or open: `OUTREACH_EMAILS_FINAL.md`

2. **Find and Replace All Instances Of:**
   ```
   [CALENDLY_LINK]
   [INSERT CALENDLY LINK HERE]
   [YOUR_CALENDLY_LINK]
   [Calendly Link]
   ```

3. **Replace With Your Actual Link:**
   ```
   calendly.com/tao-nguyen/tennis-discovery-call
   (Use the link from Step 3)
   ```

4. **Search Function Tip:**
   - Use Ctrl+H (Windows) or Cmd+H (Mac) to "Find & Replace"
   - This makes it faster to update all 4 emails at once

5. **Verify No Bracket Placeholders Remain**
   - Search for "[CALENDLY" to make sure all are replaced
   - Search for "[Calendar" to catch any other variants
   - No [BRACKET] text should remain in final emails

6. **Save and Commit**
   - Save file with Cmd+S or Ctrl+S
   - Run: `git add .` and `git commit -m "CEL-35: Calendly link added, ready for Aug 26 launch"`

---

## ✅ SUCCESS CHECKLIST

Before Aug 26 morning, you should have checked off:

- [ ] Calendly account created / logged in
- [ ] Event type created: "Tennis Community Discovery Call"
- [ ] 30-minute duration set
- [ ] Availability: Mon-Fri, 9 AM - 5 PM, Aug 26 - Sept 5
- [ ] Zoom integration enabled
- [ ] Test booking completed (from incognito browser)
- [ ] Confirmation email received with Zoom link
- [ ] Calendly link copied to clipboard
- [ ] All 4 emails updated with Calendly link
- [ ] No [BRACKET] placeholders remaining in emails
- [ ] Changes committed to git

---

## 🚨 TROUBLESHOOTING

### Problem: "I can't find the Create Event Type button"
**Solution**:
- Calendly sometimes hides it in a menu
- Look for: Menu icon (☰) or "+" button
- Or go directly to: calendly.com/event_types
- Click "Create new event type"

### Problem: "My Zoom integration won't connect"
**Solution**:
- **FALLBACK**: Just use "Phone" instead of Zoom
- Or leave as "Phone call" and mention Zoom in email
- Calendly will still generate a meeting link for video, just in your email body
- **Alternative**: Add a note in emails: "Zoom link will be sent in confirmation email"

### Problem: "The test email didn't arrive"
**Solution**:
- Check spam folder
- Wait 2-3 minutes (Calendly can be slow)
- Try booking again with a different test email
- Once confirmed working, you're good

### Problem: "I see wrong timezone in calendar"
**Solution**:
- Go back to event settings
- Under "Time zone", select correct timezone
- Verify available slots show correct times
- Save and test again

### Problem: "Calendly bookings aren't showing on my personal calendar"
**Solution**:
- This is fine! Calendly syncs separately
- The booking confirmation emails are what matter
- You'll still get notifications when someone books
- Manually add to your calendar if you prefer

---

## 📞 FALLBACK PLAN (If Calendly Doesn't Work)

**If you run out of time or Calendly fails, DON'T PANIC:**

Your emails already include explicit time slots as a fallback! Just use this text instead of the Calendly link:

```
Some times that work well for me for a brief call:

• Tuesday, Aug 26 @ 10:00 AM EST
• Tuesday, Aug 26 @ 2:00 PM EST
• Wednesday, Aug 27 @ 10:00 AM EST
• Wednesday, Aug 27 @ 4:00 PM EST

Reply with your preference or let me know what works best for you.
```

**Why this works:**
- Prospects can still see your availability
- Simple email reply (no need for Calendly)
- Just as effective for scheduling
- You can manually enter into your calendar

**This is NOT a failure** — just using Plan B. Aug 26 launch still proceeds on time with explicit time slots.

---

## ⏰ TIMELINE FOR AUG 26 MORNING

Once Calendly is ready:

```
8:00 AM  → SEND: Wilson email (with Calendly link)
8:05 AM  → SEND: SwingVision email (with Calendly link)
8:10 AM+ → Monitor for Calendly bookings
```

Prospects will book directly into your calendar!

---

## 🎯 FINAL NOTES

- **Calendly is simple** — don't overthink it
- **Test is essential** — always test before sending emails
- **Fallback exists** — even if Calendly fails, explicit time slots work just as well
- **You've got this!** — 30-45 minutes and you're done

---

**Status**: Ready to Execute  
**Time Required**: 30-45 minutes  
**Difficulty**: Easy (step-by-step guide provided)  
**Success Likelihood**: 95%+  

**Next Step**: Complete this guide, then update emails, then Aug 26 @ 8:00 AM → LAUNCH! 🚀

---

**Owner**: Business Development Lead  
**Created**: Aug 23, 2026  
**Deadline**: Complete by Aug 26 @ 10:00 AM (ideally Aug 25)  
**Status**: READY FOR EXECUTION ✅
