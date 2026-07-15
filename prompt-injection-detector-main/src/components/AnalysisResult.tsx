import { AlertTriangle, Ban, Info, ShieldAlert, Lightbulb, Globe, Activity } from "lucide-react";
import type { DetectionResult } from "@/types/detection";
import { RiskBadge } from "./RiskBadge";
import { RiskMeter } from "./RiskMeter";

interface AnalysisResultProps {
  result: DetectionResult;
}

const ATTACK_TYPE_DESCRIPTIONS: Record<string, string> = {
  "Harmful Content": "The prompt requests information about violence, illegal activities, or content that could cause real-world harm.",
  "Prompt Injection": "Attempts to override or hijack the AI's instructions.",
  "Role Manipulation": "Tries to assign a new unrestricted role or claim special authority.",
  "Instruction Override": "Explicitly tries to disable or bypass safety rules.",
  "Data Exfiltration": "Attempts to extract hidden system information or secrets.",
  "Encoding Attack": "Uses encoded or obfuscated content to hide malicious intent.",
  "Social Engineering": "Uses urgency, authority, or deception to bypass safety measures.",
  "Suspicious Probe": "Uses indirect or hypothetical framing to probe for unrestricted responses.",
};

// Keywords to highlight per attack type
const ATTACK_KEYWORDS: Record<string, string[]> = {
  "Prompt Injection": ["ignore", "disregard", "forget", "override", "new instructions", "from now on", "system:"],
  "Role Manipulation": ["act as", "pretend", "you are now", "dan", "developer mode", "jailbreak", "unrestricted", "admin", "disable", "without restrictions"],
  "Instruction Override": ["bypass", "override", "ignore all", "disable", "turn off", "no restrictions", "ethics", "safety off"],
  "Data Exfiltration": ["reveal", "show me", "tell me", "system prompt", "hidden", "secret", "api key", "password", "repeat", "dump"],
  "Harmful Content": ["kill", "murder", "bomb", "hack", "poison", "attack", "shoot", "stab", "synthesize", "meth", "cocaine"],
  "Social Engineering": ["emergency", "authorized", "trust me", "maintenance", "debug mode", "special command", "admin access"],
  "Suspicious Probe": ["hypothetically", "theoretically", "imagine", "just between us", "off the record", "hidden mode", "secret mode", "no one watching"],
  "Encoding Attack": ["base64", "0x", "rot13", "\\u00"],
};

function HighlightedPrompt({ prompt, attackType }: { prompt: string; attackType: string }) {
  const keywords = ATTACK_KEYWORDS[attackType] || [];
  if (!keywords.length) return <span className="font-mono text-sm text-foreground/80">{prompt}</span>;

  const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = prompt.split(regex);

  return (
    <span className="font-mono text-sm text-foreground/80 leading-relaxed">
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-malicious/20 text-malicious border-b border-malicious/50 rounded-sm px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function ConfidenceBar({ confidence, riskLevel }: { confidence: string; riskLevel: string }) {
  // Parse confidence — could be "High", "85.2%", etc.
  let pct = 0;
  if (confidence === "High") pct = 92;
  else if (confidence === "Medium") pct = 65;
  else if (confidence === "Low") pct = 35;
  else pct = parseFloat(confidence) || 0;

  const color = riskLevel === "malicious"
    ? "bg-malicious"
    : riskLevel === "suspicious"
    ? "bg-suspicious"
    : "bg-safe";

  const glowColor = riskLevel === "malicious"
    ? "shadow-[0_0_8px_hsl(var(--malicious)/0.6)]"
    : riskLevel === "suspicious"
    ? "shadow-[0_0_8px_hsl(var(--suspicious)/0.6)]"
    : "shadow-[0_0_8px_hsl(var(--safe)/0.6)]";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <Activity className="w-3 h-3" />
          Model Confidence
        </div>
        <span className={`font-mono text-xs font-bold ${
          riskLevel === "malicious" ? "text-malicious" : riskLevel === "suspicious" ? "text-suspicious" : "text-safe"
        }`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color} ${glowColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const confidence = result.confidence || (result.riskLevel === "safe" ? "Low" : "High");

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <RiskBadge level={result.riskLevel} size="lg" />
        <span className="font-mono text-xs text-muted-foreground">
          {result.timestamp.toLocaleTimeString()}
        </span>
      </div>

      {/* Risk Meter */}
      <RiskMeter score={result.score} />

      {/* Confidence Bar */}
      <ConfidenceBar confidence={confidence} riskLevel={result.riskLevel} />

      {/* Language detection badge */}
      {result.translated && result.detectedLanguage && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-2 font-mono text-xs text-primary/80">
          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            Detected language: <span className="uppercase font-semibold text-primary">{result.detectedLanguage}</span>
            {" "}— prompt was translated to English for analysis.
          </span>
        </div>
      )}

      {/* Warning message */}
      {result.warningMessage && result.riskLevel !== "safe" && (
        <div className={`rounded-lg border p-4 font-mono text-sm ${
          result.riskLevel === "malicious"
            ? "border-malicious/30 bg-malicious/5 text-malicious"
            : "border-suspicious/30 bg-suspicious/5 text-suspicious"
        }`}>
          <div className="flex gap-3">
            {result.blocked ? <Ban className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
            <p>{result.warningMessage}</p>
          </div>
        </div>
      )}

      {/* Safe result */}
      {result.riskLevel === "safe" && (
        <div className="rounded-lg border border-safe/30 bg-safe/5 p-4 font-mono text-sm text-safe">
          <div className="flex gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p>Prompt verified as safe. No injection patterns detected.</p>
          </div>
        </div>
      )}

      {/* Attack explainer — highlighted prompt */}
      {result.attackType && result.attackType !== "None" && result.attackType !== "ML Detection" && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <ShieldAlert className="w-3.5 h-3.5" />
            Why this was flagged
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-block px-2 py-0.5 rounded-md font-mono text-xs font-semibold border ${
              result.riskLevel === "malicious"
                ? "bg-malicious/10 text-malicious border-malicious/20"
                : "bg-suspicious/10 text-suspicious border-suspicious/20"
            }`}>
              {result.attackType}
            </span>
          </div>
          <p className="font-mono text-sm text-foreground/80">
            {ATTACK_TYPE_DESCRIPTIONS[result.attackType] || result.warningMessage}
          </p>
          {/* Highlighted trigger words in the original prompt */}
          <div className="rounded-md bg-background/60 border border-border/60 p-3">
            <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-2">Trigger words highlighted</p>
            <HighlightedPrompt prompt={result.originalPrompt} attackType={result.attackType} />
          </div>
        </div>
      )}

      {/* Safe alternative suggestion */}
      {result.safeAlternative && result.riskLevel !== "safe" && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            Did you mean something like this?
          </div>
          <p className="font-mono text-sm text-foreground/80 italic">
            "{result.safeAlternative}"
          </p>
        </div>
      )}

      {/* Triggered Rules */}
      {result.triggeredRules.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Triggered Rules ({result.triggeredRules.length})
          </h4>
          <div className="space-y-2">
            {result.triggeredRules.map((rule, i) => (
              <div key={i} className="rounded-md border border-border bg-muted/50 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-foreground">{rule.ruleName}</span>
                  <RiskBadge level={rule.riskLevel} size="sm" />
                </div>
                <div className="font-mono text-xs text-muted-foreground">Category: {rule.category}</div>
                <div className="font-mono text-xs">
                  <span className="text-muted-foreground">Match: </span>
                  <code className="px-1.5 py-0.5 rounded bg-background text-foreground">{rule.matchedText}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
