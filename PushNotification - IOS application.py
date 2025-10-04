import time
import schedule
from datetime import datetime

print("--- SCRIPT STARTED EXECUTION (WEB SERVER MODE) ---", flush=True)

# Global state for cycling (used in TEST MODE)
MEDICATION_INDEX = 0

# --- 1. Configuration ---
# Central place to define all medication schedules.
# You can easily add more items to this list.
MEDICATION_SCHEDULES = [
    {
        "med_name": "Metformin HCL",
        "dosage": "500 MG Tablet",
        "time_of_day": "Morning",
        "time_str": "08:00",  # 8:00 AM
        "user_id": "user_12345"  # Added for server context
    },
    {
        "med_name": "Levothyroxine",
        "dosage": "75 mcg Tablet",
        "time_of_day": "Thyroid Dose",
        "time_str": "07:30",
        "user_id": "user_67890"  # Added for server context
    },
    {
        "med_name": "Vitamin D",
        "dosage": "1000 IU Capsule",
        "time_of_day": "Mid-Day",
        "time_str": "12:30",
        "user_id": "user_12345"
    },
    {
        "med_name": "Metformin HCL",
        "dosage": "500 MG Tablet",
        "time_of_day": "Evening",
        "time_str": "20:00",
        "user_id": "user_67890"
    }
]


# --- 2. Notification Functions (Simulated Push API Call) ---

def send_push_notification_api(user_id, title, message):
    """
    Conceptual function: This is the actual API call to APNs/FCM.
    On a real server, this would use the 'requests' library and an API key.
    """

    # ⚠️ REAL-WORLD SERVER STEPS:
    # 1. Lookup the user's unique APNs Device Token using the user_id (stored in a database).
    # 2. Construct the APNs/FCM payload (a JSON dictionary).
    # 3. Use the Python 'requests' library to POST the payload to the notification service endpoint.

    # Log the simulated push notification sent (server output)
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(
        f"[{current_time}] PUSH API CALLED (Simulated) -> Target User: {user_id} | Title: {title} | Message: {message}",
        flush=True)


def send_medication_notification(med_data):
    """
    The scheduler calls this function. It extracts data and calls the conceptual push API.

    Args:
        med_data (dict): Contains medication and user details.
    """
    med_name = med_data['med_name']
    dosage = med_data['dosage']
    time_of_day = med_data['time_of_day']
    user_id = med_data.get('user_id', 'unknown_user')

    title = f"Time for Medication: {time_of_day} Dose"
    message = (
        f"Take your {dosage} of {med_name} now. "
        "Don't forget to take it with food!"
    )

    # Call the conceptual API function
    send_push_notification_api(user_id, title, message)


def cycle_medication_notifications():
    """
    Cycles through the MEDICATION_SCHEDULES list and sends a notification
    for the current medication based on the global index.
    """
    global MEDICATION_INDEX

    # Get the medication data for the current index
    med_data = MEDICATION_SCHEDULES[MEDICATION_INDEX]

    # Send the notification (simulated push)
    send_medication_notification(med_data)

    # Move the index to the next medication, wrapping around to 0 if needed
    MEDICATION_INDEX = (MEDICATION_INDEX + 1) % len(MEDICATION_SCHEDULES)


# --- 3. Scheduling Setup ---
def setup_schedule():
    """Reads the configuration and sets up all daily jobs."""
    print("--- DEBUG: Starting setup_schedule function ---", flush=True)

    # --- ⚠️ HACKATHON DEMO MODE: REMINDER SET TO CYCLE EVERY 45 SECONDS ⚠️ ---
    # This cycles through all medications in MEDICATION_SCHEDULES for quick testing/demo.
    try:
        # Schedules the cycling function to run every 45 seconds
        schedule.every(45).seconds.do(cycle_medication_notifications)

        print("-" * 50, flush=True)
        print("!!! HACKATHON DEMO MODE ACTIVE !!! (Server Simulation)", flush=True)
        print(f"Scheduling {len(MEDICATION_SCHEDULES)} simulated push notifications to cycle every 45 seconds.",
              flush=True)
        print("TO RESTORE DAILY SCHEDULE: Comment out the 45-second block and uncomment the loop below.", flush=True)
        print("-" * 50, flush=True)

    except Exception as e:
        print(f"Error setting up DEMO schedule: {e}", flush=True)

    # --- ORIGINAL DAILY SCHEDULING (COMMENTED OUT FOR TESTING) ---
    # for job_data in MEDICATION_SCHEDULES:
    #     try:
    #         time_str = job_data['time_str']
    #         med_name = job_data['med_name']

    #         # Schedule the job to run every day at the specified time string
    #         # schedule.every().day.at(time_str).do(
    #         #     send_medication_notification, job_data
    #         # )
    #         # print(f"Scheduled {med_name} ({time_str}) successfully.")

    #     except KeyError as e:
    #         print(f"Error in configuration: Missing key {e} in a medication schedule entry.")
    #     except Exception as e:
    #         # This catch is mainly for other unexpected scheduling errors
    #         print(f"Error scheduling job at time {time_str}: {e}")


# --- 4. Main Execution ---
if __name__ == "__main__":
    setup_schedule()

    print("-" * 50)
    print("Medication Scheduler is running...")
    print(
        "This background process would typically be managed by a service manager (like systemd or supervisor) on a real server.")
    print("Press Ctrl+C to stop the scheduler.")
    print("-" * 50)

    # Main loop to keep checking the pending jobs
    while True:
        try:
            schedule.run_pending()
            time.sleep(1)  # Sleep for 1 second to reduce CPU usage
        except KeyboardInterrupt:
            # Cleanly exit the loop when the user presses Ctrl+C
            print("\nScheduler stopped by user.")
            break
        except Exception as e:
            print(f"An unexpected error occurred: {e}. Waiting 5 seconds and continuing.", flush=True)
            time.sleep(5)
