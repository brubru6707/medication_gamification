# Backend Notification System

This folder contains the Python scripts for sending Firebase Cloud Messaging (FCM) push notifications.

## 📁 Files

- **`medication_notifications.py`** - Main notification engine (run this every minute)
- **`test_notifications.py`** - Manual testing script for all notification types
- **`requirements.txt`** - Python dependencies
- **`serviceAccountKey.json`** - Firebase service account key (YOU NEED TO ADD THIS)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Add Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Project Settings → Service Accounts
4. Generate New Private Key
5. Save as `serviceAccountKey.json` in this folder

### 3. Test It

```bash
python test_notifications.py
```

This will send test notifications for:
- 💊 Medication time reminder
- 📋 Follow-up reminder (50% progress)
- ⚠️ Overdose warning (>100% progress)

### 4. Run Production Script

```bash
python medication_notifications.py
```

This checks all users and sends appropriate notifications based on:
- Current time vs medication schedules
- Progress percentages
- Duplicate prevention

### 5. Schedule It (Run Every Minute)

#### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task → "Med Notifications"
3. Trigger: Daily at midnight
4. Action: Start Program
   - Program: `python.exe`
   - Arguments: `medication_notifications.py`
   - Start in: `C:\path\to\backend\`
5. Edit Trigger → Repeat every 1 minute

#### Mac/Linux (Cron)
```bash
crontab -e

# Add:
* * * * * cd /path/to/backend && python medication_notifications.py
```

## 📊 How It Works

```
Every minute:
1. Load all users with FCM tokens from Firestore
2. For each user:
   - Load their medications from Firestore
   - Check if current time matches any medication schedule
   - Check progress percentages (50%, >100%)
   - Send appropriate notifications via FCM
   - Track sent notifications to prevent duplicates
```

## 🧪 Testing

### Test Individual Notification Types

```bash
# Run the test suite
python test_notifications.py
```

### Verify in Firestore

Check these collections:
- `medications/{userId}` - User medications
- `users/{userId}` - User profiles with FCM tokens
- `sent_notifications` - Tracking which notifications were sent

## 🔧 Configuration

### Environment Variables (Optional)

Instead of `serviceAccountKey.json`, you can use environment variables:

```bash
export FIREBASE_PRIVATE_KEY_ID="your-key-id"
export FIREBASE_PRIVATE_KEY="your-private-key"
export FIREBASE_CLIENT_EMAIL="your-client-email"
export FIREBASE_CLIENT_ID="your-client-id"
export FIREBASE_CERT_URL="your-cert-url"
```

## 📝 Notification Types

| Type | Trigger | Icon | Priority |
|------|---------|------|----------|
| Medication Reminder | Current time matches schedule | 💊 | High |
| Follow-up Reminder | Progress ≥ 50% | 📋 | High |
| Overdose Warning | Progress > 100% | ⚠️ | Critical |

## 🐛 Troubleshooting

### No notifications received?

1. Check FCM token exists in Firestore: `users/{userId}/fcmToken`
2. Check medications synced to Firestore: `medications/{userId}`
3. Run script manually to see errors: `python medication_notifications.py`
4. Check service worker is registered in browser DevTools

### "Service account key not found"?

Make sure `serviceAccountKey.json` is in the `backend/` folder.

### Duplicate notifications?

The script uses `sent_notifications` collection to track. If you're getting duplicates:
- Check Firestore rules allow writes to this collection
- Verify the script is running (not multiple instances)

## 📚 More Info

See the main project documentation:
- `../NOTIFICATION_TYPES_GUIDE.md` - Full documentation
- `../QUICK_SETUP_NOTIFICATIONS.md` - Quick setup guide

---

**Need help?** Check the logs or run the test script to diagnose issues.
