/**
 * Firebase Cloud Functions for Medication Gamification App
 * 
 * Features:
 * 1. Scheduled medication reminders (runs every minute)
 * 2. 50% progress milestone notifications (doctor follow-up)
 * 3. Over 100% progress warnings (overdose alert)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

/**
 * Helper: Get current time in HH:MM format
 */
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Helper: Check if notification was already sent today
 */
async function wasNotificationSent(userId, medId, type, time = null) {
  const today = new Date().toISOString().split('T')[0];
  const key = time ? `${userId}_${medId}_${type}_${time}_${today}` : `${userId}_${medId}_${type}_${today}`;
  
  const doc = await db.collection('sent_notifications').doc(key).get();
  return doc.exists;
}

/**
 * Helper: Mark notification as sent
 */
async function markNotificationSent(userId, medId, type, time = null) {
  const today = new Date().toISOString().split('T')[0];
  const key = time ? `${userId}_${medId}_${type}_${time}_${today}` : `${userId}_${medId}_${type}_${today}`;
  
  await db.collection('sent_notifications').doc(key).set({
    userId,
    medicationId: medId,
    type,
    time,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    date: today
  });
}

/**
 * Helper: Send FCM notification
 */
async function sendNotification(fcmToken, notification, data = {}) {
  try {
    const message = {
      notification,
      data,
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'medication_reminders'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
    return true;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return false;
  }
}

/**
 * Helper: Load medications from localStorage backup in Firestore
 * Note: You'll need to sync localStorage to Firestore
 */
async function getUserMedications(userId) {
  try {
    const doc = await db.collection('medications').doc(userId).get();
    if (doc.exists) {
      return doc.data().medications || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading medications:', error);
    return [];
  }
}

/**
 * 1. SCHEDULED MEDICATION REMINDERS
 * Runs every minute to check for medication times
 */
exports.sendMedicationReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('🔔 Checking for medication reminders...');
    
    const currentTime = getCurrentTime();
    console.log(`Current time: ${currentTime}`);
    
    let notificationCount = 0;

    try {
      // Get all users with FCM tokens
      const usersSnapshot = await db.collection('users')
        .where('fcmToken', '!=', null)
        .get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) continue;

        // Get user's own medications
        const medications = await getUserMedications(userId);

        // Check each medication
        for (const med of medications) {
          if (!med.times || med.times.length === 0) continue;

          // Check if any of the medication times match current time
          for (const scheduledTime of med.times) {
            if (scheduledTime === currentTime) {
              // Check if we already sent this notification today
              const alreadySent = await wasNotificationSent(userId, med.id, 'reminder', scheduledTime);
              
              if (!alreadySent) {
                // Send medication reminder
                const notification = {
                  title: '💊 Time to Take Your Medication!',
                  body: `${med.name}${med.dosage ? ' - ' + med.dosage : ''}\nScheduled time: ${scheduledTime}`
                };

                const data = {
                  type: 'medication_reminder',
                  medicationId: med.id,
                  medicationName: med.name,
                  time: scheduledTime
                };

                const sent = await sendNotification(fcmToken, notification, data);
                
                if (sent) {
                  await markNotificationSent(userId, med.id, 'reminder', scheduledTime);
                  notificationCount++;
                  console.log(`✅ Sent reminder to ${userData.email} for ${med.name}`);
                }
              }
            }
          }
        }

        // If user is a parent, check children's medications
        if (userData.role === 'parent' && userData.children) {
          for (const childId of userData.children) {
            const childDoc = await db.collection('users').doc(childId).get();
            
            if (!childDoc.exists) continue;
            
            const childData = childDoc.data();
            const childName = childData.displayName || 'Your child';
            const childMeds = await getUserMedications(childId);

            for (const med of childMeds) {
              if (!med.times || med.times.length === 0) continue;

              for (const scheduledTime of med.times) {
                if (scheduledTime === currentTime) {
                  const alreadySent = await wasNotificationSent(userId, `child_${childId}_${med.id}`, 'reminder', scheduledTime);
                  
                  if (!alreadySent) {
                    const notification = {
                      title: `💊 Time for ${childName}'s Medication!`,
                      body: `${med.name}${med.dosage ? ' - ' + med.dosage : ''}\nScheduled time: ${scheduledTime}`
                    };

                    const data = {
                      type: 'child_medication_reminder',
                      childId,
                      medicationId: med.id,
                      medicationName: med.name,
                      time: scheduledTime
                    };

                    const sent = await sendNotification(fcmToken, notification, data);
                    
                    if (sent) {
                      await markNotificationSent(userId, `child_${childId}_${med.id}`, 'reminder', scheduledTime);
                      notificationCount++;
                      console.log(`✅ Sent reminder to parent for ${childName}'s ${med.name}`);
                    }
                  }
                }
              }
            }
          }
        }
      }

      console.log(`✅ Sent ${notificationCount} medication reminders`);
      return null;
    } catch (error) {
      console.error('❌ Error in sendMedicationReminders:', error);
      return null;
    }
  });

/**
 * 2. 50% PROGRESS MILESTONE - DOCTOR FOLLOW-UP NOTIFICATION
 * Triggered when medication progress is updated
 */
exports.checkProgressMilestone = functions.firestore
  .document('medications/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();
    const oldData = change.before.data();

    const newMedications = newData.medications || [];
    const oldMedications = oldData.medications || [];

    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;
    if (!fcmToken) return null;

    // Check each medication for 50% milestone
    for (const newMed of newMedications) {
      const oldMed = oldMedications.find(m => m.id === newMed.id);
      
      if (!newMed.progress || !newMed.progress.total) continue;

      const progressPercent = (newMed.progress.taken / newMed.progress.total) * 100;
      const oldProgressPercent = oldMed && oldMed.progress 
        ? (oldMed.progress.taken / oldMed.progress.total) * 100 
        : 0;

      // Check if just crossed 50% threshold
      if (progressPercent >= 50 && oldProgressPercent < 50) {
        const alreadySent = await wasNotificationSent(userId, newMed.id, '50percent');
        
        if (!alreadySent) {
          const notification = {
            title: '📅 Medication Milestone Reached!',
            body: `You're 50% through your ${newMed.name} treatment! Consider scheduling a follow-up with your doctor to review progress.`
          };

          const data = {
            type: 'milestone_50percent',
            medicationId: newMed.id,
            medicationName: newMed.name,
            progressPercent: Math.round(progressPercent).toString()
          };

          const sent = await sendNotification(fcmToken, notification, data);
          
          if (sent) {
            await markNotificationSent(userId, newMed.id, '50percent');
            console.log(`✅ Sent 50% milestone notification for ${newMed.name}`);
          }
        }
      }

      // 3. OVER 100% PROGRESS - OVERDOSE WARNING
      if (progressPercent > 100 && oldProgressPercent <= 100) {
        const alreadySent = await wasNotificationSent(userId, newMed.id, 'overdose');
        
        if (!alreadySent) {
          const notification = {
            title: '⚠️ OVERDOSE WARNING - Exceeded Treatment Duration!',
            body: `You've taken more ${newMed.name} doses than prescribed (${Math.round(progressPercent)}%)! Stop taking this medication and contact your doctor immediately.`
          };

          const data = {
            type: 'overdose_warning',
            medicationId: newMed.id,
            medicationName: newMed.name,
            progressPercent: Math.round(progressPercent).toString()
          };

          const sent = await sendNotification(fcmToken, notification, data);
          
          if (sent) {
            await markNotificationSent(userId, newMed.id, 'overdose');
            console.log(`⚠️ Sent overdose warning for ${newMed.name}`);
          }
        }
      }
    }

    return null;
  });

/**
 * 3. BACKGROUND SYNC - Sync localStorage medications to Firestore
 * Called from frontend when medications are updated
 */
exports.syncMedications = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const medications = data.medications;

  if (!Array.isArray(medications)) {
    throw new functions.https.HttpsError('invalid-argument', 'medications must be an array');
  }

  try {
    await db.collection('medications').doc(userId).set({
      medications,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Synced ${medications.length} medications for user ${userId}`);
    
    return { success: true, count: medications.length };
  } catch (error) {
    console.error('Error syncing medications:', error);
    throw new functions.https.HttpsError('internal', 'Failed to sync medications');
  }
});

/**
 * 4. CLEANUP OLD NOTIFICATIONS
 * Runs daily to remove notification records older than 7 days
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('🧹 Cleaning up old notifications...');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const snapshot = await db.collection('sent_notifications')
        .where('sentAt', '<', sevenDaysAgo)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log(`✅ Deleted ${snapshot.size} old notification records`);
      return null;
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
      return null;
    }
  });
