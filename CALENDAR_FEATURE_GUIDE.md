# Enhanced Calendar Settings - Feature Guide

## Overview
The calendar settings feature gives you complete control over appointment availability. You can manage working hours, block entire days, or block specific time slots on any date.

## Features

### 1. **Working Hours Configuration**
Set regular weekly working hours for each day of the week.

**How to use:**
- Check/uncheck days to enable/disable
- Set start and end times for each enabled day
- Perfect for regular business hours (e.g., Monday-Friday 9am-5pm)

**Example:**
- Monday-Friday: 09:00 - 17:00 (enabled)
- Saturday-Sunday: Closed (disabled)

---

### 2. **Break Times**
Set recurring breaks that apply every working day (like lunch breaks).

**How to use:**
- Click "Add Break" button
- Enter break label (e.g., "Lunch Break")
- Set start and end times
- These breaks apply to ALL working days

**Example:**
- Lunch Break: 13:00 - 14:00 (daily)
- Tea Break: 10:30 - 10:45 (daily)

**Note:** Patients won't see these time slots when booking.

---

### 3. **Blocked Dates (Full Day)**
Block entire days when the doctor is completely unavailable.

**Use cases:**
- Vacations / Leave days
- Conferences / Training
- Personal days
- Public holidays

**How to use:**
1. Click "Select Date" calendar
2. Pick the date to block
3. Add a reason (optional but helpful for your records)
4. Click "Block Date"

**Quick Action:** Click "Add SA Public Holidays" to automatically add all South African public holidays for the current year!

**SA Public Holidays included:**
- New Year's Day (Jan 1)
- Human Rights Day (Mar 21)
- Good Friday (varies)
- Family Day (varies)
- Freedom Day (Apr 27)
- Workers' Day (May 1)
- Youth Day (Jun 16)
- National Women's Day (Aug 9)
- Heritage Day (Sep 24)
- Day of Reconciliation (Dec 16)
- Christmas Day (Dec 25)
- Day of Goodwill (Dec 26)

**Important:** The system automatically adjusts dates to the current year, so you can add holidays for any year!

---

### 4. **Blocked Time Slots (Specific Times)** ⭐ NEW
Block specific time periods on specific dates - perfect for one-off events!

**Use cases:**
- Doctor has a meeting from 10:00-11:00 on March 15th
- Emergency appointment blocking a specific slot
- Conference call during normal working hours
- Doctor leaving early on a specific day

**How to use:**
1. Select the specific date
2. Set start time (e.g., 10:00)
3. Set end time (e.g., 11:00)
4. Add reason (e.g., "Board Meeting")
5. Click "Block Time"

**Example scenarios:**

**Scenario 1:** Emergency on Tuesday
- Doctor works normally 9am-5pm on Tuesdays
- But on March 12th, she has a dentist appointment from 2pm-3pm
- Block: March 12, 14:00-15:00, "Dentist appointment"
- Result: Patients can book all normal slots EXCEPT 2pm-3pm on that specific day

**Scenario 2:** Half day on specific date
- Normal working hours: 9am-5pm
- On April 5th, doctor leaves at 1pm
- Block: April 5, 13:00-17:00, "Leaving early"
- Result: Only morning slots available on April 5th

**Scenario 3:** Meeting in the middle of day
- On May 20th, there's a staff meeting 11am-12pm
- Block: May 20, 11:00-12:00, "Staff meeting"
- Result: All slots available except 11am-12pm on that day

---

## How It All Works Together

The system checks availability in this order:

1. ✅ **Is it a working day?** (Check working hours settings)
2. ✅ **Is the entire day blocked?** (Check blocked dates)
3. ✅ **Is it during a break time?** (Check break times)
4. ✅ **Is this specific time slot blocked?** (Check blocked time slots)

If all checks pass, the time slot is shown to patients!

---

## Real-World Usage Examples

### Example 1: Doctor Going on Vacation
**Scenario:** Doctor on leave from Dec 20-28

**Steps:**
1. Go to "Blocked Dates (Full Day)"
2. Add each date from Dec 20 to Dec 28
3. Reason: "Annual leave"

**Quick tip:** You can add them one by one, or use the date picker multiple times

**Result:** No appointments can be booked for these dates at all

---

### Example 2: Doctor Taking Long Weekend
**Scenario:** Doctor off Friday Dec 15 and Monday Dec 18

**Steps:**
1. Block Dec 15 (full day): "Long weekend"
2. Block Dec 18 (full day): "Long weekend"

**Result:** Normal hours resume Tuesday Dec 19

---

### Example 3: Random Meeting on Specific Day
**Scenario:** Monthly board meeting first Tuesday of every month, 2pm-4pm

**Steps every month:**
1. Go to "Blocked Time Slots"
2. Select first Tuesday of month
3. Set 14:00 - 16:00
4. Reason: "Board meeting"
5. Click "Block Time"

**Result:** All other times on that Tuesday are still available

---

### Example 4: Doctor Leaving Early One Day
**Scenario:** Doctor needs to leave at 2pm on March 10 for personal matter

**Steps:**
1. Go to "Blocked Time Slots"
2. Select March 10
3. Set 14:00 - 17:00 (block entire afternoon)
4. Reason: "Personal matter"

**Result:** Morning appointments (9am-2pm) still available on March 10

---

## Tips & Best Practices

### Planning Ahead
- Add your vacations as soon as you know the dates
- Add public holidays at the start of each year (one click!)
- Review your calendar weekly for any upcoming blocked times

### Clear Reasons
- Always add a reason for blocked times (helps you remember why)
- Use consistent naming (e.g., "Meeting", "Leave", "Training")
- The reason is ONLY for admin - patients don't see it

### Full Day vs. Time Slot?
- **Use Full Day Block** when doctor is completely unavailable (vacation, sick day, public holiday)
- **Use Time Slot Block** when doctor is partially available (meeting in middle of day, leaving early, starting late)

### Managing Holidays
- Click "Add SA Public Holidays" once at start of year
- No need to add them manually!
- System automatically uses current year

### Testing Before Going Live
- After making changes, click "Save All Settings"
- Go to the public booking page
- Try booking on blocked dates - they should be unavailable
- Try booking during blocked times - they shouldn't appear

---

## What Patients See

### When date is fully blocked:
- Date is grayed out in calendar picker
- Cannot be selected at all
- No message shown (just unavailable)

### When time slot is blocked:
- Date IS selectable
- Available time slots shown normally
- Blocked time slot simply doesn't appear in list
- Patient doesn't know WHY it's missing (just not an option)

**Example:**
- Normal hours: 9am, 10am, 11am, 12pm, 2pm, 3pm, 4pm
- Blocked: 11am-12pm
- Patient sees: 9am, 10am, 2pm, 3pm, 4pm (seamless experience)

---

## Troubleshooting

### "No time slots showing for a specific date"
**Possible causes:**
1. That day of week is disabled in working hours
2. Entire day is blocked
3. All individual time slots are blocked
4. Date is in the past or today (bookings require 1 day advance)

**Fix:** Check each setting and verify the date

### "Blocked time still showing to patients"
**Cause:** Forgot to click "Save All Settings"

**Fix:**
1. Make your changes
2. Scroll to bottom
3. Click the big green "Save All Settings" button
4. Wait for success message

### "Can't block a specific time"
**Possible cause:** Selected date is in the past

**Fix:** Time slots can only be blocked for future dates

### "Accidentally blocked wrong date/time"
**Fix:** Simply click the red "Remove" button next to the blocked item

---

## Reminders

✅ Always click **"Save All Settings"** after making changes

✅ Changes take effect immediately for new bookings

✅ Existing appointments are NOT affected by blocking (honored)

✅ You can remove any blocked date/time at any time

✅ Public holidays need to be re-added each year

---

## Access

**URL:** http://localhost:5175/admin/calendar

**Login:** Use your admin credentials

**Location:** Admin Dashboard → "Calendar Settings" (in sidebar)

---

## Need Help?

- Check if settings are saved (look for green success message)
- Test from patient's perspective (go to public booking page)
- Review all blocking sections to ensure no conflicts
- Contact support if issues persist

---

**Last Updated:** January 2025

**Feature Status:** Fully Functional ✅
