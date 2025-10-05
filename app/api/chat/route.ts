import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
  try {
    const { message, firebaseToken } = await req.json();
    
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    
    const response = await fetch(`${backendUrl}/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": firebaseToken ? `Bearer ${firebaseToken}` : "",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.reply || data.message });
    
  } catch (error) {
    console.error("Chat API error:", error);
    const fallbackReply = "Hi! I'm your MedMinder assistant. The AI service is temporarily unavailable, but I'm here to help with your medication questions.";
    return NextResponse.json({ reply: fallbackReply });
  }
}