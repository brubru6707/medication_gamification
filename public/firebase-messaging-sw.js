// Firebase Messaging Service Worker
// This file must be in the public folder and named firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBKeLntfFEDxdZGUfhtdUKvl58WrHt6TdM",
  authDomain: "medication-gamification.firebaseapp.com",
  projectId: "medication-gamification",
  storageBucket: "medication-gamification.firebasestorage.app",
  messagingSenderId: "164714302991",
  appId: "1:164714302991:web:e6cbb642539dc93cdcdd7a",
  measurementId: "G-VE9ZC0KSEG"
});

const messaging = firebase.messaging();

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationType = payload.data?.type || 'medication_reminder';
  let notificationTitle = payload.notification?.title || '💊 Medication Reminder';
  let notificationOptions = {
    body: payload.notification?.body || 'Time to take your medication!',
    icon: '/medication-icon.png',
    badge: '/medication-badge.png',
    tag: `${notificationType}-${payload.data?.medication_id || 'general'}`,
    requireInteraction: true,
    data: payload.data
  };

  // Customize based on notification type
  switch (notificationType) {
    case 'medication_reminder':
      notificationOptions.icon = '💊';
      notificationOptions.badge = '/medication-badge.png';
      notificationOptions.vibrate = [200, 100, 200];
      notificationOptions.actions = [
        { action: 'mark_taken', title: '✓ Mark as Taken' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
      break;

    case 'followup_reminder':
      notificationOptions.icon = '📋';
      notificationOptions.badge = '/followup-badge.png';
      notificationOptions.vibrate = [100, 50, 100, 50, 100];
      notificationOptions.actions = [
        { action: 'contact_doctor', title: '📞 Contact Doctor' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
      break;

    case 'overdose_warning':
      notificationOptions.icon = '⚠️';
      notificationOptions.badge = '/warning-badge.png';
      notificationOptions.vibrate = [500, 200, 500, 200, 500];
      notificationOptions.requireInteraction = true;
      notificationOptions.silent = false;
      notificationOptions.actions = [
        { action: 'view_details', title: '⚠️ View Details' },
        { action: 'contact_emergency', title: '🚨 Emergency' }
      ];
      break;
  }

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const type = data.type || 'medication_reminder';

  let targetUrl = '/meds'; // Default

  // Handle different actions
  switch (action) {
    case 'mark_taken':
      // Could send a request to mark medication as taken
      targetUrl = `/meds?markTaken=${data.medication_id || ''}`;
      break;

    case 'contact_doctor':
      targetUrl = '/profile?action=contact_doctor';
      break;

    case 'view_details':
      targetUrl = `/meds?medication=${data.medication_id || ''}`;
      break;

    case 'contact_emergency':
      // Open emergency page or external emergency contact
      targetUrl = '/emergency';
      break;

    case 'dismiss':
      // Just close, don't open anything
      return;

    default:
      // Default click - open meds page based on type
      if (type === 'overdose_warning') {
        targetUrl = `/meds?warning=${data.medication_id || ''}`;
      } else if (type === 'followup_reminder') {
        targetUrl = '/profile?action=followup';
      } else {
        targetUrl = '/meds';
      }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(targetUrl.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
