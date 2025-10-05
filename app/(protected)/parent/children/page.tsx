"use client";
import NavTabs from "@/components/NavTabs";
import MedicationCard, { Medication } from "@/components/MedicationCard";
import AddMedicationDialog from "@/components/AddMedicationDialog";
import NotificationBanner from "@/components/NotificationBanner";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { loadMeds, saveMeds, pushEvent } from "@/lib/storage";
import { monitorChildMedications } from "@/lib/notifications";

export default function ParentChildrenPage(){
  const { user, getProfile } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [medsByChild, setMedsByChild] = useState<Record<string, Medication[]>>({});

  useEffect(()=>{
    async function loadChildren() {
      if (!user?.children) return;
      const profiles = [];
      for (const uid of user.children) {
        const profile = await getProfile(uid);
        if (profile) profiles.push(profile);
      }
      setChildren(profiles);
    }
    loadChildren();
  }, [user?.children]);

  useEffect(()=>{
    const map: Record<string, Medication[]> = {};
    for (const c of children) { map[c.uid] = loadMeds(c.uid); }
    setMedsByChild(map);
  }, [children.length]);

  // Monitor all children's medications for notifications
  useEffect(() => {
    if (children.length === 0) return;

    const cleanupFunctions = children.map(child => {
      const meds = medsByChild[child.uid] || [];
      if (meds.length === 0) return () => {};
      
      return monitorChildMedications(
        child.displayName || "Your child",
        () => loadMeds(child.uid)
      );
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [children.length, Object.keys(medsByChild).length]);

  const addMed = async (childUid: string, m: Medication) => {
    setMedsByChild(prev => {
      const arr = [...(prev[childUid] || [])];
      const totalDoses = m.times.length * (m.duration || 7); // Use duration from medication or default to 7
      arr.push({ ...m, progress: { taken: 0, total: totalDoses } });
      saveMeds(childUid, arr); // Fire and forget - don't block UI
      return { ...prev, [childUid]: arr };
    });
  };

  const logDose = async (childUid: string, medId: string) => {
    setMedsByChild(prev => {
      const arr = [...(prev[childUid] || [])];
      const idx = arr.findIndex(m => m.id === medId);
      if (idx >= 0) {
        const m = arr[idx];
        const totalDoses = m.times.length * (m.duration || 7);
        const oldTaken = m.progress?.taken || 0;
        const newTaken = oldTaken + 1;
        const updated = { 
          ...m, 
          progress: { 
            taken: newTaken, 
            total: m.progress?.total || totalDoses 
          } 
        };
        arr[idx] = updated;
        saveMeds(childUid, arr);
        pushEvent(childUid, { id: String(Date.now()), medId, when: Date.now(), who: "parent" });

        // Check for milestone notifications
        const childName = children.find(c => c.uid === childUid)?.displayName || "Your child";
        const newPercent = (newTaken / updated.progress.total) * 100;

        // 50% Doctor Checkup Reminder - Show whenever progress > 50%
        if (newPercent > 50 && newPercent <= 100) {
          if (Notification.permission === "granted") {
            new Notification("�‍⚕️ Time for a Doctor Checkup!", {
              body: `${childName}'s ${m.name} progress is at ${Math.round(newPercent)}%. Consider scheduling a follow-up appointment with the doctor to review the treatment.`,
              icon: "/medication-icon.png",
              tag: `doctor-checkup-${medId}`,
              requireInteraction: true
            });
          }
        }

        // Overdose Warning - Show when exceeding 100%
        if (newPercent > 100) {
          if (Notification.permission === "granted") {
            new Notification("⚠️ OVERDOSE WARNING - Exceeded Treatment Duration!", {
              body: `${childName} has taken more ${m.name} doses than prescribed (${Math.round(newPercent)}%)! STOP taking this medication and contact your doctor immediately.`,
              icon: "/medication-icon.png",
              tag: `overdose-${medId}`,
              requireInteraction: true,
              silent: false
            });
          }
        }
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
      <NotificationBanner />
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