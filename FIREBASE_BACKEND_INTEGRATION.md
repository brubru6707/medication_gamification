# Firebase + FastAPI Backend Integration Guide

## ✅ What I Did

### 1. **Firebase Token Validation in Backend**
Updated `backend/auth.py` to:
- Accept Firebase ID tokens from the frontend
- Validate tokens using Firebase Admin SDK
- Auto-create backend user records when Firebase users make API calls
- Support both Firebase auth AND traditional JWT tokens

### 2. **Connected Chat to Backend**
Updated:
- `app/api/chat/route.ts` - Proxies chat requests to FastAPI backend
- `app/(protected)/chat/page.tsx` - Sends Firebase token with chat messages
- Backend `chat.py` already has AI-powered medication coaching

## 🚀 How to Run Both Systems Together

### Step 1: Install Backend Dependencies

```powershell
cd c:\Users\brubr\Documents\FUQ_WINDOWS\bat_cave\medication_gamification_2\backend
pip install firebase-admin python-dotenv
```

### Step 2: Get Firebase Admin SDK Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your "medication-gamification" project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Copy these values to `backend/.env`:
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)
   - `client_id` → `FIREBASE_CLIENT_ID`

### Step 3: Start the Backend

```powershell
cd c:\Users\brubr\Documents\FUQ_WINDOWS\bat_cave\medication_gamification_2
python -m uvicorn backend.main:app --reload
```

Backend will run on: `http://localhost:8000`

### Step 4: Start Next.js Frontend

```powershell
cd c:\Users\brubr\Documents\FUQ_WINDOWS\bat_cave\medication_gamification_2
npm run dev
```

Frontend will run on: `http://localhost:3000`

## 🔄 How It Works

### Authentication Flow

1. **User signs in via Firebase** (on frontend)
   ```
   User → Firebase Auth → ID Token generated
   ```

2. **Frontend makes API call to backend**
   ```
   Chat Page → /api/chat → Backend /v1/chat
   (includes Firebase ID token in Authorization header)
   ```

3. **Backend validates token**
   ```
   Backend receives token → Firebase Admin SDK validates
   → If valid, creates/fetches user in SQL database
   → Processes request with user context
   ```

### What You Get

✅ **Firebase handles authentication** (what you already have)
✅ **Backend gets authenticated user info** automatically
✅ **Backend can access user's medications** from SQL database
✅ **AI chat works** with full medication context
✅ **No duplicate auth system** - Firebase is the source of truth

## 📁 Files Changed

### Backend
- `backend/auth.py` - Added Firebase token validation
- `backend/.env` - Added Firebase Admin credentials (you need to fill these)

### Frontend
- `app/api/chat/route.ts` - Routes to backend
- `app/(protected)/chat/page.tsx` - Sends Firebase token
- `.env.local` - Backend URL configuration

## 🧪 Testing

1. Sign up/Login via Firebase (your existing flow)
2. Go to Chat page
3. Send a message
4. Backend will:
   - Validate your Firebase token
   - Create a user record in SQL database
   - Use Gemini AI to respond with medication coaching
   - Return personalized responses based on your meds

## 🔧 Optional: Sync Medications to Backend

If you want medications from your Firestore to show up in the backend database, you can:

1. Create an API endpoint to sync meds
2. Call it when medications are added via the "Add Med" page
3. Backend can then provide richer AI responses based on actual medication data

## 📝 Notes

- Firebase is PRIMARY auth system
- Backend validates Firebase tokens
- User data synced automatically on first API call
- Chat AI responses use backend's Gemini integration
- Backend has full medication coaching logic already built in
