"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from "firebase/firestore";
import { genUid } from "@/lib/ids";

export type Role = "parent" | "child";
export type User = { uid: string; email: string | null; displayName?: string | null; dob?: string | null; role: Role; parentCode?: string | null; parentId?: string | null; children?: string[] };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email:string, password:string)=>Promise<void>;
  register: (name:string, dob: string, email:string, password:string, role: Role, parentCode?: string)=>Promise<void>;
  logout: ()=>Promise<void>;
  linkChildToParent: (parentCode: string, childUid: string)=>Promise<boolean>;
  getProfile: (uid: string)=>Promise<User | null>;
};

const Ctx = createContext<AuthCtx | null>(null);

const firebaseConfig = {
  apiKey: "AIzaSyBKeLntfFEDxdZGUfhtdUKvl58WrHt6TdM",
  authDomain: "medication-gamification.firebaseapp.com",
  projectId: "medication-gamification",
  storageBucket: "medication-gamification.firebasestorage.app",
  messagingSenderId: "164714302991",
  appId: "1:164714302991:web:e6cbb642539dc93cdcdd7a",
  measurementId: "G-VE9ZC0KSEG"
};

function createFirebaseAuth(){
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getAuth(app);
}

function createFirestore(){
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

function generateParentCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function saveProfile(db: any, p: User){ 
  await setDoc(doc(db, "users", p.uid), p);
}

async function readProfile(db: any, uid: string): Promise<User | null> { 
  const docSnap = await getDoc(doc(db, "users", uid));
  return docSnap.exists() ? docSnap.data() as User : null;
}

async function findParentByCode(db: any, parentCode: string): Promise<User | null> {
  const q = query(collection(db, "users"), where("parentCode", "==", parentCode), where("role", "==", "parent"));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as User;
}

async function addChildToParent(db: any, parentUid: string, childUid: string){
  await updateDoc(doc(db, "users", parentUid), {
    children: arrayUnion(childUid)
  });
}

export function AuthProvider({ children }:{children: React.ReactNode}){
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = createFirebaseAuth();
  const db = createFirestore();

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (fbUser)=>{
      if (fbUser) {
        const stored = await readProfile(db, fbUser.uid);
        if (stored) { 
          setUser(stored); 
        } else {
          // Don't auto-create profile here - let register() or login() handle it
          // Just wait for profile to be created
          setUser(null);
        }
      } else {
        setUser(null);
        // Redirect to login when user signs out or session changes
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      }
      setLoading(false);
    });
    
    // Listen for auth state changes across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'firebase:authUser' || e.key === null) {
        // Auth state changed in another tab
        window.location.reload();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    
    return () => {
      unsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  const login = async (email:string, password:string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await readProfile(db, cred.user.uid);
    if (profile) {
      setUser(profile);
    } else {
      const fallback: User = { 
        uid: cred.user.uid, 
        email: cred.user.email, 
        displayName: cred.user.displayName || undefined, 
        role: "parent",
        parentCode: generateParentCode(),
        children: [] 
      };
      await saveProfile(db, fallback); 
      setUser(fallback);
    }
  };

  const register = async (name:string, dob:string, email:string, password:string, role: Role, parentCode?: string) => {
    // For child accounts, validate parent code FIRST before creating Firebase account
    if (role === "child") {
      if (!parentCode) throw new Error("Parent code required for child accounts");
      const parent = await findParentByCode(db, parentCode);
      if (!parent) throw new Error("Invalid parent code. Please check with your parent and try again.");
    }
    
    // Now create the Firebase account
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    
    try {
      await updateProfile(cred.user, { displayName: name });
      const uid = cred.user.uid;
      let profile: User;
      
      if (role === "parent") {
        profile = { 
          uid, 
          email, 
          displayName: name, 
          dob, 
          role: "parent", 
          parentCode: generateParentCode(),
          children: [] 
        };
      } else {
        // Parent code already validated above
        const parent = await findParentByCode(db, parentCode!);
        profile = { 
          uid, 
          email, 
          displayName: name, 
          dob, 
          role: "child", 
          parentId: parent!.uid 
        };
        await addChildToParent(db, parent!.uid, uid);
      }
      
      await saveProfile(db, profile);
      setUser(profile);
    } catch (error) {
      // If anything fails after Firebase account creation, delete the account
      await cred.user.delete();
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const linkChildToParent = async (parentCode: string, childUid: string): Promise<boolean> => {
    const parent = await findParentByCode(db, parentCode);
    if (!parent) return false;
    await addChildToParent(db, parent.uid, childUid);
    return true;
  };
  
  const getProfile = async (uid: string) => readProfile(db, uid);

  return <Ctx.Provider value={{ user, loading, login, register, logout, linkChildToParent, getProfile }}>{children}</Ctx.Provider>;
}

export function useAuth(){
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}