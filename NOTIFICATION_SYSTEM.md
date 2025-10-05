# 💊 Push Notification System - How It Works

## 🎯 Overview

You now have **three types** of automated push notifications powered by Firebase Cloud Functions:

1. ⏰ **Medication Time Reminders** - When it's time to take medication
2. 📊 **50% Progress Milestone** - Reminder to schedule doctor follow-up
3. ⚠️ **Overdose Warning** - Alert when exceeding prescribed duration

All notifications work **even when the app is closed**! 🚀

---

## 🔄 Architecture Flow

```
User adds medication → Saved to localStorage → Auto-synced to Firestore
                                                      ↓
                                    Firebase Cloud Functions monitor Firestore
                                                      ↓
                              Time matches OR Progress changes detected
                                                      ↓
                                    Cloud Function sends FCM push notification
                                                      ↓
                        Service Worker displays notification (even if app closed)
```

---

## 📱 Notification Types Explained

### 1. ⏰ Medication Time Reminders

**When:** Every time a medication is scheduled (AM/PM times)

**How it works:**
- Cloud Function `sendMedicationReminders` runs **every minute**
- Compares current time (HH:MM) with all medication times
- Sends push notification when time matches
- For parents: Also checks all children's medications

**Example:**
```
💊 Time to Take Your Medication!

Lisinopril - 10mg tablet
Scheduled time: 08:00 AM

Tap to open MedMinder
```

**Duplicate Prevention:**
- Only sends once per medication per time per day
- Uses Firestore `sent_notifications` collection for tracking

---

### 2. 📊 50% Progress Milestone

**When:** User reaches 50% of their medication duration

**How it works:**
- Cloud Function `checkProgressMilestone` triggers on Firestore updates
- Monitors `medications/{userId}` collection changes
- Calculates: `(taken / total) × 100`
- Triggers notification when crossing 50% threshold

**Example:**
```
📅 Medication Milestone Reached!

You're 50% through your Lisinopril treatment!

Consider scheduling a follow-up appointment with your doctor to review your progress.
```

**Smart Detection:**
- Only triggers once when crossing from <50% to ≥50%
- Won't spam if progress goes 49% → 51% → 50% → 51%

---

### 3. ⚠️ Overdose Warning

**When:** User exceeds 100% of prescribed medication duration

**How it works:**
- Same Cloud Function `checkProgressMilestone` monitors progress
- Detects when progress goes from ≤100% to >100%
- Sends urgent warning notification

**Example:**
```
⚠️ OVERDOSE WARNING - Exceeded Treatment Duration!

You've taken more Lisinopril doses than prescribed (105%)!

STOP taking this medication and contact your doctor immediately.
```

**Why this matters:**
- Prevents accidental overdosing
- Alerts user to medication misuse
- Critical safety feature

---

## 🔧 Technical Implementation

### Frontend (Next.js + TypeScript)

**FCM Token Registration:**
```typescript
// lib/firebase-messaging.ts
requestFCMToken(userId) → Saves to Firestore users/{userId}.fcmToken
```

**Medication Sync:**
```typescript
// lib/storage.ts
saveMeds(uid, meds) → Auto-syncs to Firestore medications/{userId}
```

**Foreground Messages:**
```typescript
// app/(protected)/dashboard/page.tsx
onForegroundMessage((payload) => {
  // Show notification when app is open
});
```

### Backend (Firebase Cloud Functions)

**File:** `functions/index.js`

**Function 1: sendMedicationReminders**
- Type: Scheduled (Cloud Pub/Sub)
- Runs: Every 1 minute
- Logic:
  ```javascript
  1. Get current time (HH:MM)
  2. Query all users with fcmToken
  3. Load medications from Firestore
  4. Check if med.times includes current time
  5. Send FCM notification if match
  6. For parents: Check children's meds too
  7. Prevent duplicates with sent_notifications
  ```

**Function 2: checkProgressMilestone**
- Type: Firestore Trigger (onUpdate)
- Triggers: When `medications/{userId}` updates
- Logic:
  ```javascript
  1. Calculate old and new progress %
  2. If crossing 50%: Send milestone notification
  3. If exceeding 100%: Send overdose warning
  4. Check sent_notifications to prevent duplicates
  ```

**Function 3: syncMedications**
- Type: HTTPS Callable
- Called from: Frontend when saving medications
- Logic:
  ```javascript
  1. Verify user authentication
  2. Validate medications array
  3. Save to Firestore medications/{userId}
  4. Return success status
  ```

**Function 4: cleanupOldNotifications**
- Type: Scheduled (daily)
- Runs: Every 24 hours at midnight
- Logic:
  ```javascript
  1. Query sent_notifications older than 7 days
  2. Batch delete old records
  3. Keep Firestore clean
  ```

---

## 📊 Firestore Collections

### 1. `users/{userId}`
```javascript
{
  fcmToken: "eXaMpLeToKeN...",  // For sending notifications
  children: ["childUid1", "childUid2"]  // If parent
}
```

### 2. `medications/{userId}`
```javascript
{
  medications: [
    {
      id: "med1",
      name: "Lisinopril",
      dosage: "10mg tablet",
      times: ["08:00", "20:00"],
      duration: 30,  // days
      progress: { taken: 15, total: 60 }  // 15 of 60 doses taken
    }
  ],
  syncedAt: Timestamp
}
```

### 3. `sent_notifications/{docId}`
```javascript
{
  userId: "user123",
  medId: "med1",
  type: "medication_time" | "milestone_50" | "overdose_warning",
  time: "08:00",  // Only for medication_time
  date: "2024-01-15",
  sentAt: Timestamp
}
```

Document ID format: `{userId}_{medId}_{type}_{time}_{date}`

---

## 🧪 Testing Guide

### Test 1: Time Reminder

1. Add medication with time = current time + 2 minutes
2. Wait 2 minutes
3. Notification should appear automatically
4. Works even if you close the app!

### Test 2: 50% Milestone

**Option A: Add medication at 45%**
```javascript
{
  name: "Test Med",
  times: ["08:00", "20:00"],
  duration: 10,
  progress: { taken: 9, total: 20 }  // 45%
}
```
Mark one more dose → Should trigger 50% notification

**Option B: Manually update Firestore**
1. Go to Firebase Console → Firestore
2. Find `medications/{yourUserId}`
3. Update progress to `{ taken: 10, total: 20 }`
4. Notification should trigger

### Test 3: Overdose Warning

**Option A: Add medication at 95%**
```javascript
{
  name: "Test Med",
  times: ["08:00", "20:00"],
  duration: 10,
  progress: { taken: 19, total: 20 }  // 95%
}
```
Mark two more doses → Should trigger overdose warning

**Option B: Manually update Firestore**
1. Update progress to `{ taken: 21, total: 20 }`
2. Overdose warning should trigger

---

## 🐛 Troubleshooting

### Notifications Not Appearing

**Check 1: FCM Token Registered**
```
Open app → NotificationBanner appears → Click "Enable"
Check Firestore users/{yourUid} → Should have fcmToken field
```

**Check 2: Medications Synced**
```
Add medication → Check Firestore medications/{yourUid}
Should see medications array
```

**Check 3: Service Worker Active**
```
DevTools → Application → Service Workers
Should see firebase-messaging-sw.js (activated)
```

**Check 4: Cloud Functions Deployed**
```
powershell: firebase functions:log
Should see logs from sendMedicationReminders
```

**Check 5: Notification Permission**
```
Browser should have notification permission granted
Chrome: Settings → Site Settings → Notifications
```

### Logs to Check

**Frontend Console:**
```
✅ Medications synced to Firestore: {success: true, count: 3}
```

**Firebase Functions Logs:**
```
powershell: firebase functions:log --only sendMedicationReminders
Should see: "Checking medications for time: 08:00"
```

---

## 🎉 Success Indicators

✅ **Setup Complete When:**
- NotificationBanner dismissed (token registered)
- Medications show in Firestore
- Service Worker shows "activated"
- Cloud Functions deployed in Firebase Console

✅ **Working Correctly When:**
- Time reminder arrives at scheduled time
- 50% milestone triggers when crossing threshold
- Overdose warning appears when >100%
- All notifications show even when app closed

---

## 🚀 Next Steps

1. **Deploy Cloud Functions:**
   ```powershell
   firebase deploy --only functions
   ```

2. **Test Each Notification Type:**
   - Add medication for 2 minutes from now
   - Create medication at 45% progress
   - Create medication at 95% progress

3. **Monitor Logs:**
   ```powershell
   firebase functions:log --follow
   ```

4. **Verify Firestore Data:**
   - Check users collection has fcmToken
   - Check medications collection has synced data
   - Check sent_notifications gets populated

---

## 💡 Pro Tips

- **Duration matters:** Progress = taken / (times.length × duration)
- **Parent notifications:** Parents get notifications for children's meds too
- **No spam:** Duplicate prevention ensures one notification per day per medication
- **Offline sync:** Medications sync to Firestore automatically when saved
- **Background support:** Service Worker handles notifications when app closed

---

## 📞 Support

If something doesn't work:
1. Check Firebase Console logs
2. Check browser DevTools console
3. Verify Firestore collections have data
4. Ensure service worker is active
5. Confirm notification permission granted

**Happy Medicating! 💊✨**
