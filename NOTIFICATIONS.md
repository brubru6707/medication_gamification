# Medication Notification System

## Overview
This app now includes local browser notifications that remind users when it's time to take their medications.

## Features

### 🔔 Automatic Reminders
- **Parent Medications**: Get reminders for your own medications
- **Children Medications**: Parents receive reminders for their children's medications
- **Smart Timing**: Notifications appear 5 minutes before scheduled time and stay active for 30 minutes

### 🎯 How It Works

1. **Permission Request**: Users see a blue banner asking to enable notifications
2. **Automatic Monitoring**: Once enabled, the app checks medications every minute
3. **Smart Notifications**: Only sends one notification per medication per scheduled time per day
4. **Notification Details**: 
   - Shows medication name and dosage
   - Indicates scheduled time
   - Specifies who it's for (you or your child)

### 📱 Implementation Details

#### Files Modified/Created:
- `lib/notifications.ts` - Core notification logic
- `components/NotificationBanner.tsx` - Permission request UI
- `app/(protected)/dashboard/page.tsx` - Dashboard monitoring
- `app/(protected)/meds/page.tsx` - Meds page monitoring
- `app/(protected)/parent/children/page.tsx` - Children medication monitoring

#### Key Functions:

**`requestNotificationPermission()`**
- Requests browser notification permission
- Returns true if granted

**`checkMedicationsAndNotify(medications, ownerName)`**
- Checks if any medications are due
- Sends notifications for due medications
- Prevents duplicate notifications

**`startMedicationMonitoring(getMedications, ownerName)`**
- Starts monitoring medications (checks every 60 seconds)
- Returns cleanup function to stop monitoring

**`monitorChildMedications(childName, getMedications)`**
- Specialized function for monitoring children's medications
- Includes child's name in notifications

### ⏰ Notification Timing

- **Notification Window**: 5 minutes before to 30 minutes after scheduled time
- **Check Frequency**: Every 60 seconds
- **One Per Day**: Same medication won't notify twice for the same scheduled time
- **Auto-Close**: Notifications automatically close after 30 seconds if not interacted with

### 🎨 User Experience

1. User visits dashboard, meds page, or children page
2. If notifications not enabled, sees a blue banner at the top
3. Clicks "Enable Notifications" button
4. Browser shows permission dialog
5. Once granted, banner disappears
6. User receives timely medication reminders

### 🚀 Future Enhancements

To make this more robust, consider:

1. **Service Workers**: Enable notifications when app is closed
2. **PWA**: Make app installable for better native experience
3. **Firebase Cloud Messaging**: Server-side notification triggers
4. **Custom Sounds**: Different sounds for different medications
5. **Snooze Feature**: Allow users to snooze reminders
6. **Notification History**: Track which reminders were dismissed vs acted upon

### 🔧 Testing

To test notifications:

1. Add a medication with a time close to current time (within 5 minutes)
2. Enable notifications when prompted
3. Wait for the scheduled time
4. You should see a browser notification appear

**Example Test Medication:**
- Name: "Test Pill"
- Time: Set to current time + 2 minutes
- You'll get notified in ~2 minutes

### 📋 Browser Support

Works on:
- ✅ Chrome/Edge (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Safari (Desktop, limited on iOS)
- ❌ iOS Safari (limited - notifications only work when app is open)

### 🔐 Privacy

- All notifications are local (browser-based)
- No data sent to external servers
- Notification state stored in localStorage
- Permission can be revoked anytime via browser settings

## Code Examples

### Adding Monitoring to a New Page

\`\`\`typescript
import { startMedicationMonitoring } from "@/lib/notifications";

useEffect(() => {
  if (!userId || medications.length === 0) return;

  const cleanup = startMedicationMonitoring(
    () => loadMeds(userId),
    "You" // or child's name
  );

  return cleanup; // Important: cleanup on unmount
}, [userId, medications.length]);
\`\`\`

### Manual Notification Check

\`\`\`typescript
import { checkMedicationsAndNotify } from "@/lib/notifications";

// Check medications right now
checkMedicationsAndNotify(medications, "You");
\`\`\`

### Check Permission Status

\`\`\`typescript
import { areNotificationsEnabled } from "@/lib/notifications";

if (areNotificationsEnabled()) {
  console.log("Notifications are ready!");
}
\`\`\`
