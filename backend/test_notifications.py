"""
Manual Test Script for Notifications

Run this to manually trigger test notifications for each type.
Useful for testing without waiting for scheduled times.
"""

import firebase_admin
from firebase_admin import credentials, firestore, messaging
from datetime import datetime
import sys

# Initialize Firebase
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    print("✅ Firebase initialized successfully\n")
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")
    print("\nMake sure you have serviceAccountKey.json in the backend/ folder!")
    sys.exit(1)

db = firestore.client()

def get_test_user_token():
    """Get FCM token from a user in Firestore"""
    users = db.collection('users').where('fcmToken', '!=', None).limit(1).stream()
    
    for user in users:
        user_data = user.to_dict()
        return user.id, user_data.get('fcmToken'), user_data.get('displayName', 'Test User')
    
    return None, None, None

def test_medication_reminder(fcm_token, user_name):
    """Test Type 1: Medication Time Reminder"""
    print("📋 Testing: Medication Time Reminder")
    
    message = messaging.Message(
        notification=messaging.Notification(
            title="💊 Time to Take Your Medication!",
            body="Lisinopril - 10mg\nScheduled for 08:00"
        ),
        data={
            'type': 'medication_reminder',
            'medication_id': 'test_med_1',
            'medication_name': 'Lisinopril',
            'time': '08:00',
            'action': 'take_medication'
        },
        token=fcm_token,
        android=messaging.AndroidConfig(
            priority='high',
            notification=messaging.AndroidNotification(
                sound='default',
                channel_id='medication_reminders',
                color='#3B82F6'
            )
        )
    )
    
    try:
        response = messaging.send(message)
        print(f"✅ Medication reminder sent! Message ID: {response}\n")
        return True
    except Exception as e:
        print(f"❌ Error: {e}\n")
        return False

def test_followup_reminder(fcm_token, user_name):
    """Test Type 2: 50% Progress Follow-up"""
    print("📋 Testing: Follow-up Reminder (50% Progress)")
    
    message = messaging.Message(
        notification=messaging.Notification(
            title="📋 Time for a Doctor Follow-up!",
            body="Metformin: 52% complete\nPlease contact your doctor to discuss progress and next steps."
        ),
        data={
            'type': 'followup_reminder',
            'medication_id': 'test_med_2',
            'medication_name': 'Metformin',
            'progress': '52',
            'action': 'contact_doctor'
        },
        token=fcm_token,
        android=messaging.AndroidConfig(
            priority='high',
            notification=messaging.AndroidNotification(
                sound='default',
                channel_id='health_alerts',
                color='#10B981'
            )
        )
    )
    
    try:
        response = messaging.send(message)
        print(f"✅ Follow-up reminder sent! Message ID: {response}\n")
        return True
    except Exception as e:
        print(f"❌ Error: {e}\n")
        return False

def test_overdose_warning(fcm_token, user_name):
    """Test Type 3: Overdose Warning (>100%)"""
    print("📋 Testing: Overdose Warning")
    
    message = messaging.Message(
        notification=messaging.Notification(
            title="⚠️ MEDICATION OVERDOSE WARNING!",
            body="Aspirin: 125% taken\n⚠️ You have exceeded the prescribed amount!\nStop taking this medication and contact your doctor immediately!"
        ),
        data={
            'type': 'overdose_warning',
            'medication_id': 'test_med_3',
            'medication_name': 'Aspirin',
            'progress': '125',
            'action': 'stop_medication',
            'severity': 'critical'
        },
        token=fcm_token,
        android=messaging.AndroidConfig(
            priority='high',
            notification=messaging.AndroidNotification(
                sound='default',
                channel_id='critical_alerts',
                color='#EF4444'
            )
        ),
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    sound='alarm.caf',
                    badge=1,
                    category='OVERDOSE_WARNING'
                )
            )
        )
    )
    
    try:
        response = messaging.send(message)
        print(f"✅ Overdose warning sent! Message ID: {response}\n")
        return True
    except Exception as e:
        print(f"❌ Error: {e}\n")
        return False

def main():
    print("="*60)
    print("🧪 Medication Notification Test Suite")
    print("="*60)
    print()
    
    # Get test user
    user_id, fcm_token, user_name = get_test_user_token()
    
    if not fcm_token:
        print("❌ No users found with FCM tokens!")
        print("\nMake sure to:")
        print("1. Enable notifications in the app")
        print("2. Check that FCM tokens are being saved to Firestore")
        return
    
    print(f"👤 Testing with user: {user_name}")
    print(f"🔑 User ID: {user_id}")
    print(f"📱 FCM Token: {fcm_token[:20]}...\n")
    print("="*60)
    print()
    
    # Run tests
    results = []
    
    print("Testing all 3 notification types...\n")
    
    results.append(("Medication Reminder", test_medication_reminder(fcm_token, user_name)))
    input("Press Enter to test next notification type...")
    
    results.append(("Follow-up Reminder", test_followup_reminder(fcm_token, user_name)))
    input("Press Enter to test next notification type...")
    
    results.append(("Overdose Warning", test_overdose_warning(fcm_token, user_name)))
    
    # Summary
    print("\n" + "="*60)
    print("📊 Test Results Summary")
    print("="*60)
    
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    total = len(results)
    passed = sum(1 for _, success in results if success)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*60)
    
    if passed == total:
        print("\n🎉 All tests passed! Your notification system is working!")
    else:
        print("\n⚠️ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
