import { useEffect, useState } from "react";

export function AnimatedShield() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(id);
  }, []);

  const pulse = tick % 2 === 0;

  return (
    <div className="relative w-28 h-28 mx-auto animate-float">
      {/* Outer rings */}
      <div className="absolute inset-[-12px] rounded-full border border-primary/10 animate-ping" style={{ animationDuration: "3.5s" }} />
      <div className="absolute inset-[-4px] rounded-full border border-primary/15 animate-ping" style={{ animationDuration: "2.8s", animationDelay: "0.4s" }} />

      {/* Rotating dashed ring */}
      <svg className="absolute inset-0 w-full h-full" style={{ animation: "spin 12s linear infinite" }} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(162,100%,42%)" strokeWidth="0.6"
          strokeDasharray="6 4" opacity="0.2" />
      </svg>

      {/* Shield */}
      <svg viewBox="0 0 100 100" className="relative z-10 w-full h-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(162,100%,42%)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(162,100%,42%)" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Shield fill */}
        <path d="M50 8 L84 24 L84 54 Q84 78 50 94 Q16 78 16 54 L16 24 Z"
          fill="url(#shieldGrad)" />

        {/* Shield border */}
        <path d="M50 8 L84 24 L84 54 Q84 78 50 94 Q16 78 16 54 L16 24 Z"
          fill="none" stroke="hsl(162,100%,42%)" strokeWidth="1.5"
          opacity={pulse ? 0.9 : 0.55}
          filter="url(#glow)"
          style={{ transition: "opacity 0.8s ease" }} />

        {/* Inner dashed shield */}
        <path d="M50 18 L74 30 L74 52 Q74 70 50 84 Q26 70 26 52 L26 30 Z"
          fill="none" stroke="hsl(162,100%,42%)" strokeWidth="0.7"
          strokeDasharray="3 3" opacity="0.25" />

        {/* Checkmark */}
        <path d="M36 51 L46 62 L65 38"
          fill="none" stroke="hsl(162,100%,42%)" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"
          opacity={pulse ? 1 : 0.5}
          filter="url(#glow)"
          style={{ transition: "opacity 0.8s ease" }} />

        {/* Scan line */}
        <line x1="20" y1="50" x2="80" y2="50"
          stroke="hsl(162,100%,42%)" strokeWidth="0.4" opacity="0.35">
          <animate attributeName="y1" values="18;82;18" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="y2" values="18;82;18" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2.5s" repeatCount="indefinite" />
        </line>
      </svg>

      {/* Corner brackets */}
      {[
        "top-0 left-0 border-t border-l rounded-tl",
        "top-0 right-0 border-t border-r rounded-tr",
        "bottom-0 left-0 border-b border-l rounded-bl",
        "bottom-0 right-0 border-b border-r rounded-br",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-3 h-3 border-primary/40 ${cls}`} />
      ))}
    </div>
  );
}
