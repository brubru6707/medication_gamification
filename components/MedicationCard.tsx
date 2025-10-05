"use client";
import { Clock, CheckCircle, Calendar, Swords } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  frequency: "Once daily" | "Twice daily" | "Custom";
  duration?: number; // Duration in days
  progress?: { taken: number; total: number };
};

export default function MedicationCard({ med, onLog, hideLog=false }:{ med: Medication; onLog?: ()=>void; hideLog?: boolean }){
  const { user } = useAuth();
  const router = useRouter();
  const pct = Math.min(100, 100 * (med.progress?.taken || 0) / (med.progress?.total || 1));
  
  const handleBattle = () => {
    console.log('═══════════════════════════════════════════════');
    console.log('⚔️  BATTLE BUTTON CLICKED!');
    console.log('═══════════════════════════════════════════════');
    
    // Encode medication data and pass to game
    const medData = {
      account_id: user?.uid || 'unknown',
      med_id: med.id,
      med_name: med.name,
      med_desc: `${med.dosage} - ${med.frequency}`,
      streak: med.progress?.taken || 0
    };
    
    console.log('📦 Medication data being sent:');
    console.log('   - Account ID:', medData.account_id);
    console.log('   - Med ID:', medData.med_id);
    console.log('   - Med Name:', medData.med_name);
    console.log('   - Med Desc:', medData.med_desc);
    console.log('   - Streak:', medData.streak);
    console.log('📦 Full medData object:', medData);
    
    // Navigate to game with medication data in URL
    const params = new URLSearchParams({
      medData: JSON.stringify(medData)
    });
    
    const gameUrl = `/game?${params.toString()}`;
    console.log('🔗 Navigating to:', gameUrl);
    console.log('═══════════════════════════════════════════════');
    
    router.push(gameUrl);
  };
  
  const isChild = user?.role === "child";
  
  return (
    <div className="card card-pad flex items-start justify-between">
      <div>
        <div className="text-xl font-semibold">{med.name}</div>
        <div className="text-slate-500">{med.dosage} • {med.frequency}</div>
        {med.duration && (
          <div className="text-slate-500 text-sm mt-1 flex items-center gap-1">
            <Calendar size={14} />
            <span>{med.duration} day{med.duration !== 1 ? 's' : ''} duration</span>
          </div>
        )}
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
          <span>{(med.times && med.times.length > 0) ? med.times.join(", ") : "No time set"}</span>
        </div>
        <div className="text-slate-500 text-sm">{med.progress?.taken || 0}/{med.progress?.total || 0}</div>
        <div className="flex gap-2">
          {!hideLog && <button className="btn btn-primary flex items-center gap-2" onClick={onLog}><CheckCircle size={16}/> Log dose</button>}
          {isChild && <button className="btn bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2" onClick={handleBattle}><Swords size={16}/> Battle</button>}
        </div>
      </div>
    </div>
  );
}