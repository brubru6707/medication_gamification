"use client";
import { Clock, CheckCircle } from "lucide-react";

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  frequency: "Once daily" | "Twice daily" | "Custom";
  progress?: { taken: number; total: number };
};

export default function MedicationCard({ med, onLog, hideLog=false }:{ med: Medication; onLog?: ()=>void; hideLog?: boolean }){
  const pct = Math.min(100, 100 * (med.progress?.taken || 0) / (med.progress?.total || 1));
  return (
    <div className="card card-pad flex items-start justify-between">
      <div>
        <div className="text-xl font-semibold">{med.name}</div>
        <div className="text-slate-500">{med.dosage} • {med.frequency}</div>
        <div className="mt-3">
          <div className="text-sm text-slate-600">Progress</div>
          <div className="h-2 bg-slate-200 rounded-full mt-1 w-64 max-w-full">
            <div className="h-2 bg-ink rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 items-end">
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm flex items-center gap-2">
          <Clock size={16} />
          <span>{med.times.join(", ")}</span>
        </div>
        <div className="text-slate-500 text-sm">{med.progress?.taken || 0}/{med.progress?.total || 0}</div>
        {!hideLog && <button className="btn btn-primary flex items-center gap-2" onClick={onLog}><CheckCircle size={16}/> Log dose</button>}
      </div>
    </div>
  );
}