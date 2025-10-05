# Firebase Cloud Messaging (FCM) Push Notifications Setup Guide

## 🎯 Overview

This implementation uses **Firebase Cloud Messaging** to send push notifications for medication reminders that work even when the browser is closed or the app is not running.

---

## 📋 Prerequisites

1. ✅ Firebase project (medication-gamification)
2. ✅ Firebase Authentication enabled
3. ✅ Firestore database enabled
4. ⚠️ Firebase Admin SDK credentials needed
5. ⚠️ VAPID key needed

---

## 🔧 Setup Steps

### Step 1: Get VAPID Key from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **medication-gamification**
3. Click ⚙️ **Project Settings** (gear icon top left)
4. Navigate to **Cloud Messaging** tab
5. Scroll down to **Web configuration** section
6. Under **Web Push certificates**, click **Generate key pair**
7. Copy the generated **VAPID key**
8. Update `lib/firebase-messaging.ts`:
   ```typescript
   const VAPID_KEY = "YOUR_VAPID_KEY_HERE"; // Replace with your actual key
   ```

### Step 2: Enable Firebase Cloud Messaging API

1. In Firebase Console, go to **Cloud Messaging** tab
2. Make sure **Firebase Cloud Messaging API (V1)** is enabled
3. If not enabled, click the link to enable it in Google Cloud Console

### Step 3: Download Service Account Key (For Backend)

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Save it as `serviceAccountKey.json` in your backend folder
5. Update path in `backend/fcm_notification_scheduler.py`:
   ```python
   cred = credentials.Certificate("path/to/serviceAccountKey.json")
   ```

### Step 4: Install Required Python Packages

```powershell
pip install firebase-admin
```

### Step 5: Test the Frontend Setup

1. Start your Next.js dev server:
   ```powershell
   npm run dev
   ```

2. Open the app and login

3. You should see the notification banner asking to enable notifications

4. Click **"Enable Push Notifications"**

5. Grant permission when browser asks

6. Check browser console - you should see:
   ```
   Service Worker registered: ...
   FCM Token: eyJhbGc...
   FCM token saved to Firestore
   ```

7. Verify in Firestore:
   - Open Firebase Console > Firestore Database
   - Check `users/{userId}` document
   - Should have fields: `fcmToken` and `fcmTokenUpdatedAt`

### Step 6: Set Up Backend Scheduler

#### Option A: Windows Task Scheduler

1. Open **Task Scheduler**
2. Click **Create Basic Task**
3. Name: "Medication Reminder Notifications"
4. Trigger: **Daily**, run every 1 minute
5. Action: **Start a program**
6. Program: Path to Python
   ```
   C:\Users\{YourUser}\AppData\Local\Programs\Python\Python312\python.exe
   ```
7. Arguments:
   ```
   C:\Users\brubr\Documents\FUQ_WINDOWS\bat_cave\medication_gamification_2\backend\fcm_notification_scheduler.py
   ```
8. Save and test

#### Option B: Linux/Mac Cron Job

```bash
# Edit crontab
crontab -e

# Add this line to run every minute
* * * * * /usr/bin/python3 /path/to/backend/fcm_notification_scheduler.py >> /path/to/logs/fcm_notifications.log 2>&1
```

#### Option C: Cloud Functions (Recommended for Production)

Create a Firebase Cloud Function that runs every minute:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendMedicationReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    // Your notification logic here
    // Port the Python code to Node.js
  });
```

Deploy:
```bash
firebase deploy --only functions
```

---

## 📁 Files Created/Modified

### Created Files:

1. **`lib/firebase-messaging.ts`**
   - FCM token management
   - Firestore token storage
   - Foreground message handling

2. **`public/firebase-messaging-sw.js`**
   - Service Worker for background messages
   - Notification display when app is closed

3. **`backend/fcm_notification_scheduler.py`**
   - Python script to send scheduled notifications
   - Checks medication times every minute
   - Sends FCM messages via Firebase Admin SDK

### Modified Files:

1. **`components/NotificationBanner.tsx`**
   - Now uses FCM instead of local notifications
   - Registers FCM token on user approval
   - Saves token to Firestore

2. **`app/(protected)/dashboard/page.tsx`**
   - Added foreground message listener
   - Shows notifications when app is open

---

## 🧪 Testing

### Test Frontend Token Registration:

1. Open browser console (F12)
2. Login to the app
3. Click "Enable Push Notifications"
4. Check console for:
   ```
   Service Worker registered
   FCM Token: {long_token_string}
   FCM token saved to Firestore
   ```

### Test Backend Notification Sending:

1. Manually run the Python script:
   ```powershell
   python backend/fcm_notification_scheduler.py
   ```

2. You should see:
   ```
   🔔 Running medication reminder check at 14:30
   ✅ Processed X users
   ```

### Test End-to-End:

1. Add a medication with time = current time + 2 minutes
2. Enable push notifications
3. Wait for scheduled time
4. You should receive notification even with browser closed!

---

## 🔍 Troubleshooting

### Issue: "FCM Token: null"

**Solution:**
- Make sure VAPID key is set in `lib/firebase-messaging.ts`
- Check that service worker is registered correctly
- Verify notification permission is granted

### Issue: "Service Worker registration failed"

**Solution:**
- Make sure `firebase-messaging-sw.js` is in the `public` folder
- Clear browser cache and reload
- Check browser console for errors

### Issue: "No notifications received"

**Solution:**
- Verify FCM token is saved in Firestore (`users/{userId}/fcmToken`)
- Check backend scheduler is running
- Look for errors in scheduler logs
- Verify medication times match current time

### Issue: "Permission denied"

**Solution:**
- User must grant notification permission
- If denied, user must enable in browser settings:
  - Chrome: Settings > Privacy > Site Settings > Notifications
  - Firefox: Options > Privacy > Permissions > Notifications

---

## 📊 Firestore Data Structure

### User Document:
```json
{
  "uid": "user123",
  "email": "parent@example.com",
  "role": "parent",
  "fcmToken": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "fcmTokenUpdatedAt": "2025-10-04T14:30:00Z",
  "children": ["child_uid_1", "child_uid_2"]
}
```

### Sent Notifications Collection:
```json
{
  "user_uid_med123_08:00_2025-10-04": {
    "user_id": "user123",
    "medication_id": "med123",
    "time": "08:00",
    "sent_at": "2025-10-04T08:00:00Z"
  }
}
```

---

## 🎯 Notification Flow

### 1. User Registration:
```
User clicks "Enable" 
  → Request permission
    → Get FCM token
      → Save to Firestore
        → Token ready for notifications
```

### 2. Backend Scheduler (runs every minute):
```
Check current time
  → Query users with FCM tokens
    → Load user medications
      → For each medication time that matches:
        → Check if already sent today
          → Send FCM notification
            → Mark as sent in Firestore
```

### 3. Client Receives Notification:
```
FCM delivers message
  → Service Worker catches it (if app closed)
    → Display notification
      → User clicks
        → Open app to /meds page
```

---

## 🚀 Advantages Over Local Notifications

| Feature | Local Notifications | FCM Push Notifications |
|---------|-------------------|----------------------|
| Works when browser closed | ❌ No | ✅ Yes |
| Works on mobile | ⚠️ Limited | ✅ Full support |
| Reliable delivery | ❌ No | ✅ Yes |
| Cross-device sync | ❌ No | ✅ Yes |
| Scheduled from backend | ❌ No | ✅ Yes |
| Battery efficient | ⚠️ Uses battery | ✅ Optimized |

---

## 📱 Device Support

| Platform | Support Level |
|----------|--------------|
| Chrome Desktop | ✅ Full support |
| Firefox Desktop | ✅ Full support |
| Edge Desktop | ✅ Full support |
| Safari Desktop | ⚠️ Limited (macOS 13+) |
| Chrome Android | ✅ Full support |
| Firefox Android | ✅ Full support |
| Safari iOS | ❌ No background push |

---

## 🔐 Security Notes

1. **Never commit** `serviceAccountKey.json` to git
2. Add to `.gitignore`:
   ```
   serviceAccountKey.json
   ```

3. **VAPID key** can be in code (it's a public key)

4. **FCM tokens** are user-specific and expire/refresh automatically

---

## 💡 Next Steps

1. ✅ Get VAPID key and update `firebase-messaging.ts`
2. ✅ Download service account key for backend
3. ✅ Test frontend token registration
4. ✅ Test backend notification sending
5. ✅ Set up automated scheduler (cron/Task Scheduler)
6. 🚀 Deploy to production!

---

## 📚 Additional Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Status:** ⚠️ **SETUP REQUIRED**

You need to:
1. Add VAPID key to `lib/firebase-messaging.ts`
2. Download service account JSON for backend
3. Test the implementation
4. Set up the scheduler

Once these steps are done, you'll have fully functional push notifications! 🎉
