"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://127.0.0.1:8000/v1";
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export default function PushPage() {
  const [email, setEmail] = useState(`web_${Date.now()}@example.com`);
  const [password, setPassword] = useState("secret123");
  const [token, setToken] = useState<string | null>(null);
  const [log, setLog] = useState<string>("");

  const append = (m: string) => setLog((prev) => prev + m + "\n");

  async function api(path: string, method = "GET", body?: any) {
    const headers: any = { "content-type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BACKEND}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
    return res.json();
  }

  async function signup() {
    try {
      const data = await api("/auth/signup", "POST", { email, password, name: "WebUser" });
      setToken(data.access_token);
      append("✅ Signed up & token stored.");
    } catch (e: any) {
      append("❌ Signup failed: " + e.message);
    }
  }

  async function login() {
    try {
      const data = await api("/auth/login", "POST", { email, password });
      setToken(data.access_token);
      append("✅ Logged in & token stored.");
    } catch (e: any) {
      append("❌ Login failed: " + e.message);
    }
  }

  async function enablePush() {
    try {
      if (!token) throw new Error("Log in first.");
      if (!VAPID) throw new Error("Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env.local");
      if (!("serviceWorker" in navigator)) throw new Error("Service worker not supported in this browser.");

      // register SW at /sw.js
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      append("SW registered.");

      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("Notifications permission not granted.");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID),
      });
      append("Got PushSubscription.");

      const json = sub.toJSON(); // { endpoint, keys: { p256dh, auth } }
      await api("/alerts/subscribe", "POST", { endpoint: json.endpoint, keys: json.keys });
      append("✅ Subscription sent to backend.");
    } catch (e: any) {
      append("❌ Push setup failed: " + e.message);
    }
  }

  async function testAlert() {
    try {
      if (!token) throw new Error("Log in first.");
      const r = await api("/alerts/test", "POST");
      append(`✅ Test alert created (id=${r.alert_id}). Check for a notification.`);
    } catch (e: any) {
      append("❌ Test alert failed: " + e.message);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">MedMinder Push</h1>
      <div className="space-x-2">
        <span className="text-sm text-gray-600">Backend:</span>{" "}
        <code className="text-xs">{BACKEND}</code>
      </div>
      <div className="space-y-2">
        <div className="space-x-2">
          <input className="border px-2 py-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
          <input className="border px-2 py-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
          <button className="border px-3 py-1" onClick={signup}>Sign up</button>
          <button className="border px-3 py-1" onClick={login}>Log in</button>
        </div>
        <div>
          <div className="text-sm text-gray-600">VAPID public key:</div>
          <code className="text-xs break-all">{VAPID || "(set NEXT_PUBLIC_VAPID_PUBLIC_KEY)"}</code>
        </div>
        <div className="space-x-2">
          <button className="border px-3 py-1" onClick={enablePush}>Enable Push & Subscribe</button>
          <button className="border px-3 py-1" onClick={testAlert}>Send Test Alert</button>
        </div>
      </div>
      <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">{log}</pre>
    </div>
  );
}
