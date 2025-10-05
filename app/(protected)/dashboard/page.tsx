"use client";
import NavTabs from "@/components/NavTabs";
import ProgressRing from "@/components/ProgressRing";
import NotificationBanner from "@/components/NotificationBanner";
import { useMemo, useEffect } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { loadMeds } from "@/lib/storage";
import { startMedicationMonitoring } from "@/lib/notifications";
import { onForegroundMessage } from "@/lib/firebase-messaging";

export default function Dashboard(){
  const { user } = useAuth();
  const meds = useMemo(()=> user ? loadMeds(user.uid) : [], [user?.uid]);

  // Monitor medications for local notifications (backup)
  useEffect(() => {
    if (!user?.uid || meds.length === 0) return;

    const cleanup = startMedicationMonitoring(
      () => loadMeds(user.uid),
      "You"
    );

    return cleanup;
  }, [user?.uid, meds.length]);

  // Listen for foreground FCM messages
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      // Show a browser notification when app is open
      if (Notification.permission === "granted") {
        new Notification(payload.notification?.title || "Medication Reminder", {
          body: payload.notification?.body,
          icon: "/medication-icon.png",
          tag: "medication-reminder"
        });
      }
    });

    return unsubscribe;
  }, []);

  const { taken, total } = meds.reduce((acc:any, m:any)=>{
    const t = m?.progress?.taken || 0;
    const tot = m?.progress?.total || 0;
    return { taken: acc.taken + t, total: acc.total + tot };
  }, { taken: 0, total: 0 });
  const percent = total > 0 ? Math.round((taken/total)*100) : 67;

  return (
    <div>
      <NavTabs />
      <NotificationBanner />

      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.displayName?.split(" ")[0] || "there"}!</h1>
        <p className="text-slate-500 mb-6">Let&apos;s keep up your great progress</p>
      </div>

      <div className="card card-pad mb-6">
        <div className="flex items-center justify-center"><ProgressRing percent={percent || 0} /></div>
        <div className="mt-6 grid grid-cols-3 text-center text-slate-600">
          <div><div className="text-ink font-bold">0</div><div>Day Streak</div></div>
          <div><div className="text-ink font-bold">0</div><div>Badges</div></div>
          <div><div className="text-ink font-bold">0</div><div>Total Taken</div></div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2 text-lg font-semibold mb-2"><span>Today&apos;s Medications</span></div>
        <div className="py-8 text-center text-slate-600 flex flex-col items-center gap-3">
          <div className="rounded-full bg-slate-100 p-3"><Check /></div>
          <div className="text-2xl font-semibold">All done for today!</div>
          <div>Great job staying on track</div>
        </div>
      </div>
    </div>
  );
}