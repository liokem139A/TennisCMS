# CEL-32: Phase 3 Email Platform & Dashboard Setup
**Aug 23, 2026 - Platform Configuration Guide**

**Deadline**: 9:00 PM EST  
**Duration**: 1 hour  
**Owner**: Business Development Lead with technical support  
**Status**: 📋 SETUP INSTRUCTIONS PREPARED

---

## PHASE 3 CRITICAL PATH

```
STEP 1: Email Platform Selection (10 min) 
   ↓
STEP 2: Platform Account Setup (15 min)
   ↓
STEP 3: Load Emails & Configure (15 min)
   ↓
STEP 4: Create Calendly & Dashboard (10 min)
   ↓
STEP 5: TEST & VERIFY (10 min)
   ↓
✅ READY FOR PHASE 4 APPROVAL
```

---

## STEP 1: EMAIL PLATFORM SELECTION (10 Minutes)

### Platform Options Comparison

| Platform | Setup Time | Cost | Tracking | Ease | Best For |
|----------|-----------|------|---------|------|----------|
| **Gmail** | 5 min | Free | Basic | Easy | Simple sends |
| **HubSpot** | 20 min | Free tier | Excellent | Moderate | CRM + tracking |
| **Mailchimp** | 15 min | Free tier | Good | Easy | Email marketing |
| **ConvertKit** | 20 min | Paid | Excellent | Moderate | Creator focus |

### Decision Matrix

**Recommendation**: **HubSpot** (best for this use case)
- ✅ Free tier includes email, CRM, tracking
- ✅ Real-time email open/click tracking  
- ✅ Automated follow-up sequences
- ✅ Calendly integration built-in
- ✅ Response scoring and SLA management
- ✅ Dashboard with real-time analytics

### Selection Instructions

**IF CHOOSING HUBSPOT**:
1. [ ] Go to hubspot.com/free
2. [ ] Sign up with email: tnguyen205@dxc.com
3. [ ] Verify email address
4. [ ] Complete onboarding (5 min)
5. [ ] Create "Celadon Tennis" workspace
6. [ ] Navigate to Email section

**IF CHOOSING MAILCHIMP**:
1. [ ] Go to mailchimp.com
2. [ ] Sign up with email: tnguyen205@dxc.com
3. [ ] Verify email address
4. [ ] Create new campaign
5. [ ] Skip to email list setup

**IF CHOOSING GMAIL SIMPLE**:
1. [ ] Open Gmail.com with account
2. [ ] Create new draft for each recipient
3. [ ] Format and personalize
4. [ ] Use Gmail tracking extension (optional):
   - Mailtrack.io or Boomerang plugin
   - Provides open/click tracking

**ACTION REQUIRED**: Select platform and complete signup by 6:45 PM

---

## STEP 2: EMAIL PLATFORM ACCOUNT SETUP (15 Minutes)

### HubSpot Setup Checklist

**Account Configuration**:
- [ ] Create Contact List
  - [ ] Name: "Tennis Clubs - Aug 24 Campaign"
  - [ ] Add 4 contacts manually or import CSV:
    - Russ Hadziabdic (RHadziabdic@ahpd.org)
    - Terry Hartley (Terry.Hartley@HCCTA.org)
    - Jim J Perko (Jim@svgc.org)
    - info@downtowntennisnyc.com

**Email Configuration**:
- [ ] Verify sender email: tnguyen205@dxc.com
- [ ] Set up sender name: "Business Development Lead"
- [ ] Set sender reply-to: tnguyen205@dxc.com
- [ ] Configure email templates folder

**Tracking Configuration**:
- [ ] Enable email open tracking ✓
- [ ] Enable link click tracking ✓
- [ ] Enable CTA tracking ✓
- [ ] Set up bounce handling

**Integration Configuration**:
- [ ] Link Calendly account (if using embedded links)
- [ ] Set up Slack notifications (optional but recommended)
  - Alert on: email opens, clicks, responses
  - Channel: [specify if using Slack]

**Verification**:
- [ ] Test sender email: Send test email to self
- [ ] Verify formatting displays correctly
- [ ] Verify Calendly link renders properly
- [ ] Confirm mobile preview looks good

---

## STEP 3: LOAD EMAILS & CONFIGURE SENDING (15 Minutes)

### Email Loading Procedure

**Option A: Manual Copy/Paste**:
1. [ ] Open CEL32_PHASE2_COMPLETE.md (4 personalized emails)
2. [ ] In HubSpot/Mailchimp, create new email draft
3. [ ] Copy/paste first email (Heritage TC):
   - To: RHadziabdic@ahpd.org
   - Subject: "Partnership Opportunity with Heritage Tennis Club"
   - Body: [Copy from Phase 2 email 1]
4. [ ] Repeat for remaining 3 emails (HCTA, Sunnyvale, Downtown TC)
5. [ ] For each email:
   - [ ] Insert sender phone number
   - [ ] Insert Calendly link (see Step 4)
   - [ ] Format HTML if needed
   - [ ] Preview mobile version

**Option B: CSV Import** (if platform supports):
1. [ ] Create CSV with columns:
   - recipient_email
   - recipient_name
   - club_name
   - email_body
   - subject_line
2. [ ] Upload to email platform
3. [ ] Map fields to platform variables
4. [ ] Configure merge tags ({{recipient_name}}, etc.)

### Email Personalization Variables

**For Each Email, Ensure**:
- [ ] Correct recipient email address
- [ ] Correct contact first name used in greeting
- [ ] Correct club name mentioned
- [ ] Calendly link embedded
- [ ] Sender phone number filled in
- [ ] Company website included
- [ ] Mobile formatting verified

### Send Configuration

**Sending Parameters**:
- [ ] **Send Time**: 2:00 PM EST on Aug 24, 2026
- [ ] **Send Method**: Batch send all 4 together (not scheduled)
- [ ] **From Name**: "Business Development Lead, Celadon Tennis"
- [ ] **From Email**: tnguyen205@dxc.com
- [ ] **Reply-To**: tnguyen205@dxc.com
- [ ] **Subject Lines**: Version A - "Partnership Opportunity with [Club Name]"

**Pre-Send Verification**:
- [ ] All 4 emails created and saved as drafts
- [ ] All personalizations complete
- [ ] Test send to self successful
- [ ] Formatting verified on desktop
- [ ] Formatting verified on mobile
- [ ] Links clickable and working
- [ ] Calendly link embedding verified
- [ ] No placeholder brackets remaining [like this]

---

## STEP 4: CREATE CALENDLY & RESPONSE TRACKING (15 Minutes)

### Calendly Setup

**If Calendly Account Doesn't Exist**:
1. [ ] Go to calendly.com
2. [ ] Sign up with email: tnguyen205@dxc.com
3. [ ] Connect calendar (Google Calendar recommended)
4. [ ] Set up meeting type:

**Meeting Configuration**:
```
Name: "Partnership Discovery Call"
Duration: 30 minutes
Time zone: America/New_York (EST)
Availability: Aug 26-30, 2026
  - Monday: 10 AM - 12 PM, 2 PM - 4 PM
  - Tuesday: 10 AM - 12 PM, 2 PM - 4 PM
  - Wednesday: 10 AM - 12 PM, 2 PM - 4 PM
  - Thursday: 10 AM - 12 PM, 2 PM - 4 PM
  - Friday: 10 AM - 12 PM, 2 PM - 4 PM

Confirmation: Email confirmation to both parties
Reminder: 24 hours before meeting
```

**Calendly Link**:
1. [ ] Copy meeting link from Calendly
2. [ ] Example format: calendly.com/username/partnership-call
3. [ ] Insert into all 4 emails (in Step 3)
4. [ ] Test link by clicking from sent email

**Calendar Sync Verification**:
- [ ] Calendly synced with Google Calendar ✓
- [ ] Your unavailable times marked on Calendly
- [ ] Buffer time between meetings (15 min recommended)
- [ ] Time zone set to EST

---

### Response Tracking Dashboard Setup

**Using HubSpot Dashboard**:
1. [ ] Navigate to HubSpot > Reports > Dashboards
2. [ ] Create new dashboard: "Tennis Club Campaign - Aug 24-28"
3. [ ] Add dashboard cards:

**Card 1: Email Delivery Status**
- [ ] Metric: Emails sent vs delivered
- [ ] Target: 4 sent, 4 delivered (100%)
- [ ] Filter: Campaign = "Tennis Clubs Aug 24"

**Card 2: Email Engagement**
- [ ] Metric: Opens and clicks by email
- [ ] Target: 50%+ open rate in 24 hours
- [ ] Update: Real-time

**Card 3: Contact Status**
- [ ] Metric: Contacts by engagement tier
- [ ] Tiers: Tier 1 (opened), Tier 2 (clicked), Tier 3 (replied), Tier 4 (no action)
- [ ] Update: Real-time

**Card 4: Calendar Invites**
- [ ] Metric: Calendly bookings
- [ ] Target: 2-3 calls scheduled by Aug 26
- [ ] Update: Real-time from Calendly

**Card 5: Response Timeline**
- [ ] Metric: Time from send to first response
- [ ] Track: First open, first click, first reply
- [ ] Format: Timeline view

**Alternative: Spreadsheet Dashboard**
- [ ] Use prospect_tracking_template.csv
- [ ] Create Google Sheet copy
- [ ] Set up formulas to calculate:
  - [ ] Opens: =IF(Initial_Open_DateTime > "", "Yes", "No")
  - [ ] Clicks: =IF(Click_Count > 0, "Yes", "No")
  - [ ] Responses: =IF(Reply_Received_DateTime > "", "Yes", "No")
  - [ ] Engagement_Score: Sum of engagement points
  - [ ] Engagement_Tier: IF formula based on score
- [ ] Create summary tab with metrics

---

### Slack Integration (Optional but Recommended)

**Setup Alerts for**:
- [ ] New email opens detected
- [ ] New email responses received
- [ ] Calendar invites accepted
- [ ] High-engagement leads (Tier 1)

**HubSpot Slack Integration**:
1. [ ] Go to HubSpot > Integrations > Slack
2. [ ] Authorize HubSpot app for Slack
3. [ ] Set up notifications:
   - [ ] Channel: #campaigns or #tennis-outreach
   - [ ] Alert trigger: Email open
   - [ ] Alert trigger: Email click
   - [ ] Alert trigger: New reply
4. [ ] Test with sample alert

**Manual Alternative**:
- [ ] Set up email forwarding rules for responses
- [ ] Forward responses to Slack via email-to-Slack integration
- [ ] Check dashboard manually every 15 minutes (Aug 24, 3-5 PM)

---

## STEP 5: TEST & VERIFY (10 Minutes)

### Pre-Launch Testing Checklist

**Email System Testing**:
- [ ] Send test email to self (all 4 emails)
- [ ] Verify email arrives within 5 minutes
- [ ] Verify all formatting intact
- [ ] Verify all links clickable
- [ ] Verify Calendly link embedding
- [ ] Check on desktop display
- [ ] Check on mobile display (scroll through)
- [ ] Verify sender name and email correct
- [ ] Verify reply-to address correct

**Calendly Testing**:
- [ ] Click Calendly link from test email
- [ ] Verify link opens correctly
- [ ] Select test meeting time
- [ ] Verify calendar integration (should not actually book)
- [ ] Check confirmation email format
- [ ] Verify time zone displays correctly

**Dashboard Testing**:
- [ ] Dashboard loads without errors
- [ ] All cards display data (should show from test emails)
- [ ] Refresh dashboard - metrics update correctly
- [ ] Export/download functionality works
- [ ] Mobile dashboard view readable (if applicable)

**Tracking Verification**:
- [ ] Open test email (should register as "open" in dashboard)
- [ ] Click Calendly link (should register as "click")
- [ ] Verify data appears in dashboard within 2 minutes
- [ ] Verify Slack alert received (if configured)

**Final Sign-Off**:
- [ ] All tests passed
- [ ] No errors or broken links
- [ ] System ready for 2:00 PM send
- [ ] Backup manual tracking verified

---

## TROUBLESHOOTING COMMON ISSUES

### Email Platform Issues

**Issue**: "Email bounces to recipients"
- Check: Email addresses in prospect list
- Action: Verify against CEL32_PROSPECT_TRACKING_VERIFIED.csv
- Fix: Remove bounced emails, verify correct addresses

**Issue**: "Formatting looks wrong on mobile"
- Check: Email template HTML (too wide?)
- Action: Test email view on actual phone
- Fix: Use platform's mobile preview tool, adjust width to 600px max

**Issue**: "Calendly link not embedding"
- Check: Calendly link format (should be https://...)
- Action: Try direct link without embed code
- Fix: Copy/paste URL directly into email body

**Issue**: "Dashboard not updating in real-time"
- Check: Integration connected and authorized
- Action: Wait 2-3 minutes and refresh (not instant)
- Fix: Check platform API status, re-authorize if needed

### Calendar Issues

**Issue**: "Calendly shows wrong time zone"
- Check: Calendly account settings > Time Zone
- Action: Verify set to America/New_York (EST)
- Fix: Change timezone and resync

**Issue**: "Slots not showing availability"
- Check: Calendar is synced and showing your events
- Action: Manually block unavailable times on Calendly
- Fix: Edit meeting type > set specific hours

### Tracking Issues

**Issue**: "Not seeing email opens in dashboard"
- Check: Email open tracking enabled in settings
- Action: Wait 2 minutes after sending (not instant)
- Fix: Manually click email to test tracking pixel

**Issue**: "Prospect data not showing in dashboard"
- Check: Prospects imported into correct list
- Action: Verify 4 prospects in contact database
- Fix: Manually add contacts if import failed

---

## PHASE 3 SUCCESS CRITERIA

**All of these must be TRUE to proceed to Phase 4**:

- [ ] Email platform selected and account created
- [ ] 4 personalized emails loaded into platform
- [ ] All placeholders filled in (phone, Calendly, website)
- [ ] Test email sent to self successfully
- [ ] Test email displays correctly on desktop
- [ ] Test email displays correctly on mobile
- [ ] All links in test email clickable and working
- [ ] Calendly link embedded and functional
- [ ] Calendly meeting bookable and working
- [ ] Dashboard created and tracking data
- [ ] Tracking shows test email as "open" and "click"
- [ ] Send is scheduled/queued for Aug 24 @ 2:00 PM
- [ ] Backup manual tracking spreadsheet ready
- [ ] No errors or broken links remaining

**If ANY item is FALSE**: Fix before proceeding to Phase 4

---

## HANDOFF TO PHASE 4

**What Phase 4 Needs**:
1. ✅ 4 emails ready to send (platform configured)
2. ✅ Calendly link confirmed working
3. ✅ Dashboard live and tracking
4. ✅ Test sends verified successful
5. ✅ All systems operational

**Deliverables**:
- Email platform account (HubSpot/Mailchimp/Gmail)
- 4 emails queued in platform
- Calendly meeting link (embedded in emails)
- Dashboard dashboard with 5+ tracking cards
- Backup spreadsheet tracking sheet

**Timeline**: Phase 3 must be COMPLETE by 9:00 PM for Phase 4 approval by 10:00 PM

---

## NEXT: PHASE 4 - TEAM BRIEFING & GO-LIVE

**When Phase 3 Complete**:
1. Brief Business Development Lead on timeline
2. Review all systems operational
3. Get final GO/NO-GO sign-off
4. Document any last-minute adjustments
5. Confirm all are ready for Aug 24 @ 2:00 PM launch

---

**Phase 3 Setup Guide**: ✅ COMPLETE  
**Ready to Execute**: YES  
**Timeline**: Follow critical path above (1 hour)

🚀 **Next Step: Phase 4 Team Briefing & Final Approval**

