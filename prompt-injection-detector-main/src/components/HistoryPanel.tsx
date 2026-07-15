import type { DetectionResult } from "@/types/detection";
import { RiskBadge } from "./RiskBadge";

interface HistoryPanelProps {
  results: DetectionResult[];
  onSelect: (result: DetectionResult) => void;
  selectedId?: string;
}

export function HistoryPanel({ results, onSelect, selectedId }: HistoryPanelProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="w-16 h-16 rounded-full border border-border bg-muted/30 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-muted-foreground/40" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
          </svg>
        </div>
        <p className="font-mono text-sm">No analyses yet</p>
        <p className="font-mono text-xs mt-1 text-muted-foreground/50">Submit a prompt to begin</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => onSelect(result)}
          className={`w-full text-left rounded-lg border p-3 transition-all hover:bg-accent/50 ${
            selectedId === result.id
              ? "border-primary/40 bg-accent"
              : "border-transparent"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <RiskBadge level={result.riskLevel} size="sm" />
            <span className="font-mono text-[10px] text-muted-foreground">
              {result.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <p className="font-mono text-xs text-muted-foreground truncate">
            {result.originalPrompt}
          </p>
        </button>
      ))}
    </div>
  );
}
