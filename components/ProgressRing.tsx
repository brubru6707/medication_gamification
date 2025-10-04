"use client";
export default function ProgressRing({ percent=0, size=160 }:{percent:number; size?:number}){
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (percent/100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#E8EDF1" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke="#2E4B4F" strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="28" fontWeight="700" fill="#2E4B4F">
        {Math.round(percent)}%
      </text>
      <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="#6C7B7D">Today</text>
    </svg>
  );
}