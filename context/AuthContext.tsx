"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { genUid } from "@/lib/ids";

export type Role = "parent" | "child";
export type User = { uid: string; email: string | null; displayName?: string | null; dob?: string | null; role: Role; parentId?: string | null; children?: string[] };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email:string, password:string)=>Promise<void>;
  register: (name:string, dob: string, email:string, password:string, role: Role, parentId?: string)=>Promise<void>;
  logout: ()=>Promise<void>;
  linkChildToParent: (parentId: string, childUid: string)=>boolean;
  getProfile: (uid: string)=>User | null;
};

const Ctx = createContext<AuthCtx | null>(null);

function createFirebaseAuth(){
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "localhost",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo",
  };
  const app = getApps().length ? getApps()[0] : initializeApp(config as any);
  return getAuth(app);
}

function saveProfile(p: User){ localStorage.setItem(`userProfile:${p.uid}`, JSON.stringify(p)); }
function readProfile(uid: string): User | null { const raw = localStorage.getItem(`userProfile:${uid}`); return raw ? JSON.parse(raw) : null; }
function parentExists(parentId?: string | null){ if (!parentId) return false; return !!readProfile(parentId); }
function addChildToParent(parentId: string, childUid: string){
  const p = readProfile(parentId); if (!p) return false;
  const children = Array.from(new Set([...(p.children || []), childUid]));
  const updated = { ...p, children };
  saveProfile(updated);
  return true;
}

export function AuthProvider({ children }:{children: React.ReactNode}){
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = createFirebaseAuth();

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, (fbUser)=>{
      if (fbUser) {
        const stored = readProfile(fbUser.uid);
        if (stored) { setUser(stored); }
        else {
          const u: User = { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName || undefined, dob: null, role: "parent", children: [] };
          saveProfile(u); setUser(u);
        }
      } else {
        const raw = localStorage.getItem("demoUser");
        if (raw) setUser(JSON.parse(raw)); else setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email:string, password:string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const fb = auth.currentUser!;
      const profile = readProfile(fb.uid);
      if (profile) setUser(profile);
      else {
        const fallback: User = { uid: fb.uid, email: fb.email, displayName: fb.displayName || undefined, role: "parent", children: [] };
        saveProfile(fallback); setUser(fallback);
      }
    } catch {
      // demo: pick whichever demo was last created in localStorage
      const last = localStorage.getItem("lastDemoUid");
      const demo = last ? readProfile(last) : null;
      if (demo) setUser(demo as User);
      else {
        // if no demo exists, create a parent demo
        const uid = genUid("parent");
        const u: User = { uid, email, displayName: "Parent Demo", role: "parent", children: [] };
        saveProfile(u); localStorage.setItem("lastDemoUid", uid); localStorage.setItem("demoUser", JSON.stringify(u)); setUser(u);
      }
    }
  };

  const register = async (name:string, dob:string, email:string, password:string, role: Role, parentId?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const uid = cred.user.uid;
      let profile: User;
      if (role === "parent") {
        profile = { uid, email, displayName: name, dob, role: "parent", children: [] };
      } else {
        if (!parentExists(parentId)) throw new Error("Parent ID not found");
        profile = { uid, email, displayName: name, dob, role: "child", parentId: parentId || null };
        addChildToParent(parentId!, uid);
      }
      saveProfile(profile);
      setUser(profile);
      localStorage.setItem("lastDemoUid", uid);
    } catch {
      // Demo fallback (no Firebase)
      const uid = genUid(role);
      let profile: User;
      if (role === "parent") {
        profile = { uid, email, displayName: name, dob, role: "parent", children: [] };
      } else {
        if (!parentExists(parentId)) { throw new Error("Parent ID not found (demo)"); }
        profile = { uid, email, displayName: name, dob, role: "child", parentId: parentId || null };
        addChildToParent(parentId!, uid);
      }
      saveProfile(profile);
      setUser(profile);
      localStorage.setItem("lastDemoUid", uid);
      localStorage.setItem("demoUser", JSON.stringify(profile));
    }
  };

  const logout = async () => {
    try { await signOut(auth); } catch {}
    localStorage.removeItem("demoUser");
    setUser(null);
  };

  const linkChildToParent = (parentId: string, childUid: string) => addChildToParent(parentId, childUid);
  const getProfile = (uid: string) => readProfile(uid);

  return <Ctx.Provider value={{ user, loading, login, register, logout, linkChildToParent, getProfile }}>{children}</Ctx.Provider>;
}

export function useAuth(){
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}