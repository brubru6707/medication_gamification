# Fix Child Account That Was Created as Parent

## The Problem
A race condition caused child accounts to be saved as parent accounts in Firestore.

## The Fix Applied
✅ Updated `AuthContext.tsx` to NOT auto-create profiles in `onAuthStateChanged`
✅ Profiles are now only created during registration with the correct role

## How to Fix Existing Bad Child Account

### Option 1: Delete from Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `medication-gamification`
3. Go to **Firestore Database**
4. Find the user document with:
   - `uid: "gG5d5p3u5OSZkKjSj7ObFhFhUQ82"`
   - `email: "jaidyn-will@gmail.com"`
   - `role: "parent"` (incorrect)
5. **Delete this document**
6. Go to **Authentication**
7. Find the same user by email
8. **Delete this authentication user**
9. Have the child re-register with the parent code

### Option 2: Update Existing Document (Quick Fix)
1. Go to Firestore Database
2. Find the document: `users/gG5d5p3u5OSZkKjSj7ObFhFhUQ82`
3. Edit the fields:
   - Change `role` from `"parent"` to `"child"`
   - Delete the `parentCode` field
   - Delete the `children` field (if exists)
   - Add `parentId` field with the parent's UID
4. Go to the parent's document
5. Add the child's UID to the parent's `children` array

### Find Parent UID
Look for the document where:
- `role: "parent"`
- `parentCode: "FESXEM"` (or whatever code the child used)

## Prevention
This issue is now fixed in the code. New child accounts will be created correctly as children, not parents.

## Verify Fix Works
1. Create a new test child account
2. Check Firestore Database
3. Verify the document has:
   - `role: "child"` ✅
   - `parentId: "<parent-uid>"` ✅
   - NO `parentCode` field ✅
   - NO `children` array ✅
