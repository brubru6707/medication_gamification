"""
Firebase Cloud Messaging - Medication Reminder Scheduler

This script sends push notifications to users when it's time to take their medications.
It should be run as a scheduled task (e.g., every minute via cron job or task scheduler).
"""

import firebase_admin
from firebase_admin import credentials, firestore, messaging
from datetime import datetime, timedelta
import json

# Initialize Firebase Admin SDK
# You need to download your service account key from Firebase Console
# Go to: Project Settings > Service Accounts > Generate New Private Key
cred = credentials.Certificate("path/to/serviceAccountKey.json")  # TODO: Update path
firebase_admin.initialize_app(cred)

db = firestore.client()

def get_current_time():
    """Get current time in HH:MM format"""
    return datetime.now().strftime("%H:%M")

def is_notification_time(scheduled_time: str, current_time: str) -> bool:
    """
    Check if current time matches scheduled time (within 1 minute window)
    
    Args:
        scheduled_time: Medication time (e.g., "08:00")
        current_time: Current time (e.g., "08:00")
    
    Returns:
        bool: True if times match
    """
    return scheduled_time == current_time

def get_notification_key(user_id: str, med_id: str, time: str) -> str:
    """Generate unique key for tracking sent notifications"""
    today = datetime.now().strftime("%Y-%m-%d")
    return f"{user_id}_{med_id}_{time}_{today}"

def check_notification_sent(user_id: str, med_id: str, time: str) -> bool:
    """Check if notification was already sent today for this medication/time"""
    key = get_notification_key(user_id, med_id, time)
    
    # Check Firestore for sent notifications
    doc_ref = db.collection('sent_notifications').document(key)
    doc = doc_ref.get()
    
    return doc.exists

def mark_notification_sent(user_id: str, med_id: str, time: str):
    """Mark notification as sent in Firestore"""
    key = get_notification_key(user_id, med_id, time)
    
    db.collection('sent_notifications').document(key).set({
        'user_id': user_id,
        'medication_id': med_id,
        'time': time,
        'sent_at': firestore.SERVER_TIMESTAMP
    })

def send_medication_reminder(fcm_token: str, medication: dict, user_name: str = "You") -> bool:
    """
    Send FCM push notification for medication reminder
    
    Args:
        fcm_token: User's FCM token
        medication: Medication data dict
        user_name: Name to use in notification ("You" for self, child name for children)
    
    Returns:
        bool: True if successful
    """
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=f"💊 Time for {user_name}'s medication!" if user_name != "You" else "💊 Time for your medication!",
                body=f"{medication['name']}{' - ' + medication.get('dosage', '') if medication.get('dosage') else ''}\nScheduled time: {medication['current_time']}"
            ),
            data={
                'type': 'medication_reminder',
                'medication_id': medication['id'],
                'medication_name': medication['name'],
                'time': medication['current_time']
            },
            token=fcm_token,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    sound='default',
                    channel_id='medication_reminders'
                )
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=1
                    )
                )
            )
        )
        
        response = messaging.send(message)
        print(f"✅ Notification sent successfully: {response}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending notification: {e}")
        return False

def load_user_medications(user_id: str) -> list:
    """Load medications from localStorage (stored in Firestore backup)"""
    # Note: You'll need to sync localStorage to Firestore
    # Or read directly from your backend database
    
    # For now, return empty list - implement your medication loading logic
    return []

def process_user_notifications(user_id: str, fcm_token: str):
    """Process notifications for a single user"""
    current_time = get_current_time()
    
    # Get user profile to check if parent
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return
    
    user_data = user_doc.to_dict()
    
    # Load user's own medications
    medications = load_user_medications(user_id)
    
    for med in medications:
        if 'times' not in med or not med['times']:
            continue
            
        for scheduled_time in med['times']:
            # Check if it's time for this medication
            if is_notification_time(scheduled_time, current_time):
                # Check if we already sent notification today
                if not check_notification_sent(user_id, med['id'], scheduled_time):
                    # Send notification
                    med['current_time'] = scheduled_time
                    if send_medication_reminder(fcm_token, med, "You"):
                        mark_notification_sent(user_id, med['id'], scheduled_time)
    
    # If user is a parent, check children's medications
    if user_data.get('role') == 'parent' and user_data.get('children'):
        for child_id in user_data['children']:
            # Get child profile
            child_ref = db.collection('users').document(child_id)
            child_doc = child_ref.get()
            
            if not child_doc.exists:
                continue
            
            child_data = child_doc.to_dict()
            child_name = child_data.get('displayName', 'Your child')
            
            # Load child's medications
            child_meds = load_user_medications(child_id)
            
            for med in child_meds:
                if 'times' not in med or not med['times']:
                    continue
                    
                for scheduled_time in med['times']:
                    if is_notification_time(scheduled_time, current_time):
                        if not check_notification_sent(user_id, f"child_{child_id}_{med['id']}", scheduled_time):
                            med['current_time'] = scheduled_time
                            if send_medication_reminder(fcm_token, med, child_name):
                                mark_notification_sent(user_id, f"child_{child_id}_{med['id']}", scheduled_time)

def main():
    """Main function to process all users"""
    print(f"🔔 Running medication reminder check at {get_current_time()}")
    
    # Get all users with FCM tokens
    users_ref = db.collection('users').where('fcmToken', '!=', None)
    users = users_ref.stream()
    
    notification_count = 0
    
    for user_doc in users:
        user_id = user_doc.id
        user_data = user_doc.to_dict()
        fcm_token = user_data.get('fcmToken')
        
        if not fcm_token:
            continue
        
        try:
            process_user_notifications(user_id, fcm_token)
            notification_count += 1
        except Exception as e:
            print(f"❌ Error processing user {user_id}: {e}")
    
    print(f"✅ Processed {notification_count} users")

if __name__ == "__main__":
    main()
