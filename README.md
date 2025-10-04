# MedMinder – Linked Accounts (Parent-first)

This build enforces **Parent-first sign up**. A child cannot create an account unless they enter a valid **Parent ID**. Parents log doses for their linked children from the **Children** tab.

## Run
```bash
npm install
npm run dev
# http://localhost:3000
```

## Flow
1. **Parent signs up** (Profile shows **Parent ID**).
2. **Child signs up** with that Parent ID → accounts are linked.
3. Parent opens **Children** tab → selects child → **Log dose** on each medication.
4. Child can view meds, but cannot log doses.

> Demo uses `localStorage`. In production, store users/links and meds in your backend (e.g., Firestore) and write dose logs as auditable records.