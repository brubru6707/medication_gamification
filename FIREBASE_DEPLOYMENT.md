# Firebase Cloud Functions Deployment Guide

## 🎯 Overview
This guide will help you deploy the Firebase Cloud Functions for automated push notifications.

## 📋 Prerequisites

1. **Firebase CLI** installed globally
2. **Node.js 18** or higher
3. **Firebase Project** (medication-gamification)

## 🚀 Step-by-Step Deployment

### 1. Install Firebase CLI (if not already installed)

```powershell
npm install -g firebase-tools
```

### 2. Login to Firebase

```powershell
firebase login
```

This will open your browser for authentication.

### 3. Initialize Firebase in Your Project (if not already done)

From the project root directory:

```powershell
firebase init
```

**Select:**
- ✅ Functions: Configure a Cloud Functions directory and its files
- ✅ Firestore: Configure security rules and indexes files for Firestore
- ✅ Hosting: Configure files for Firebase Hosting (optional)

**Configuration:**
- Use existing project: `medication-gamification`
- Language: JavaScript
- ESLint: Yes (optional)
- Install dependencies: Yes

### 4. Deploy Cloud Functions

From the project root:

```powershell
firebase deploy --only functions
```

This will deploy all four functions:
- ✅ `sendMedicationReminders` - Runs every minute
- ✅ `checkProgressMilestone` - Triggers on medication updates
- ✅ `syncMedications` - Callable from frontend
- ✅ `cleanupOldNotifications` - Runs daily

### 5. Verify Deployment

Check the Firebase Console:
1. Go to https://console.firebase.google.com/
2. Select `medication-gamification` project
3. Navigate to **Functions** in the left sidebar
4. You should see all 4 functions listed

## 🔧 Configuration

### Environment Variables (if needed)

If you need to add environment variables:

```powershell
firebase functions:config:set someservice.key="THE API KEY"
```

Then redeploy:

```powershell
firebase deploy --only functions
```

## 📊 Firestore Collections Used

The Cloud Functions use these Firestore collections:

1. **users** - Stores FCM tokens
   ```
   users/{userId}
   └── fcmToken: string
   └── children: array (for parents)
   ```

2. **medications** - Synced from localStorage
   ```
   medications/{userId}
   └── medications: array
   └── syncedAt: timestamp
   ```

3. **sent_notifications** - Tracks sent notifications
   ```
   sent_notifications/{docId}
   └── userId: string
   └── medId: string
   └── type: string
   └── sentAt: timestamp
   ```

## 🧪 Testing the Functions

### Test Medication Time Reminders

1. Add a medication with time = current time + 2 minutes
2. Wait for the scheduled function to run (every minute)
3. Check your device for push notification

### Test 50% Milestone

1. Add medication with progress at 45%
2. Mark doses to reach 50%
3. Should trigger milestone notification automatically

### Test Overdose Warning

1. Add medication with progress at 95%
2. Mark doses to exceed 100%
3. Should trigger overdose warning automatically

## 📝 Monitoring & Logs

### View Function Logs

```powershell
firebase functions:log
```

### View Specific Function Logs

```powershell
firebase functions:log --only sendMedicationReminders
```

### Real-time Logs

```powershell
firebase functions:log --follow
```

## 🐛 Troubleshooting

### Functions Not Deploying

1. Check Node.js version:
   ```powershell
   node --version
   ```
   Should be 18.x or higher

2. Delete `node_modules` and reinstall:
   ```powershell
   cd functions
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

### Notifications Not Sending

1. Check Firestore has data:
   - Users have `fcmToken` field
   - Medications collection has synced data

2. Check function logs:
   ```powershell
   firebase functions:log --only sendMedicationReminders
   ```

3. Verify service worker is registered:
   - Open DevTools → Application → Service Workers
   - Should see `firebase-messaging-sw.js` active

### Permission Errors

If you see permission errors, make sure you're logged in:

```powershell
firebase logout
firebase login
```

## 🔄 Update Functions

After making changes to `functions/index.js`:

```powershell
firebase deploy --only functions
```

To deploy a specific function:

```powershell
firebase deploy --only functions:sendMedicationReminders
```

## 💰 Billing & Quotas

Firebase Cloud Functions free tier includes:
- 2M invocations/month
- 400K GB-seconds/month
- 200K CPU-seconds/month

Your functions should stay well within free tier limits.

## ✅ Post-Deployment Checklist

- [ ] All 4 functions deployed successfully
- [ ] Functions visible in Firebase Console
- [ ] Service Worker registered in browser
- [ ] FCM token saved to Firestore (check NotificationBanner)
- [ ] Medications synced to Firestore (happens on save)
- [ ] Logs show no errors

## 🎉 Success!

Once deployed, your push notifications will work automatically:
- ⏰ Medication reminders at scheduled times
- 📊 50% progress milestone alerts
- ⚠️ Overdose warnings when exceeding 100%

All notifications work even when the app is closed! 🚀
