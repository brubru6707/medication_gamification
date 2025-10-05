# 🔔 Complete Medication Notification System Guide

## Overview

This system provides **3 types of healthcare-focused push notifications**:

1. **💊 Medication Time Reminders** - Alerts when it's time to take medication
2. **📋 Follow-up Reminders** - When medication is 50% complete, reminds user to contact doctor
3. **⚠️ Overdose Warnings** - Critical alert when user has taken >100% of prescribed amount

---

## 🏗️ Architecture

### Frontend (Next.js + Firebase)
- **Firebase Cloud Messaging (FCM)** for push notifications
- **Service Worker** (`firebase-messaging-sw.js`) handles background notifications
- **Auto-sync** to Firestore whenever medications are saved
- **Foreground handlers** for when app is open

### Backend (Python + Firebase Admin SDK)
- **medication_notifications.py** - Main notification engine
- Runs every minute (via cron/Task Scheduler)
- Queries Firestore for user medications
- Sends notifications based on:
  - Current time vs medication schedule
  - Progress percentages
  - Previous notification history

---

## 📋 Setup Steps

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **medication-gamification**
3. Click **Project Settings** (gear icon)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file
7. Save it as `serviceAccountKey.json` in your `backend/` folder

**⚠️ IMPORTANT**: Add `serviceAccountKey.json` to `.gitignore` to keep it private!

---

### Step 2: Install Python Dependencies

```bash
cd backend
pip install firebase-admin
```

---

### Step 3: Test the Notification System

Run the script manually to test:

```bash
python medication_notifications.py
```

You should see output like:
```
============================================================
🔔 Medication Notification System - 2024-01-15 14:30:00
============================================================

⏰ Current time: 14:30

👤 Processing user: John Doe
✅ Medication reminder sent: Lisinopril at 14:30
✅ Follow-up reminder sent: Metformin at 51%

============================================================
✅ Processed 1 users
============================================================
```

---

### Step 4: Schedule the Script

The script needs to run **every minute** to check for notifications.

#### On Windows (Task Scheduler):

1. Open **Task Scheduler**
2. Click **Create Basic Task**
3. Name: "Medication Notifications"
4. Trigger: **Daily** at 12:00 AM
5. Action: **Start a Program**
   - Program: `python.exe` (or full path like `C:\Python39\python.exe`)
   - Arguments: `medication_notifications.py`
   - Start in: `C:\path\to\backend\`
6. Go to **Triggers** tab → Edit → Check **Repeat task every: 1 minute**
7. Set **Duration: Indefinitely**
8. Click OK

#### On Mac/Linux (Cron):

1. Open terminal and run:
   ```bash
   crontab -e
   ```

2. Add this line:
   ```
   * * * * * cd /path/to/backend && python medication_notifications.py >> /tmp/med_notifications.log 2>&1
   ```

3. Save and exit

---

## 🔔 Notification Types

### 1. 💊 Medication Time Reminders

**Trigger**: Current time matches medication schedule (e.g., 08:00, 20:00)

**Example**:
```
Title: 💊 Time to Take Your Medication!
Body: Lisinopril - 10mg
      Scheduled for 08:00

Actions: 
- ✓ Mark as Taken
- Dismiss
```

**For children's medications**:
```
Title: 💊 Time for Sarah's Medication!
Body: Amoxicillin - 250mg
      Scheduled for 14:00
```

---

### 2. 📋 Follow-up Reminders (50% Progress)

**Trigger**: Medication progress reaches 50% or more (but less than 100%)

**Calculation**: `progress = (doses_taken / total_doses) × 100`

**Example**:
```
Title: 📋 Time for a Doctor Follow-up!
Body: Metformin: 52% complete
      Please contact your doctor to discuss progress and next steps.

Actions:
- 📞 Contact Doctor
- Dismiss
```

**Business Logic**:
- Sent **once per day** (duplicate prevention)
- Helps ensure patients get prescription refills
- Allows doctor to adjust dosage if needed

---

### 3. ⚠️ Overdose Warnings (>100% Progress)

**Trigger**: User has taken more doses than prescribed

**Example**:
```
Title: ⚠️ MEDICATION OVERDOSE WARNING!
Body: Aspirin: 112% taken
      ⚠️ You have exceeded the prescribed amount!
      Stop taking this medication and contact your doctor immediately!

Actions:
- ⚠️ View Details
- 🚨 Emergency
```

**Safety Features**:
- **Critical vibration pattern** (intense)
- **Requires user interaction** (can't auto-dismiss)
- **High priority** notification
- **Persistent** until user acknowledges

---

## 🔄 How It Works

### Data Flow

1. **User adds medication** in app
2. **Auto-sync** saves to `localStorage` AND `Firestore`
3. **Backend script** runs every minute
4. **Script checks**:
   - Current time vs medication times → Send reminder
   - Progress percentages → Send follow-up or warning
5. **FCM sends notification** to user's device
6. **Service Worker displays** notification (even if app closed)
7. **User clicks** notification → App opens to relevant page

### Duplicate Prevention

The system tracks sent notifications in Firestore:

```
Collection: sent_notifications
Document ID: {userId}_{notificationType}_{identifier}_{date}

Example: user123_medication_reminder_med456_08:00_2024-01-15
```

This ensures:
- ✅ One medication reminder per time slot per day
- ✅ One follow-up reminder per medication per day
- ✅ One overdose warning per medication per day

---

## 🧪 Testing

### Test Notification Types

You can test each type by creating test medications:

#### Test Medication Time Reminder

1. Add a medication with current time in `times` array
2. Wait 1 minute for script to run
3. Should receive notification

```javascript
{
  id: 'test1',
  name: 'Test Med',
  dosage: '10mg',
  times: ['14:35'], // Current time + 1 minute
  duration: 7,
  progress: { taken: 0, total: 14 }
}
```

#### Test Follow-up Reminder

1. Add a medication with 50% progress
2. Run script manually

```javascript
{
  id: 'test2',
  name: 'Test Follow-up',
  dosage: '5mg',
  times: ['08:00'],
  duration: 10,
  progress: { taken: 10, total: 20 } // 50%
}
```

#### Test Overdose Warning

1. Add a medication with >100% progress
2. Run script manually

```javascript
{
  id: 'test3',
  name: 'Test Overdose',
  dosage: '25mg',
  times: ['08:00'],
  duration: 7,
  progress: { taken: 20, total: 14 } // 142%
}
```

---

## 🎯 Notification Actions

When user clicks notification actions:

| Action | Opens | Use Case |
|--------|-------|----------|
| **Mark as Taken** | `/meds?markTaken={medId}` | Quickly mark dose complete |
| **Contact Doctor** | `/profile?action=contact_doctor` | Opens doctor contact info |
| **View Details** | `/meds?medication={medId}` | See medication details |
| **Emergency** | `/emergency` | Critical overdose response |
| **Dismiss** | Nothing | Close notification |

You can implement these actions in your app pages.

---

## 🔧 Customization

### Adjust Notification Frequency

Edit `medication_notifications.py`:

```python
# Change this to run less frequently
if is_medication_time(scheduled_time, current_time):
    # Custom logic here
```

### Change Progress Thresholds

```python
# Currently triggers at 50%
if progress_percent >= 50 and progress_percent < 100:

# You could add multiple milestones:
if progress_percent == 25:
    send_quarter_complete_notification()
elif progress_percent >= 50:
    send_followup_notification()
elif progress_percent >= 75:
    send_almost_done_notification()
```

### Add New Notification Types

1. Add function in `medication_notifications.py`:
```python
def send_refill_reminder(fcm_token, medication, days_left):
    # Send notification when only 3 days left
    pass
```

2. Add handler in `firebase-messaging-sw.js`:
```javascript
case 'refill_reminder':
  notificationOptions.icon = '💊';
  notificationOptions.actions = [
    { action: 'order_refill', title: '🛒 Order Refill' }
  ];
  break;
```

---

## 🐛 Troubleshooting

### Notifications not received?

1. **Check FCM token**: User must enable notifications via banner
2. **Check Firestore**: Run `console.log()` to verify medications synced
3. **Check script output**: Run manually to see errors
4. **Check service worker**: Open DevTools > Application > Service Workers

### Duplicate notifications?

- Firestore might not be saving sent_notifications
- Check Firestore rules allow writes to `sent_notifications` collection

### Wrong notification times?

- Verify server timezone matches user timezone
- Current implementation uses server time (not user's local time)
- Consider adding timezone field to user profile

---

## 📊 Monitoring

### Check sent notifications in Firestore

```javascript
// In Firebase Console > Firestore
Collection: sent_notifications

// See all notifications sent today
Filter: sent_at > [today's date]
```

### View logs

```bash
# Windows (Task Scheduler)
# Check Task History in Task Scheduler

# Mac/Linux
tail -f /tmp/med_notifications.log
```

---

## 🚀 Production Checklist

- [ ] Service account key added to backend
- [ ] `serviceAccountKey.json` in `.gitignore`
- [ ] Python script tested manually
- [ ] Scheduled task running every minute
- [ ] Test notifications received successfully
- [ ] All 3 notification types tested
- [ ] Firestore security rules configured
- [ ] Medications auto-syncing from frontend
- [ ] Service worker registered
- [ ] VAPID key configured

---

## 🔐 Security Notes

- **Service account key**: Never commit to git, never expose to frontend
- **FCM tokens**: Stored in Firestore with proper security rules
- **Medication data**: Only accessible by authenticated users
- **Notification content**: Should not include sensitive medical details in title (could show on lock screen)

---

## 📚 Additional Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)

---

**You now have a complete healthcare notification system! 🎉**
