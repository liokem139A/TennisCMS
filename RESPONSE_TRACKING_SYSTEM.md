# Response Tracking & Engagement Categorization System
**CEL-32: Response Management Framework**

---

## Overview

This system provides the framework for capturing, categorizing, and actioning all partnership outreach responses. It enables automated and manual tracking of email engagement signals to ensure no lead falls through the cracks.

---

## 1. Response Data Collection Points

### 1.1 Automated Signals (From Email Platform)
- **Email opens**: Timestamp, number of opens, device type
- **Link clicks**: Which links clicked, click count, time of click
- **Bounce/delivery**: Hard bounce, soft bounce, delivery confirmation
- **Spam complaints**: If marked as spam
- **Unsubscribe events**: Opt-out requests

### 1.2 Manual Signals (Captured by Team)
- **Email replies**: Response content, sentiment, questions asked
- **Calendar acceptances**: Meeting accepted, time confirmed
- **Phone calls**: Inbound/outbound, call duration, notes
- **LinkedIn engagement**: Accepts connection, messages, comments
- **Website engagement**: Return visits, resource downloads
- **Reference requests**: Asking for case studies, references

### 1.3 Integration Points
- **Email platform** → Automated data sync (Mailchimp/HubSpot)
- **CRM** → Central repository (Salesforce/Pipedrive/HubSpot)
- **Calendar system** → Meeting acceptance tracking
- **Phone system** → Call logging (if available)
- **Spreadsheet** → Manual tracking backup

---

## 2. Engagement Scoring Matrix

### 2.1 Points System

| Signal | Points | Category | Details |
|--------|--------|----------|---------|
| Email delivered | +5 | Baseline | Confirms valid email |
| Email opened (first) | +10 | Awareness | Shows subject line resonated |
| Email opened (2x) | +10 | Interest | Revisited content |
| Email opened (3x+) | +15 | High Interest | Multiple review passes |
| Link clicked | +25 | Engagement | Shows active interest |
| Multiple links clicked | +15 | High Intent | Deep engagement with content |
| Email reply | +50 | Strong Intent | Direct engagement |
| Positive reply tone | +25 | Qualifier | Shows genuine interest |
| Meeting request | +100 | Commitment | Ready to invest time |
| Calendar accepted | +50 | Confirmed Engagement | Call is locked in |
| LinkedIn connection | +15 | Secondary Channel | Adds touchpoint |
| LinkedIn message reply | +35 | Multi-channel Engagement | Responds across platforms |
| Website visit after email | +20 | Action | Doing research |
| Referral provided | +75 | Advocate Signal | Will recommend |

### 2.2 Tier Calculation

**Tier 1: High Engagement (75+ points)**
- Direct meeting request OR
- Multiple opens + multiple clicks + positive reply OR
- Calendar accepted + engaged discussion

**Tier 2: Moderate Engagement (35-74 points)**
- Multiple opens + at least one click OR
- Single open + positive reply (without meeting ask) OR
- Clear interest without commitment

**Tier 3: Low Engagement (5-34 points)**
- Single open, no clicks OR
- Click activity without open OR
- Marginal engagement signals

**Tier 4: No Engagement (0-4 points)**
- Email delivered but no opens within 72 hours OR
- Hard bounce OR
- Explicit unsubscribe

### 2.3 Tier Reassignment Rules
- **Can move up**: New signal (e.g., Tier 3 → Tier 2 with reply)
- **Moves down after**: 7 days without new signals (e.g., Tier 2 → Tier 3)
- **Stuck in Tier 4**: Only moves up with proactive outreach acceptance

---

## 3. Response Categorization Logic

### 3.1 Email Reply Analysis

#### Positive Indicators (High Priority)
```
Keywords: "interested", "love to", "when can", "let's talk", 
"this looks great", "excited", "perfect timing", "absolutely", 
"yes", "sounds good", "definitely", "let's schedule"

Action: → TIER 1 - Immediate meeting scheduling
Timeline: Contact within 2 hours
```

#### Neutral/Exploratory (Moderate Priority)
```
Keywords: "interesting", "curious", "tell me more", "what's involved",
"could be useful", "seems relevant", "maybe", "possibly", 
"worth exploring", "happy to discuss"

Action: → TIER 2 - Personalized deeper engagement
Timeline: Contact within 24 hours
```

#### Objection/Concern (Escalated)
```
Keywords: "busy", "not right now", "not a fit", "already have",
"insufficient budget", "timeline doesn't work", "not interested"

Action: → Address objection specifically OR move to Tier 3
Timeline: Objection response within 4 hours if relationship-critical
```

#### Auto-Reply/Out-of-Office (Tracking)
```
Indicator: Auto-reply message detected
Action: → Mark as "awaiting response" - DO NOT follow up immediately
Timeline: Follow up when person returns (add buffer of 2 days)
```

### 3.2 Response Content Template

Create structured response log entry:
```
Date Received: [YYYY-MM-DD HH:MM]
From: [First Name Last Name, Title]
Company: [Company Name]
Response Type: [Reply/Calendar Accept/Phone Call/LinkedIn/Other]
Engagement Tier: [1/2/3/4]
Points Earned: [#]

Summary of Response:
[1-2 sentence summary of key message]

Sentiment Analysis:
☐ Positive (interested, wants to move forward)
☐ Neutral (curious, exploring)
☐ Negative (objection, not interested)
☐ Administrative (auto-reply, out of office)

Key Questions/Objections Raised:
[List any issues to address]

Next Action Required:
[Specific action, owner, timeline]

Follow-up Owner: [Team member assigned]
Follow-up Due Date: [Date]
```

### 3.3 Manual Override Capability

**When to manually override automated tier:**
- Internal knowledge: "We've talked to this person before, known contact"
- Relationship context: "This is the CEO, deprioritize auto-response"
- Industry signals: "They just announced major funding, bump up priority"
- Contact confusion: "Wrong email, forwarded by assistant, reset tier"

**Override process:**
1. Document reason for override
2. Update tier manually in CRM
3. Notify team of reason
4. Reassess after next engagement signal

---

## 4. Multi-Channel Response Capture

### 4.1 Email Responses (Primary)
- **Monitor**: Mailchimp/HubSpot inbox
- **Frequency**: Check every 2 hours during business hours
- **Log**: Forward/screenshot to CRM immediately
- **Action**: Process within 4 hours

### 4.2 LinkedIn Responses
- **Monitor**: Your LinkedIn message requests
- **Frequency**: Daily check
- **Log**: Screenshot + manual CRM entry
- **Action**: Process same day

### 4.3 Calendar Responses
- **Monitor**: Calendar acceptance notifications
- **Frequency**: Real-time notifications enabled
- **Log**: Auto-sync from calendar → CRM
- **Action**: Add to follow-up schedule immediately

### 4.4 Phone Responses (If Applicable)
- **Monitor**: Call logs, voicemail
- **Frequency**: Check throughout day
- **Log**: Call report in CRM
- **Action**: Document notes within 1 hour

### 4.5 Website Engagement
- **Monitor**: Analytics dashboard (Google Analytics/Mixpanel)
- **Frequency**: Daily review
- **Log**: Email-to-website visit correlation in CRM
- **Action**: Trigger follow-up if resource downloaded

---

## 5. Response Timeline & SLAs

### 5.1 Initial Contact to First Response

| Hours | Status | Action |
|-------|--------|--------|
| 0-24 | No open | Monitor, no action yet |
| 24-48 | No open | Monitor + send Tier 2 follow-up (if enough list) |
| 48-72 | No open | Begin Tier 3 re-engagement messaging |
| 72+ | No open + no reply | Multi-channel attempt, then evaluate removal |

### 5.2 Response Processing SLAs

| Response Type | SLA | Owner |
|---------------|-----|-------|
| Direct email reply | 4 hours | Business Dev Lead |
| Positive email reply | 2 hours | Business Dev Lead |
| Meeting request | 1 hour | Business Dev Lead |
| Calendar acceptance | 30 min | Business Dev Lead |
| LinkedIn message | 24 hours | Business Dev Lead |
| Objection email | 4 hours | Escalate to manager if product Q |

### 5.3 Follow-up Action SLAs

| Tier | First Follow-up | Second Follow-up | Max Contacts |
|-----|-----------------|------------------|--------------|
| Tier 1 | 2 hours | N/A (if meet scheduled) | 1 |
| Tier 2 | 24 hours | 48-72 hours | 2 |
| Tier 3 | 48 hours | 72 hours | 2 |
| Tier 4 | 72 hours | 7 days | 3 |

---

## 6. Response Database Schema

### 6.1 Minimum Tracking Fields

**Prospect Information**
- First Name
- Last Name
- Title
- Company Name
- Email Address
- LinkedIn Profile (optional)
- Phone (optional)
- Department

**Outreach Information**
- Email Sent Date/Time
- Email Subject Line
- Email Version (A/B test)
- Initial Engagement Tier Assignment

**Engagement Signals**
- Opens (Count, Timestamps)
- Clicks (Which links, Count, Timestamps)
- Reply Received (Y/N, Date, Content)
- Calendar Accepted (Y/N, Meeting Time)
- Other Signals (LinkedIn, phone, website)

**Current Status**
- Current Tier (1/2/3/4)
- Points Score
- Last Engagement Date
- Next Action Required
- Next Action Due Date
- Action Owner

**Outcomes**
- Discovery Call Scheduled (Y/N)
- Call Date/Time
- Call Outcome (Hot/Warm/Cold/Dead)
- Next Phase (Proposal/Demo/Pilot/Dead)

---

## 7. Real-time Dashboarding

### 7.1 Live Metrics (Updated Hourly)

```
╔══════════════════════════════════════════════════════════╗
║         PARTNERSHIP OUTREACH - ENGAGEMENT DASHBOARD       ║
╠══════════════════════════════════════════════════════════╣
║ Campaign Status: [Day X/5] [Aug 24-28]                  ║
╠══════════════════════════════════════════════════════════╣
║ DELIVERY                                                  ║
║ Total Sent:        [N] | Delivered: [N] | Bounce: [N]   ║
║ Delivery Rate:     [X%]                                  ║
╠══════════════════════════════════════════════════════════╣
║ ENGAGEMENT                                                ║
║ Opens:            [N] ([X%]) | Avg Opens/Recipient: [X] ║
║ Clicks:           [N] ([X%]) | Avg Clicks/Recipient: [X] ║
║ Replies:          [N] ([X%])                            ║
║ Calendar Accept:  [N] ([X%])                            ║
╠══════════════════════════════════════════════════════════╣
║ TIER DISTRIBUTION                                         ║
║ Tier 1 (Hot):     [N] prospects | [N] calls scheduled   ║
║ Tier 2 (Warm):    [N] prospects | [N] follow-ups due   ║
║ Tier 3 (Cool):    [N] prospects | [N] re-engage needed ║
║ Tier 4 (Cold):    [N] prospects | [N] multi-channel     ║
╠══════════════════════════════════════════════════════════╣
║ CONVERSION FUNNEL                                         ║
║ Sent → Opened:    [X%] | Opened → Clicked: [X%]        ║
║ Clicked → Replied: [X%] | Replied → Call: [X%]         ║
╠══════════════════════════════════════════════════════════╣
║ DISCOVERY CALLS                                           ║
║ Scheduled:  [N] | Completed: [N] | Pipeline Value: [TBD]║
╚══════════════════════════════════════════════════════════╝
```

### 7.2 Alert Triggers

Send Slack/email notifications when:
- Tier 1 response received (within 30 min)
- 5+ calendar acceptances in one day
- Open rate falls below 25% (check send time/list quality)
- Bounce rate exceeds 5% (flag list quality issue)
- No responses in first 24 hours (consider emergency rereach)

---

## 8. Response Categorization Decision Tree

```
RESPONSE RECEIVED
       ↓
   [Type Check]
   ├─→ Hard Bounce → Remove from list, flag bad email
   ├─→ Soft Bounce → Mark for retry, investigate
   ├─→ Auto-reply → Log, reschedule follow-up
   └─→ Manual Reply → [Continue below]
       ↓
   [Sentiment Analysis]
   ├─→ POSITIVE
   │   ├─→ Requests meeting? → TIER 1, schedule immediately
   │   ├─→ Asks questions? → TIER 1, answer + propose call
   │   └─→ Shows interest? → TIER 2, send deeper resource
   ├─→ NEUTRAL
   │   ├─→ "Tell me more?" → TIER 2, personalized deep-dive
   │   ├─→ "Not sure..." → TIER 2, add social proof
   │   └─→ "Need to think" → TIER 2, set follow-up reminder
   ├─→ NEGATIVE
   │   ├─→ "Not a fit" → TIER 4, document reason, don't pursue
   │   ├─→ "Too busy" → TIER 3, try lighter touch in 2 weeks
   │   ├─→ "Already have..." → TIER 4, move to competitive watch
   │   └─→ "Budget issue" → TIER 3, note for next cycle
   └─→ ADMINISTRATIVE
       ├─→ Out of office → Wait for return, then TIER 2
       ├─→ Wrong email → Remove, note contact issue
       └─→ Forwarded contact → TIER 2, new person rules apply
```

---

## 9. Integration Workflow

### Step 1: Email Sends
- All contacts exported from CRM
- Mailchimp configured with UTM tracking
- Automated sync turned on

### Step 2: Engagement Capture
- Mailchimp → CRM: Real-time open/click sync
- Manual: Check inbox every 2 hours
- CRM: Auto-scores based on engagement matrix

### Step 3: Tier Assignment
- Automated tier based on point score
- Manual override if needed (document reason)
- Tier triggers appropriate follow-up sequence

### Step 4: Response Processing
- If reply received: Manual review + categorization
- Action assignment + SLA notification
- Next steps documented in contact record

### Step 5: Reporting
- Dashboard updates hourly
- Daily briefing prepared by EOD
- Weekly summary analysis

---

## 10. Quality Control Checklist

Before escalating a response to follow-up:
- [ ] Response is attributed to correct prospect
- [ ] Sentiment analysis is accurate
- [ ] Tier assignment is justified by points score
- [ ] No duplicate follow-up in progress
- [ ] Personalization elements are accurate
- [ ] Compliance (GDPR/CAN-SPAM) verified

---

## Success Criteria for This System

✓ **Responsiveness**: 95% of Tier 1 responses actioned within 2 hours
✓ **Accuracy**: Tier assignment matches sentiment analysis 90%+ of time
✓ **Coverage**: 100% of responses tracked within 24 hours
✓ **Conversion**: 15%+ of Tier 1 → scheduled discovery calls
✓ **Safety**: Zero compliance violations, all GDPR opt-outs honored

