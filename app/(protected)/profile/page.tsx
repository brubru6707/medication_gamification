"use client";
import NavTabs from "@/components/NavTabs";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage(){
  const { user, logout } = useAuth();
  const isParent = user?.role === "parent";

  return (
    <div>
      <NavTabs />
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      <div className="card card-pad space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><div className="text-slate-500 text-sm">Name</div><div className="font-medium">{user?.displayName || "—"}</div></div>
            <div><div className="text-slate-500 text-sm">Email</div><div className="font-medium">{user?.email || "—"}</div></div>
            <div><div className="text-slate-500 text-sm">Date of Birth</div><div className="font-medium">{user?.dob || "—"}</div></div>
          </div>
        </div>

        {isParent ? (
          <div className="card card-pad">
            <h2 className="text-lg font-semibold">Your Parent ID</h2>
            <p className="text-sm text-slate-600 mb-2">Children must enter this ID when signing up to link accounts.</p>
            <div className="font-mono text-lg">{user?.uid}</div>
          </div>
        ) : (
          <div className="card card-pad">
            <h2 className="text-lg font-semibold">Linked Parent</h2>
            <div className="text-slate-600">Parent ID: <span className="font-mono">{user?.parentId || "—"}</span></div>
          </div>
        )}

        <div className="pt-2"><button onClick={logout} className="btn btn-ghost">Sign out</button></div>
      </div>
    </div>
  );
}