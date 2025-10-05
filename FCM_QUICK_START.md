# 🚀 Quick Start: Firebase Push Notifications

## ⚡ 3-Step Setup

### Step 1: Get VAPID Key (2 minutes)
1. Open: https://console.firebase.google.com/project/medication-gamification/settings/cloudmessaging
2. Scroll to **Web Push certificates**
3. Click **Generate key pair**
4. **Copy the key**
5. Paste in `lib/firebase-messaging.ts`:
   ```typescript
   const VAPID_KEY = "PASTE_YOUR_KEY_HERE";
   ```

### Step 2: Get Service Account Key (2 minutes)
1. Open: https://console.firebase.google.com/project/medication-gamification/settings/serviceaccounts/adminsdk
2. Click **Generate new private key**
3. Download the JSON file
4. Save as: `backend/serviceAccountKey.json`
5. Update path in `backend/fcm_notification_scheduler.py` line 15

### Step 3: Test It! (1 minute)
```powershell
# Start your app
npm run dev

# Login and enable notifications
# Add a medication with time = now + 2 minutes
# Wait for notification!
```

---

## 📝 Configuration Checklist

- [ ] VAPID key added to `lib/firebase-messaging.ts`
- [ ] Service account key downloaded to `backend/serviceAccountKey.json`
- [ ] Python package installed: `pip install firebase-admin`
- [ ] Service worker file exists: `public/firebase-messaging-sw.js` ✅
- [ ] Tested frontend token registration
- [ ] Tested backend notification sending

---

## 🧪 Quick Tests

### Test 1: Token Registration
```typescript
// Open browser console after enabling notifications
// You should see:
"FCM Token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
"FCM token saved to Firestore"
```

### Test 2: Backend Scheduler
```powershell
# Run manually
python backend/fcm_notification_scheduler.py

# Expected output:
"🔔 Running medication reminder check at 14:30"
"✅ Processed X users"
```

### Test 3: End-to-End
1. Add medication: Time = current time + 2 min
2. Enable push notifications
3. Close browser completely
4. Wait 2 minutes
5. Should receive notification! 📱

---

## 🎯 What You Get

### ✅ Push Notifications That:
- Work when browser is **closed**
- Work when app is **not running**
- Work on **mobile devices**
- Show medication name, dosage, and time
- Can be clicked to open app
- Send to parents for their kids' meds
- Only send once per day per medication

### 🔄 Automatic Features:
- Token registration & storage
- Duplicate prevention
- Parent + child medication tracking
- Foreground message handling
- Background message handling

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "No FCM token" | Add VAPID key to `lib/firebase-messaging.ts` |
| "Service worker failed" | Make sure file is in `public/` folder |
| "No notifications" | Check backend scheduler is running |
| "Permission denied" | User must grant permission in browser |

---

## 📊 Where to Check

### Frontend:
- Browser console: FCM token logs
- Application > Service Workers: Should show registered
- Application > Storage > Local Storage: `fcm-token-registered`

### Firestore:
- Collection: `users`
- Document: `{userId}`
- Field: `fcmToken` (should have long string)

### Backend:
- Run scheduler manually
- Check for error logs
- Verify medications are loaded

---

## 🎉 You're Done When:

1. ✅ Can see FCM token in console
2. ✅ Token saved to Firestore  
3. ✅ Service worker registered
4. ✅ Backend scheduler runs without errors
5. ✅ Receive test notification

---

## 📞 Need Help?

Check `FCM_SETUP_GUIDE.md` for detailed instructions!

**Current Status:** ⚠️ Needs VAPID key and service account key

Once you add those two keys, everything will work! 🚀
