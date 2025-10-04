"use client";
import NavTabs from "@/components/NavTabs";
import MedicationCard, { Medication } from "@/components/MedicationCard";
import AddMedicationDialog from "@/components/AddMedicationDialog";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { loadMeds, saveMeds } from "@/lib/storage";

const seed: Medication[] = [
  { id: "1", name: "Lisinopril", dosage: "10mg", frequency: "Once daily", times: ["08:00"], progress: { taken: 6, total: 7 } },
  { id: "2", name: "Metformin", dosage: "500mg", frequency: "Twice daily", times: ["08:00","20:00"], progress: { taken: 12, total: 14 } },
];

export default function MedsPage(){
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [meds, setMeds] = useState<Medication[]>(()=> uid ? (loadMeds(uid) || seed) : seed);
  useEffect(()=>{ if (uid) setMeds(loadMeds(uid) || seed); }, [uid]);
  useEffect(()=>{ if (uid) saveMeds(uid, meds); }, [uid, meds]);

  const addMed = (m: Medication) => setMeds(prev => [...prev, { ...m, progress: { taken: 0, total: m.times.length * 7 } }]);

  const isChild = user?.role === "child";

  return (
    <div>
      <NavTabs />
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-3xl font-bold">My Medications</h1>
        {isChild ? null : <AddMedicationDialog onAdd={addMed} />}
      </div>
      {isChild && (
        <div className="card card-pad mb-3 text-sm">
          <div className="font-semibold mb-1">Parents log doses</div>
          <div>Your parent will log your doses from their account. If needed, ask them to add or edit medications.</div>
        </div>
      )}
      <div className="space-y-3">
        {meds.map(m => <MedicationCard key={m.id} med={m} hideLog/> )}
      </div>
    </div>
  );
}