# Calendar Management Feature Guide

## Overview
The admin dashboard now includes a powerful **Calendar Settings** page that allows you to control when appointments can be booked on your website. This gives you complete control over your availability.

## Features

### 1. Working Hours Configuration
Set your available hours for each day of the week:
- Enable/disable specific days
- Set custom start and end times for each day
- Different hours for different days (e.g., shorter hours on Saturday)

### 2. Appointment Duration
Choose how long each appointment should be:
- 15 minutes
- 30 minutes (default)
- 45 minutes
- 1 hour
- 1.5 hours
- 2 hours

### 3. Break Times
Add multiple break periods during the day:
- Lunch breaks
- Personal time
- Administrative breaks
- Each break can have a custom label, start time, and end time

### 4. Blocked Dates
Block specific dates when you're unavailable:
- Holidays
- Vacation days
- Conference days
- Personal days
- Each blocked date can have a reason/note

## How to Use

### Accessing Calendar Settings

1. **Login to Admin Dashboard**
   - Go to `/admin/login`
   - Username: `admin`
   - Password: `admin123`

2. **Navigate to Calendar Settings**
   - Click "Calendar Settings" in the sidebar
   - Or go to `/admin/calendar`

### Setting Working Hours

1. **For each day of the week:**
   - ✅ Check the box to enable that day
   - ⬜ Uncheck to disable (no appointments that day)
   - Set "From" time (start of day)
   - Set "To" time (end of day)

2. **Example Configurations:**

   **Standard Business Hours:**
   ```
   Monday-Friday: 9:00 AM - 5:00 PM (enabled)
   Saturday-Sunday: Disabled
   ```

   **Extended Hours:**
   ```
   Monday-Thursday: 8:00 AM - 6:00 PM
   Friday: 8:00 AM - 4:00 PM
   Saturday: 9:00 AM - 1:00 PM
   Sunday: Disabled
   ```

### Setting Appointment Duration

1. Click the dropdown under "Appointment Duration"
2. Select your preferred time slot length
3. This affects how many appointments can fit in a day

**Example:**
- If you work 9 AM - 5 PM (8 hours = 480 minutes)
- With 30-minute slots = 16 available slots per day
- With 1-hour slots = 8 available slots per day

### Adding Break Times

1. Click the **"Add Break"** button
2. For each break:
   - Enter a label (e.g., "Lunch", "Admin Time")
   - Set start time
   - Set end time
3. Click the trash icon to remove a break
4. Patients won't be able to book during break times

**Example Break Times:**
```
Lunch Break: 1:00 PM - 2:00 PM
Morning Break: 10:30 AM - 10:45 AM
Admin Time: 4:00 PM - 4:30 PM
```

### Blocking Specific Dates

1. **To block a date:**
   - Click the date picker under "Block a Date"
   - Select the date you want to block
   - (Optional) Add a reason (e.g., "On vacation", "Conference")
   - Click **"Block Date"**

2. **To unblock a date:**
   - Find the date in the "Currently Blocked Dates" list
   - Click the **"Remove"** button

**Use Cases:**
- ✈️ Vacation: Block all dates you'll be away
- 📅 Conference: Block conference days
- 🏥 Personal: Block personal/medical appointments
- 🎉 Holidays: Block public holidays

### Saving Your Settings

**IMPORTANT:** Always click the **"Save All Settings"** button at the bottom of the page!

- Green success message will appear when saved
- Settings are stored in localStorage (browser storage)
- Changes take effect immediately on the booking page

## How It Affects Patient Bookings

### What Patients See

When a patient goes to book an appointment on your website:

1. **Calendar (Date Selection):**
   - ❌ Disabled days show as grayed out (can't click)
   - ❌ Blocked dates show as grayed out
   - ✅ Available days show as clickable
   - Can only select from available, unblocked dates

2. **Time Selection:**
   - Only shows time slots during your working hours
   - Automatically excludes break times
   - Respects your appointment duration setting
   - No slots shown for disabled days or blocked dates

### Example Scenario

**Your Settings:**
```
Working Hours:
  Monday: 9:00 AM - 5:00 PM
  Tuesday: 9:00 AM - 5:00 PM
  Wednesday: CLOSED
  Thursday: 9:00 AM - 5:00 PM
  Friday: 9:00 AM - 3:00 PM
  Weekend: CLOSED

Appointment Duration: 30 minutes

Break Times:
  Lunch: 1:00 PM - 2:00 PM

Blocked Dates:
  December 25, 2024 (Christmas)
  December 26, 2024 (Boxing Day)
  January 1, 2025 (New Year)
```

**Patient Experience:**
- Can select: Monday, Tuesday, Thursday, Friday (not Wed/weekends)
- Cannot select: Dec 25-26, Jan 1
- Time slots on Monday: 9:00, 9:30, 10:00... 12:30, 2:00, 2:30... 4:30
  - (No slots from 1:00-2:00 PM due to lunch break)
- Time slots on Friday: 9:00, 9:30, 10:00... 12:30, 2:00, 2:30
  - (Ends at 2:30 because you close at 3:00)

## Tips & Best Practices

### Planning Your Schedule

1. **Be Realistic**
   - Leave buffer time between appointments
   - Consider travel time if doing both virtual and in-person
   - Allow time for emergencies or running late

2. **Break Times**
   - Schedule regular breaks throughout the day
   - Include time for lunch
   - Add admin time for notes/paperwork

3. **Appointment Duration**
   - 30 minutes: Quick consultations
   - 1 hour: Standard consultations
   - 1.5-2 hours: In-depth assessments

### Managing Time Off

1. **Plan Ahead**
   - Block vacation dates as soon as you know them
   - Add buffer days before/after vacation
   - Block holidays early

2. **Last-Minute Changes**
   - Need to block tomorrow? Just add the date and save
   - Changes are immediate - no delay
   - Remember to save!

3. **Emergency Closures**
   - Disable specific days quickly
   - Or block the date with reason "Emergency closure"

### Seasonal Adjustments

**Summer Hours (Example):**
```
Friday: 9:00 AM - 1:00 PM (instead of 5:00 PM)
Add more blocked dates for vacation
```

**Holiday Season (Example):**
```
Block: Dec 23 - Jan 2
Enable Saturday mornings for catch-up appointments
```

## Technical Details

### Data Storage
- Settings saved in browser's localStorage
- Key: `calendarSettings`
- Persists across browser sessions
- Cleared if browser data is cleared

### How It Works
1. Admin sets calendar settings and clicks "Save"
2. Settings stored in localStorage
3. BookingModal component reads these settings
4. Calendar and time slots dynamically adjust
5. Patients only see available slots

### Default Settings (if not configured)
```javascript
Working Hours: Monday-Friday, 8:00 AM - 5:00 PM
Weekend: Closed
Appointment Duration: 30 minutes
Break Times: 1:00 PM - 2:00 PM (Lunch)
Blocked Dates: None
```

## Troubleshooting

### Issue: Changes not appearing on booking page
**Solution:**
- Make sure you clicked "Save All Settings"
- Refresh the booking page
- Check browser console for errors

### Issue: Patients can still book on blocked dates
**Solution:**
- Verify the date was added to blocked dates list
- Ensure you saved the settings
- Check the date is actually in the future

### Issue: No time slots showing
**Solution:**
- Check working hours are enabled for that day
- Verify appointment duration isn't too long
- Make sure break times don't cover entire day
- Check end time is after start time

### Issue: Settings not saving
**Solution:**
- Check browser localStorage is enabled
- Try a different browser
- Clear browser cache and try again

## Future Enhancements (Production Ready)

When connecting to a real backend, you could add:

1. **Recurring Blocked Dates**
   - Block every Monday
   - Block first Friday of every month

2. **Appointment Capacity**
   - Limit number of appointments per day
   - Overbooking prevention

3. **Multiple Doctors**
   - Different schedules for different doctors
   - Room/resource management

4. **Email Notifications**
   - Auto-notify patients when dates get blocked
   - Reschedule suggestions

5. **Analytics**
   - Most popular booking times
   - Capacity utilization
   - Appointment trends

## Summary

The Calendar Settings feature gives you complete control over when patients can book appointments:

✅ Set working hours for each day
✅ Choose appointment duration
✅ Add break times
✅ Block specific dates
✅ Changes take effect immediately
✅ Easy to use interface

**Remember:** Always click "Save All Settings" after making changes!

## Quick Reference

| Feature | What It Does | Example |
|---------|-------------|---------|
| Working Hours | Control which days/times appointments can be booked | Mon-Fri 9-5, Weekends closed |
| Appointment Duration | Set how long each appointment lasts | 30 minutes, 1 hour, etc. |
| Break Times | Block out times during the day | Lunch 1-2 PM |
| Blocked Dates | Prevent bookings on specific dates | Christmas, Vacation days |

---

For questions or issues, refer to the main admin dashboard documentation or contact your developer.
