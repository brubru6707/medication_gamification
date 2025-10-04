import pandas as pd
import numpy as np
import re

# Assuming necessary imports (e.g., sklearn) are available if needed for the full script

# Re-using the essential parts of the data setup for demonstration
# --- DATA SETUP (from previous turns) ---
data = {
    'Drug_1': ['Warfarin', 'Simvastatin', 'Ibuprofen', 'Citalopram', 'Aspirin'],
    'Drug_2': ['Fluconazole', 'Diltiazem', 'Lisinopril', 'Rizatriptan', 'Warfarin'],
    'Interaction_Description': [
        "Increased risk of serious bleeding. Contraindicated in most cases.",
        "Increased Simvastatin toxicity due to CYP3A4 inhibition; adjust dose.",
        "Reduced blood pressure effect; minor interaction, generally safe.",
        "High risk of Serotonin Syndrome. Seek immediate medical attention.",
        "Increased risk of bleeding. Monitor patient closely."
    ]
}
df = pd.DataFrame(data)


def assign_severity(description):
    desc = str(description).lower()
    if any(re.search(kw, desc) for kw in [r'contraindicated', r'severe', r'life.?threatening', r'fatal']):
        return 3
    if any(re.search(kw, desc) for kw in [r'major interaction', r'monitor closely', r'increased toxicity']):
        return 2
    if any(re.search(kw, desc) for kw in [r'moderate interaction', r'minor interaction', r'generally safe']):
        return 1
    return 0


df['Severity_Level'] = df['Interaction_Description'].apply(assign_severity)
df['Drug_A'] = np.minimum(df['Drug_1'], df['Drug_2'])
df['Drug_B'] = np.maximum(df['Drug_1'], df['Drug_2'])
df['DDI_Pair'] = df['Drug_A'] + ' | ' + df['Drug_B']
DDI_Lookup_Table = df[['DDI_Pair', 'Severity_Level', 'Interaction_Description']].drop_duplicates()


# --- END DATA SETUP ---


class MedMindersDDIWarningSystem:
    def __init__(self, lookup_table):
        self.DDI_DB = lookup_table.set_index('DDI_Pair').to_dict('index')
        self.severity_map = {
            3: "🔴 CRITICAL",
            2: "⚠️ MAJOR",
            1: "🟡 MODERATE",
            0: "✅ SAFE/UNKNOWN"
        }

    def _create_pair_key(self, drug1, drug2):
        d1 = str(drug1).strip()
        d2 = str(drug2).strip()
        return ' | '.join(sorted([d1, d2]))

    def check_for_interactions(self, medication_list):
        medication_set = set(str(m).strip() for m in medication_list)
        interactions_found = []

        drugs = list(medication_set)
        for i in range(len(drugs)):
            for j in range(i + 1, len(drugs)):
                drug_a = drugs[i]
                drug_b = drugs[j]
                pair_key = self._create_pair_key(drug_a, drug_b)

                if pair_key in self.DDI_DB:
                    interaction_data = self.DDI_DB[pair_key]
                    severity = interaction_data['Severity_Level']
                    description = interaction_data['Interaction_Description']

                    interactions_found.append({
                        'Pair': f"{drug_a} + {drug_b}",
                        'Severity_Numeric': severity,
                        'Severity_Text': self.severity_map.get(severity, "UNKNOWN"),
                        'Description': description
                    })

        return interactions_found

    def generate_final_warning(self, results):
        """
        Aggregates all results and determines the final UI message.

        Modification: Display the "consult your healthcare advisor" warning
        for ALL detected interactions (Severity >= 1).
        """
        if not results:
            return {"status_code": 0, "ui_message": "✅ No drug interactions detected."}

        # Find the most severe interaction (highest numeric level)
        most_severe = max(results, key=lambda x: x['Severity_Numeric'])
        max_severity = most_severe['Severity_Numeric']

        # --- UI Logic based on Modification ---
        if max_severity >= 1:
            # THIS IS THE REQUESTED UI MESSAGE, now triggered by Severity 1, 2, or 3.
            ui_message = "🚨 WARNING: Potential Drug to Drug Interaction Hazard - Please consult your healthcare advisor for guidance."
        else:
            # This path should technically not be reached if results is not empty
            ui_message = "✅ No major interactions detected."

        # --- Full Warning Object Returned to the UI ---
        warning = {
            "status_code": max_severity,
            "ui_message": ui_message,
            "critical_pair": most_severe['Pair'],
            "critical_description": most_severe['Description']
        }
        return warning


# --- Demonstration with the Updated UI Message ---
medminders = MedMindersDDIWarningSystem(DDI_Lookup_Table)

# Regimen 1: Critical (Severity 3) - Should show the generic warning
patient_meds_1 = ['Warfarin', 'Fluconazole', 'Citalopram', 'Rizatriptan']
# Regimen 2: Moderate (Severity 1) - Should NOW show the generic warning
patient_meds_2 = ['Amoxicillin', 'Paracetamol', 'Ibuprofen', 'Lisinopril']

# 1. Test Case 1: Critical Risk (Severity 3)
print("=" * 50)
print(f"CHECKING REGIMEN 1: {patient_meds_1}")
results_1 = medminders.check_for_interactions(patient_meds_1)
warning_1 = medminders.generate_final_warning(results_1)

print(f"Max Severity Level Detected: {warning_1['status_code']} ({medminders.severity_map[warning_1['status_code']]})")
print(f"\n--- MEDMINDERS UI DISPLAY ---")
print(warning_1['ui_message'])
print(f"Detail: Most critical pair is {warning_1['critical_pair']}")

# 2. Test Case 2: Moderate Risk (Severity 1)
print("\n" + "=" * 50)
print(f"CHECKING REGIMEN 2: {patient_meds_2}")
results_2 = medminders.check_for_interactions(patient_meds_2)
warning_2 = medminders.generate_final_warning(results_2)

print(f"Max Severity Level Detected: {warning_2['status_code']} ({medminders.severity_map[warning_2['status_code']]})")
print(f"\n--- MEDMINDERS UI DISPLAY ---")
# The crucial change: this now displays the requested message for Severity 1
print(warning_2['ui_message'])
print(f"Detail: The pair is {warning_2['critical_pair']}")
