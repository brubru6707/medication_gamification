"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage(){
  const { login } = useAuth();
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md card">
        <div className="card-pad">
          <div className="text-center mb-6">
            <div className="text-2xl font-bold">MedMinder</div>
            <div className="text-slate-500">Smart medication adherence made simple</div>
          </div>
          <form onSubmit={async (e)=>{e.preventDefault(); await login(email, password); r.push("/dashboard");}} className="space-y-3">
            <div><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
            <div><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
            <button className="btn btn-primary w-full mt-2">Sign In</button>
          </form>
          <div className="text-center mt-4 text-sm">New here? <Link href="/signup" className="text-ink underline">Create an account</Link></div>
        </div>
      </div>
    </div>
  );
}