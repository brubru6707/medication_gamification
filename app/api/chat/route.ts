import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest){
  const { message } = await req.json();
  const reply = String(message || "").toLowerCase().includes("parent")
    ? "Parents manage dose logging. Make sure your child signed up with your Parent ID."
    : "Hi! I'm your MedMinder assistant. Ask me about your medications or schedule.";
  return NextResponse.json({ reply });
}