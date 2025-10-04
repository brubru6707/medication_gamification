import time
import schedule
import subprocess
import platform
from datetime import datetime
import inspect  # Added for module inspection/debugging

print("--- SCRIPT STARTED EXECUTION ---", flush=True)  # <--- NEW LINE: CONFIRMS FILE IS RUNNING

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
        "time_str": "08:00"  # 8:00 AM
    },
    {
        "med_name": "Levothyroxine",
        "dosage": "75 mcg Tablet",
        "time_of_day": "Thyroid Dose",
        "time_str": "07:30"  # Added for variety
    },
    {
        "med_name": "Vitamin D",
        "dosage": "1000 IU Capsule",
        "time_of_day": "Mid-Day",
        "time_str": "12:30"  # Added for variety
    },
    {
        "med_name": "Metformin HCL",
        "dosage": "500 MG Tablet",
        "time_of_day": "Evening",
        "time_str": "20:00"  # 8:00 PM
    }
]


# --- 2. Notification Function ---
def send_medication_notification(med_data):
    """
    Sends a desktop notification using native OS commands (subprocess).

    Args:
        med_data (dict): Contains 'med_name', 'dosage', and 'time_of_day'.
    """
    med_name = med_data['med_name']
    dosage = med_data['dosage']
    time_of_day = med_data['time_of_day']

    title = f"💊 Time for Medication: {time_of_day} Dose"
    # Note: We remove rich text markdown (**) since native commands may not support it.
    message = (
        f"Take your {dosage} of {med_name} now. "
        "Don't forget to take it with food!"
    )

    system_os = platform.system()
    notification_status = "Notification Sent"

    try:
        if system_os == "Darwin":  # macOS
            # Uses the built-in 'osascript' command to trigger a native notification
            subprocess.run([
                'osascript',
                '-e', f'display notification "{message}" with title "{title}"'
            ], check=True, capture_output=True)
            notification_status = "macOS Notification Sent via osascript"

        elif system_os == "Linux":
            # Uses the 'notify-send' command (standard on many Linux desktop environments)
            subprocess.run([
                'notify-send',
                title,
                message
            ], check=True, capture_output=True)
            notification_status = "Linux Notification Sent via notify-send"

        else:
            # Fallback for Windows or other unsupported systems
            notification_status = "Fallback Console Message Sent (Native notification unavailable)"

    except FileNotFoundError:
        # Handles case where osascript, notify-send, or other command is not found
        notification_status = f"ERROR: System notification command not found on {system_os}. Showing console message instead."
    except Exception as e:
        notification_status = f"ERROR: Failed to send native notification: {e}. Showing console message instead."

    # Log the action for the console (always runs)
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{current_time}] {notification_status}: {time_of_day} dose of {med_name} ({dosage})")


def cycle_medication_notifications():
    """
    Cycles through the MEDICATION_SCHEDULES list and sends a notification
    for the current medication based on the global index.
    """
    global MEDICATION_INDEX

    # Get the medication data for the current index
    med_data = MEDICATION_SCHEDULES[MEDICATION_INDEX]

    # Send the notification
    send_medication_notification(med_data)

    # Move the index to the next medication, wrapping around to 0 if needed
    MEDICATION_INDEX = (MEDICATION_INDEX + 1) % len(MEDICATION_SCHEDULES)


# --- 3. Scheduling Setup ---
def setup_schedule():
    """Reads the configuration and sets up all daily jobs."""
    print("--- DEBUG: Starting setup_schedule function ---", flush=True)

    # --- DIAGNOSTIC CHECK FOR 'schedule' PACKAGE ---
    try:
        if not hasattr(schedule, 'every'):
            # This handles the exact AttributeError you are seeing
            raise AttributeError("Missing 'every' attribute in schedule module.")

        # Check if a local file is shadowing the library
        module_path = inspect.getfile(schedule)
        if "site-packages" not in module_path and "dist-packages" not in module_path and "venv" not in module_path:
            print("-" * 50, flush=True)
            print("CRITICAL WARNING: The 'schedule' module is being loaded from:", flush=True)
            print(f"-> {module_path}", flush=True)
            print("If this path is inside your project, you have a naming conflict (shadowing).", flush=True)
            print("Please rename any file or folder named 'schedule' in your project directory.", flush=True)
            print("-" * 50, flush=True)

    except AttributeError as e:
        # This catches the critical "has no attribute 'every'" error and provides instructions
        print("-" * 50, flush=True)
        print(f"CRITICAL ERROR: Failed to access a required function from the 'schedule' package: {e}", flush=True)
        print(
            "ACTION REQUIRED: The package is likely corrupted or missing. Please run the following command in your PyCharm terminal:",
            flush=True)
        print("pip install --upgrade schedule", flush=True)
        print("-" * 50, flush=True)
        return  # Exit the setup function to prevent crashing the loop
    except Exception as e:
        # Catch other errors during the diagnostic check
        print(f"Diagnostic Error: {e}", flush=True)
        return
    # ---------------------------------------------

    # --- ⚠️ HACKATHON DEMO MODE: REMINDER SET TO CYCLE EVERY 45 SECONDS ⚠️ ---
    # This cycles through all medications in MEDICATION_SCHEDULES for quick testing/demo.
    try:
        # Schedules the cycling function to run every 45 seconds
        schedule.every(45).seconds.do(cycle_medication_notifications)

        print("-" * 50, flush=True)
        print("!!! HACKATHON DEMO MODE ACTIVE !!!", flush=True)
        print(f"Scheduling {len(MEDICATION_SCHEDULES)} medications to cycle every 45 seconds.", flush=True)
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
            print(f"An unexpected error occurred: {e}. Waiting 5 seconds and continuing.")
            time.sleep(5)
