"use client";
import { useRef, useState } from "react";
import type { Medication } from "./MedicationCard";
import { X, Camera, Upload } from "lucide-react";
import { extractMedicationInfo } from "@/lib/gemini-ocr";

export default function AddMedicationDialog({ onAdd }:{ onAdd: (m:Medication)=>void }){
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [freq, setFreq] = useState("Once daily");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addTime = () => setTimes(t => [...t, "20:00"]);
  const updateTime = (i:number, val:string) => setTimes(ts => ts.map((t, idx)=> idx===i? val : t));
  const removeTime = (i:number) => setTimes(ts => ts.filter((_, idx)=> idx!==i));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    const duration = parseInt(String(fd.get("duration")||"7"), 10) || 7;
    const med: Medication = {
      id: String(Date.now()),
      name: String(fd.get("name")||"").trim() || "New Medication",
      dosage: String(fd.get("dosage")||""),
      frequency: freq as Medication["frequency"],
      times: times.length > 0 ? times : ["08:00"],  // Ensure times is never empty
      duration: duration
    };
    onAdd(med);
    setOpen(false);
    // Reset form
    formRef.current?.reset();
    setTimes(["08:00"]);
    setFreq("Once daily");
    setImages([]);
    stopCamera();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files].slice(0, 4));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Camera access failed:', error);
      alert('Camera access failed. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob && images.length < 4) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImages(prev => [...prev, file]);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  };

  const processImages = async () => {
    if (images.length === 0) return;
    
    setLoading(true);
    try {
      for (const image of images) {
        const base64 = await fileToBase64(image);
        const info = await extractMedicationInfo(base64);
        
        const nameInput = formRef.current?.querySelector('input[name="name"]') as HTMLInputElement | null;
        const dosageInput = formRef.current?.querySelector('input[name="dosage"]') as HTMLInputElement | null;
        
        if (info.name && nameInput && !nameInput.value) nameInput.value = info.name;
        if (info.dosage && dosageInput && !dosageInput.value) dosageInput.value = info.dosage;
        
        if (info.name || info.dosage) {
          break;
        }
      }
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Failed to extract medication info. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={()=>setOpen(true)} className="btn btn-primary">+ Add Medication</button>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="card-pad">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Add New Medication</h3>
                <button onClick={()=>{setOpen(false); stopCamera();}} className="btn btn-ghost"><X size={18}/></button>
              </div>

              {/* Image Upload Section */}
              <div className="mb-4 p-4 bg-slate-50 rounded-md">
                <label className="block text-sm font-medium mb-2">Upload Medication Images (Optional)</label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="flex-1 p-2 border rounded-md bg-white"
                    disabled={images.length >= 4}
                  />
                  <button
                    type="button"
                    onClick={showCamera ? stopCamera : startCamera}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                    disabled={images.length >= 4}
                  >
                    <Camera size={18} />
                    {showCamera ? 'Stop' : 'Camera'}
                  </button>
                </div>

                {showCamera && (
                  <div className="mb-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-md rounded-md mb-2"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                      >
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={processImages}
                    disabled={loading}
                    className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50 w-full justify-center"
                  >
                    <Upload size={18} />
                    {loading ? 'Processing with Gemini AI...' : 'Extract Info with AI'}
                  </button>
                )}
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
                  <label>Duration (days)</label>
                  <input 
                    type="number" 
                    name="duration" 
                    defaultValue={7} 
                    min={1} 
                    max={365}
                    placeholder="e.g., 7, 30, 90"
                    className="w-full"
                  />
                  <div className="text-xs text-slate-500 mt-1">How many days will you take this medication?</div>
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