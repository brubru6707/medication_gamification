/**
 * Notification utilities for medication reminders
 * Handles browser notifications when the app is open
 */

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  times: string[];
  frequency?: string;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Send a notification
 */
export function sendNotification(title: string, options?: NotificationOptions) {
  if (!areNotificationsEnabled()) {
    console.log("Notifications not enabled");
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: "/medication-icon.png",
      badge: "/medication-badge.png",
      requireInteraction: true, // Notification stays until user interacts
      ...options,
    });

    // Auto-close after 30 seconds if user doesn't interact
    setTimeout(() => notification.close(), 30000);

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

/**
 * Parse time string (HH:MM) and return Date object for today at that time
 */
function parseTimeToday(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Check if current time is within notification window for a medication time
 * Returns true if we're within 5 minutes before or 30 minutes after the scheduled time
 */
function isTimeForMedication(scheduledTime: string): boolean {
  const now = new Date();
  const medTime = parseTimeToday(scheduledTime);
  
  // 5 minutes before to 30 minutes after
  const beforeWindow = new Date(medTime.getTime() - 5 * 60 * 1000);
  const afterWindow = new Date(medTime.getTime() + 30 * 60 * 1000);
  
  return now >= beforeWindow && now <= afterWindow;
}

/**
 * Get storage key for tracking shown notifications
 */
function getNotificationKey(medId: string, time: string): string {
  const today = new Date().toDateString();
  return `notification_${medId}_${time}_${today}`;
}

/**
 * Check if we've already shown this notification today
 */
function hasNotificationBeenShown(medId: string, time: string): boolean {
  const key = getNotificationKey(medId, time);
  return localStorage.getItem(key) === "shown";
}

/**
 * Mark notification as shown for today
 */
function markNotificationShown(medId: string, time: string) {
  const key = getNotificationKey(medId, time);
  localStorage.setItem(key, "shown");
}

/**
 * Check medications and send notifications for any that are due
 */
export function checkMedicationsAndNotify(
  medications: Medication[],
  ownerName: string = "You"
) {
  if (!areNotificationsEnabled()) {
    return;
  }

  medications.forEach((med) => {
    if (!med.times || med.times.length === 0) return;

    med.times.forEach((time) => {
      // Check if it's time for this medication
      if (isTimeForMedication(time)) {
        // Check if we've already notified for this medication at this time today
        if (!hasNotificationBeenShown(med.id, time)) {
          // Send notification
          const title = `💊 Time for ${ownerName === "You" ? "your" : ownerName + "'s"} medication!`;
          const body = `${med.name}${med.dosage ? " - " + med.dosage : ""}\nScheduled time: ${time}`;
          
          sendNotification(title, {
            body,
            tag: `med-${med.id}-${time}`, // Prevents duplicate notifications
          });

          // Mark as shown
          markNotificationShown(med.id, time);
          
          console.log(`Notification sent for ${med.name} at ${time}`);
        }
      }
    });
  });
}

/**
 * Start monitoring medications for scheduled times
 * Checks every minute
 */
export function startMedicationMonitoring(
  getMedications: () => Medication[],
  ownerName?: string
): () => void {
  // Check immediately
  checkMedicationsAndNotify(getMedications(), ownerName);

  // Then check every minute
  const interval = setInterval(() => {
    checkMedicationsAndNotify(getMedications(), ownerName);
  }, 60000); // Check every 60 seconds

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Schedule notifications for a specific child's medications
 */
export function monitorChildMedications(
  childName: string,
  getMedications: () => Medication[]
): () => void {
  return startMedicationMonitoring(getMedications, childName);
}
