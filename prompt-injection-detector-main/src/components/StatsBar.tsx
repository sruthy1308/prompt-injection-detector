import type { AnalysisStats } from "@/types/detection";
import { Shield, ShieldAlert, ShieldCheck, ShieldX, Ban } from "lucide-react";

interface StatsBarProps { stats: AnalysisStats }

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Total",      value: stats.total,      icon: Shield,      color: "text-foreground/70",  border: "border-border",          glow: "" },
    { label: "Safe",       value: stats.safe,        icon: ShieldCheck, color: "text-safe",           border: "border-safe/20",         glow: stats.safe > 0 ? "shadow-[0_0_12px_hsl(162,100%,42%,0.15)]" : "" },
    { label: "Suspicious", value: stats.suspicious,  icon: ShieldAlert, color: "text-suspicious",     border: "border-suspicious/20",   glow: stats.suspicious > 0 ? "shadow-[0_0_12px_hsl(38,95%,55%,0.15)]" : "" },
    { label: "Malicious",  value: stats.malicious,   icon: ShieldX,     color: "text-malicious",      border: "border-malicious/20",    glow: stats.malicious > 0 ? "shadow-[0_0_12px_hsl(0,75%,58%,0.15)]" : "" },
    { label: "Blocked",    value: stats.blocked,     icon: Ban,         color: "text-malicious",      border: "border-malicious/20",    glow: stats.blocked > 0 ? "shadow-[0_0_12px_hsl(0,75%,58%,0.15)]" : "" },
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {items.map((item) => (
        <div key={item.label}
          className={`rounded-xl border ${item.border} bg-card/60 backdrop-blur-sm p-3 text-center transition-all duration-300 ${item.glow}`}>
          <item.icon className={`w-4 h-4 mx-auto mb-1.5 ${item.color}`} />
          <div className={`font-display text-xl font-bold tracking-wider ${item.color}`}>{item.value}</div>
          <div className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
