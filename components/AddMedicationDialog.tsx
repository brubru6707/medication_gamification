"use client";
import { useRef, useState } from "react";
import type { Medication } from "./MedicationCard";
import { X, Camera, Upload } from "lucide-react";
import { parseOcrMock } from "@/lib/ocr";

export default function AddMedicationDialog({ onAdd }:{ onAdd: (m:Medication)=>void }){
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [freq, setFreq] = useState("Once daily");

  const addTime = () => setTimes(t => [...t, "20:00"]);
  const updateTime = (i:number, val:string) => setTimes(ts => ts.map((t, idx)=> idx===i? val : t));
  const removeTime = (i:number) => setTimes(ts => ts.filter((_, idx)=> idx!==i));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    const med: Medication = {
      id: String(Date.now()),
      name: String(fd.get("name")||"").trim() || "New Medication",
      dosage: String(fd.get("dosage")||""),
      frequency: freq as Medication["frequency"],
      times
    };
    onAdd(med);
    setOpen(false);
  };

  const onOcr = async (file?: File | null) => {
    const parsed = await parseOcrMock(file);
    const nameInput = formRef.current?.querySelector('input[name="name"]') as HTMLInputElement | null;
    const dosageInput = formRef.current?.querySelector('input[name="dosage"]') as HTMLInputElement | null;
    if (nameInput && parsed.name) nameInput.value = parsed.name;
    if (dosageInput && parsed.dosage) dosageInput.value = parsed.dosage;
  };

  return (
    <>
      <button onClick={()=>setOpen(true)} className="btn btn-primary">+ Add Medication</button>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="card w-full max-w-lg">
            <div className="card-pad">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Add New Medication</h3>
                <button onClick={()=>setOpen(false)} className="btn btn-ghost"><X size={18}/></button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={()=>onOcr(null)} className="btn btn-ghost flex items-center gap-2"><Camera size={16}/> Scan Rx</button>
                <label className="btn btn-ghost flex items-center gap-2 cursor-pointer">
                  <Upload size={16}/> Upload Photo
                  <input type="file" className="hidden" onChange={e=>onOcr(e.target.files?.[0])}/>
                </label>
              </div>
              <form ref={formRef} onSubmit={submit} className="space-y-3">
                <div><label>Medication Name</label><input name="name" placeholder="e.g., Lisinopril" /></div>
                <div><label>Dosage</label><input name="dosage" placeholder="e.g., 10mg" /></div>
                <div>
                  <label>Frequency</label>
                  <select value={freq} onChange={e=>setFreq(e.target.value)}>
                    <option>Once daily</option>
                    <option>Twice daily</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div>
                  <label>Time(s)</label>
                  <div className="space-y-2">
                    {times.map((t, i)=>(
                      <div key={i} className="flex gap-2">
                        <input type="time" value={t} onChange={e=>updateTime(i, e.target.value)} />
                        <button type="button" className="btn btn-ghost" onClick={()=>removeTime(i)}>Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={addTime} className="btn btn-ghost">+ Add time</button>
                  </div>
                </div>
                <div className="pt-2">
                  <button className="btn btn-primary w-full">Add Medication</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}