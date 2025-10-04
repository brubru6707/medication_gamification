"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage(){
  const { register } = useAuth();
  const r = useRouter();
  const [role, setRole] = useState<"parent"|"child">("parent");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parentId, setParentId] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, dob, email, password, role, role === "child" ? parentId : undefined);
      r.push("/dashboard");
    } catch (err:any) {
      alert(err?.message || "Could not sign up. If you're creating a child account, make sure the Parent ID is correct.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md card">
        <div className="card-pad">
          <div className="text-center mb-6">
            <div className="text-2xl font-bold">Create your account</div>
            <div className="text-slate-500">Parents first, then children link via Parent ID</div>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={"btn " + (role==="parent" ? "btn-primary" : "btn-ghost")} onClick={()=>setRole("parent")}>Parent</button>
              <button type="button" className={"btn " + (role==="child" ? "btn-primary" : "btn-ghost")} onClick={()=>setRole("child")}>Child</button>
            </div>
            {role==="child" && (
              <div>
                <label>Parent ID</label>
                <input value={parentId} onChange={e=>setParentId(e.target.value.trim())} placeholder="Paste Parent ID from parent Profile" required />
              </div>
            )}
            <div><label>Full Name</label><input value={name} onChange={e=>setName(e.target.value)} required /></div>
            <div><label>Date of Birth</label><input type="date" value={dob} onChange={e=>setDob(e.target.value)} required /></div>
            <div><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
            <div><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
            <button className="btn btn-primary w-full mt-2">Create Account</button>
          </form>
          <div className="text-center mt-4 text-sm">Already have an account? <Link href="/login" className="text-ink underline">Sign in</Link></div>
        </div>
      </div>
    </div>
  );
}