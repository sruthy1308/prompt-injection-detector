interface RiskMeterProps { score: number }

export function RiskMeter({ score }: RiskMeterProps) {
  const isMalicious  = score >= 60;
  const isSuspicious = score >= 30 && score < 60;

  const barColor = isMalicious  ? "bg-malicious"  : isSuspicious ? "bg-suspicious" : "bg-safe";
  const glow     = isMalicious
    ? "shadow-[0_0_14px_hsl(0,75%,58%,0.6)]"
    : isSuspicious
    ? "shadow-[0_0_14px_hsl(38,95%,55%,0.6)]"
    : "shadow-[0_0_14px_hsl(162,100%,42%,0.6)]";
  const scoreColor = isMalicious ? "text-malicious" : isSuspicious ? "text-suspicious" : "text-safe";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Risk Score</span>
        <span className={`font-display text-sm font-bold ${scoreColor}`}>{score}<span className="text-muted-foreground/40 font-mono text-xs">/100</span></span>
      </div>

      {/* Track */}
      <div className="relative h-2.5 rounded-full bg-muted/80 overflow-hidden">
        {/* Segment markers */}
        <div className="absolute inset-y-0 left-[30%] w-px bg-border/60" />
        <div className="absolute inset-y-0 left-[60%] w-px bg-border/60" />
        {/* Fill */}
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor} ${glow}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="flex justify-between text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest px-0.5">
        <span>Safe</span>
        <span>Suspicious</span>
        <span>Malicious</span>
      </div>
    </div>
  );
}
