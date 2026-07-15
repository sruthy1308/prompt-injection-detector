import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import type { RiskLevel } from "@/types/detection";

interface RiskBadgeProps { level: RiskLevel; size?: "sm" | "md" | "lg" }

const config = {
  safe: {
    icon: ShieldCheck, label: "SAFE",
    classes: "bg-safe/10 text-safe border-safe/30",
    glow: "shadow-[0_0_12px_hsl(162,100%,42%,0.3)]",
  },
  suspicious: {
    icon: ShieldAlert, label: "SUSPICIOUS",
    classes: "bg-suspicious/10 text-suspicious border-suspicious/30",
    glow: "shadow-[0_0_12px_hsl(38,95%,55%,0.3)]",
  },
  malicious: {
    icon: ShieldX, label: "MALICIOUS",
    classes: "bg-malicious/10 text-malicious border-malicious/30",
    glow: "shadow-[0_0_12px_hsl(0,75%,58%,0.3)]",
  },
};

const sizes = {
  sm: "text-[10px] px-2 py-0.5 gap-1",
  md: "text-xs px-3 py-1 gap-1.5",
  lg: "text-sm px-4 py-1.5 gap-2",
};

const iconSizes = { sm: "w-3 h-3", md: "w-3.5 h-3.5", lg: "w-4 h-4" };

export function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  const c = config[level];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center font-mono font-bold border rounded-full tracking-widest ${c.classes} ${c.glow} ${sizes[size]}`}>
      <Icon className={iconSizes[size]} />
      {c.label}
    </span>
  );
}
