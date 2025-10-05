"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gamepad2 } from "lucide-react";

export default function GamePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only allow children to access this page
    if (!user) return;
    
    if (user.role !== "child") {
      // Redirect parents back to dashboard
      router.push("/dashboard");
      return;
    }

    // Get medication data from URL if present
    const medDataParam = searchParams.get('medData');
    
    // Build the game URL with medication data
    let gameUrl = "/medication_gamification/index.html";
    
    if (medDataParam) {
      // Pass medication data to game via URL parameters
      gameUrl += `?medData=${encodeURIComponent(medDataParam)}`;
    }
    
    // Redirect to the actual game page with medication data
    window.location.href = gameUrl;
  }, [user, router, searchParams]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Gamepad2 size={64} className="text-purple-500 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Loading Game...</h2>
        <p className="text-slate-600">Preparing your medication battle...</p>
      </div>
    </div>
  );
}
