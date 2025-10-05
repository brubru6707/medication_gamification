"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { loadMeds, saveMeds } from "@/lib/storage";
import { extractMedicationInfo } from "@/lib/gemini-ocr";
import { Upload, Save, X, Camera } from "lucide-react";
import NavTabs from "@/components/NavTabs";
import { useRouter } from "next/navigation";
import type { Medication } from "@/components/MedicationCard";
import MedicationCard from "@/components/MedicationCard";

function AddMedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [description, setDescription] = useState("");
  const [rxNumber, setRxNumber] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [frequency, setFrequency] = useState<"Once daily" | "Twice daily" | "Custom">("Once daily");
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [savedMedications, setSavedMedications] = useState<Medication[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load saved medications on mount
  useEffect(() => {
    if (user?.uid) {
      const meds = loadMeds(user.uid);
      setSavedMedications(meds);
    }
  }, [user?.uid]);

  const addTime = () => setTimes(t => [...t, "20:00"]);
  const updateTime = (i:number, val:string) => setTimes(ts => ts.map((t, idx)=> idx===i? val : t));
  const removeTime = (i:number) => setTimes(ts => ts.filter((_, idx)=> idx!==i));

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

  const processImages = async () => {
    if (images.length === 0) return;
    
    setLoading(true);
    try {
      for (const image of images) {
        const base64 = await fileToBase64(image);
        const info = await extractMedicationInfo(base64);
        
        if (info.name && !name) setName(info.name);
        if (info.dosage && !dosage) setDosage(info.dosage);
        if (info.description && !description) setDescription(info.description);
        if (info.rxNumber && !rxNumber) setRxNumber(info.rxNumber);
        
        if (info.name || info.dosage || info.description || info.rxNumber) {
          break;
        }
      }
    } catch (error) {
      console.error('Processing failed:', error);
    }
    setLoading(false);
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

  const saveMedication = async () => {
    if (!user?.uid || !name) {
      alert('Please enter medication name');
      return;
    }

    const existingMeds = loadMeds(user.uid);
    const newMed: Medication = {
      id: Date.now().toString(),
      name,
      dosage,
      frequency,
      times: times.length > 0 ? times : ["08:00"],
      progress: { taken: 0, total: times.length * 7 }
    };

    const updatedMeds = [...existingMeds, newMed];
    saveMeds(user.uid, updatedMeds);
    
    // Update the saved medications list
    setSavedMedications(updatedMeds);
    
    // Clear form
    setName('');
    setDosage('');
    setDescription('');
    setRxNumber('');
    setImages([]);
    setTimes(["08:00"]);
    setFrequency("Once daily");
    stopCamera();
    
    alert('Medication added successfully!');
    
    // Navigate to meds page to see the new medication
    router.push('/meds');
  };

  return (
    <div>
      <NavTabs />
      <div className="p-4 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Add Medication for Myself</h1>
        
        <div className="card card-pad">
          <label className="block text-sm font-medium mb-2">Add Images (up to 4)</label>
            
            <div className="flex gap-2 mb-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="flex-1 p-2 border rounded-md"
                disabled={images.length >= 4}
              />
              
              <button
                onClick={showCamera ? stopCamera : startCamera}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
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
                    onClick={capturePhoto}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    Capture Photo
                  </button>
                  <button
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
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <button
                onClick={processImages}
                disabled={loading}
                className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50"
              >
                <Upload size={18} />
                {loading ? 'Processing...' : 'Extract Info with Gemini'}
              </button>
            )}
          </div>

          <div className="card card-pad space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Medication Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter medication name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dosage</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., 10mg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Frequency</label>
              <select 
                value={frequency} 
                onChange={(e) => setFrequency(e.target.value as "Once daily" | "Twice daily" | "Custom")}
                className="w-full p-2 border rounded-md"
              >
                <option>Once daily</option>
                <option>Twice daily</option>
                <option>Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time(s)</label>
              <div className="space-y-2">
                {times.map((t, i) => (
                  <div key={i} className="flex gap-2">
                    <input 
                      type="time" 
                      value={t} 
                      onChange={(e) => updateTime(i, e.target.value)}
                      className="flex-1 p-2 border rounded-md"
                    />
                    {times.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeTime(i)} 
                        className="btn btn-ghost"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addTime} 
                  className="btn btn-ghost"
                >
                  + Add time
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Enter medication description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">RX Number (Optional)</label>
              <input
                type="text"
                value={rxNumber}
                onChange={(e) => setRxNumber(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter prescription number"
              />
            </div>

            <button
              onClick={saveMedication}
              disabled={!name}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              <Save size={18} />
              Save Medication
            </button>
          </div>

          {/* Saved Medications Section */}
          {savedMedications.length > 0 && (
            <div className="card card-pad">
              <h2 className="text-xl font-bold mb-4">My Saved Medications ({savedMedications.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {savedMedications.map((med) => (
                  <MedicationCard 
                    key={med.id} 
                    med={med} 
                    onMark={() => {}} 
                  />
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default AddMedPage;