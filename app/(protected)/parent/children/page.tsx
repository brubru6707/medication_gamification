"use client";
import NavTabs from "@/components/NavTabs";
import MedicationCard, { Medication } from "@/components/MedicationCard";
import AddMedicationDialog from "@/components/AddMedicationDialog";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { loadMeds, saveMeds, pushEvent } from "@/lib/storage";

export default function ParentChildrenPage(){
  const { user, getProfile } = useAuth();
  const children = useMemo(()=> (user?.children || []).map(uid => getProfile(uid)).filter(Boolean) as any[], [user?.children]);
  const [medsByChild, setMedsByChild] = useState<Record<string, Medication[]>>({});

  useEffect(()=>{
    const map: Record<string, Medication[]> = {};
    for (const c of children) { map[c.uid] = loadMeds(c.uid); }
    setMedsByChild(map);
  }, [children.length]);

  const addMed = (childUid: string, m: Medication) => {
    setMedsByChild(prev => {
      const arr = [...(prev[childUid] || [])];
      arr.push({ ...m, progress: { taken: 0, total: m.times.length * 7 } });
      saveMeds(childUid, arr);
      return { ...prev, [childUid]: arr };
    });
  };

  const logDose = (childUid: string, medId: string) => {
    setMedsByChild(prev => {
      const arr = [...(prev[childUid] || [])];
      const idx = arr.findIndex(m => m.id === medId);
      if (idx >= 0) {
        const m = arr[idx];
        const updated = { ...m, progress: { taken: (m.progress?.taken || 0) + 1, total: m.progress?.total || m.times.length * 7 } };
        arr[idx] = updated;
        saveMeds(childUid, arr);
        pushEvent(childUid, { id: String(Date.now()), medId, when: Date.now(), who: "parent" });
      }
      return { ...prev, [childUid]: arr };
    });
  };

  if (user?.role !== "parent") {
    return (
      <div>
        <NavTabs />
        <div className="card card-pad">Only parents can access this page.</div>
      </div>
    );
  }

  return (
    <div>
      <NavTabs />
      <h1 className="text-3xl font-bold mb-4">Your Children</h1>
      {children.length === 0 ? (
        <div className="card card-pad text-slate-600">No children linked yet. Ask your child to sign up and enter your Parent ID from your Profile.</div>
      ) : (
        <div className="space-y-6">
          {children.map((c: any) => (
            <div key={c.uid} className="card card-pad">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xl font-semibold">{c.displayName || "Child"}</div>
                  <div className="text-slate-500 text-sm">{c.email}</div>
                </div>
                <AddMedicationDialog onAdd={(m)=>addMed(c.uid, m)} />
              </div>
              <div className="mt-4 space-y-3">
                {(medsByChild[c.uid] || []).map(m => (
                  <MedicationCard key={m.id} med={m} onLog={()=>logDose(c.uid, m.id)} />
                ))}
                {(medsByChild[c.uid] || []).length === 0 && <div className="text-slate-500 text-sm">No medications yet.</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}