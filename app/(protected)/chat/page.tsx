"use client";
import NavTabs from "@/components/NavTabs";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { getAuth } from "firebase/auth";

type Msg = { role: "assistant" | "user"; content: string };

export default function ChatPage(){
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "Hi! I'm your MedMinder assistant. How can I help you today?" }]);
  const [input, setInput] = useState(""); 
  const endRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim()) return;
    const my = { role: "user", content: input.trim() } as Msg;
    setMsgs(m => [...m, my]); 
    setInput("");
    
    try {
      const auth = getAuth();
      const firebaseToken = await auth.currentUser?.getIdToken();
      
      const res = await fetch("/api/chat", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: my.content,
          firebaseToken 
        }) 
      });
      
      const data = await res.json();
      setMsgs(m => [...m, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMsgs(m => [...m, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    }
  };
  
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  return (
    <div>
      <NavTabs />
      <div className="card h-[70vh] flex flex-col">
        <div className="card-pad grow overflow-y-auto space-y-3">
          {msgs.map((m, i) => (
            <div key={i} className={m.role==="assistant" ? "self-start bg-mint rounded-2xl px-4 py-2 max-w-[75%]" : "self-end bg-slate-100 rounded-2xl px-4 py-2 max-w-[75%]"}>
              {m.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="border-t p-3 flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about your medications..." />
          <button className="btn btn-primary" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}