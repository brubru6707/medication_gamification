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

    console.log('═══════════════════════════════════════════════');
    console.log('🎮 GAME PAGE - MEDICATION DATA CHECK');
    console.log('═══════════════════════════════════════════════');
    
    // Get medication data from URL if present
    const medDataParam = searchParams.get('medData');
    
    console.log('📦 Raw medData parameter:', medDataParam);
    console.log('📊 Parameter exists?', !!medDataParam);
    console.log('📊 Parameter length:', medDataParam?.length || 0);
    
    if (medDataParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(medDataParam));
        console.log('✅ Successfully decoded medication data:');
        console.log('   - Account ID:', decodedData.account_id);
        console.log('   - Med ID:', decodedData.med_id);
        console.log('   - Med Name:', decodedData.med_name);
        console.log('   - Med Desc:', decodedData.med_desc);
        console.log('   - Streak:', decodedData.streak);
        console.log('📦 Complete decoded object:', decodedData);
      } catch (error) {
        console.error('❌ Error decoding medData:', error);
      }
    } else {
      console.log('⚠️  NO MEDICATION DATA IN URL!');
      console.log('💡 Make sure you clicked the Battle button on a medication');
    }
    
    // Build the game URL with medication data
    let gameUrl = "/medication_gamification/index.html";
    
    if (medDataParam) {
      // Pass medication data to game via URL parameters
      gameUrl += `?medData=${encodeURIComponent(medDataParam)}`;
      console.log('🔗 Final game URL:', gameUrl);
    } else {
      console.log('⚠️  Redirecting to game WITHOUT medication data');
    }
    
    console.log('═══════════════════════════════════════════════');
    
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
