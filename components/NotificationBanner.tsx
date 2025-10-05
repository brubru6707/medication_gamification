"use client";
import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { requestFCMToken, isFCMSupported } from "@/lib/firebase-messaging";

export default function NotificationBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Check if we should show the banner
    if (typeof window === "undefined" || !user?.uid) return;
    
    // Don't show if FCM not supported
    if (!isFCMSupported()) {
      setShow(false);
      return;
    }

    // Don't show if user previously dismissed
    const dismissed = localStorage.getItem("fcm-banner-dismissed");
    if (dismissed === "true") {
      setShow(false);
      return;
    }

    // Don't show if notifications are denied
    if ("Notification" in window && Notification.permission === "denied") {
      setShow(false);
      return;
    }

    // Show the banner if permission is default (not asked yet)
    if ("Notification" in window && Notification.permission === "default") {
      setShow(true);
    }

    // Don't show if already granted
    if ("Notification" in window && Notification.permission === "granted") {
      // Check if we already have a token
      const hasToken = localStorage.getItem("fcm-token-registered");
      if (hasToken) {
        setShow(false);
      } else {
        setShow(true); // Show to register token
      }
    }
  }, [user?.uid]);

  const handleEnable = async () => {
    if (!user?.uid) {
      alert("Please log in to enable notifications");
      return;
    }

    setRequesting(true);
    
    try {
      const token = await requestFCMToken(user.uid);
      
      if (token) {
        localStorage.setItem("fcm-token-registered", "true");
        setShow(false);
        alert("✅ Push notifications enabled! You'll receive medication reminders even when the app is closed.");
      } else {
        alert("❌ Failed to enable notifications. Please check your browser settings and try again.");
        localStorage.setItem("fcm-banner-dismissed", "true");
        setShow(false);
      }
    } catch (error) {
      console.error("FCM registration error:", error);
      alert("❌ Error enabling notifications. Please try again later.");
    }
    
    setRequesting(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("fcm-banner-dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Bell className="text-blue-600" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">
            Enable Push Notifications (Firebase)
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Get medication reminders even when the app is closed! We'll send you push notifications at your scheduled medication times.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={requesting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {requesting ? "Setting up..." : "Enable Push Notifications"}
            </button>
            <button
              onClick={handleDismiss}
              className="text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 text-sm font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-400 hover:text-blue-600"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
