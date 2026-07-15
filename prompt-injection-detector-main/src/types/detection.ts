export type RiskLevel = "safe" | "suspicious" | "malicious";

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  riskLevel: RiskLevel;
  category: string;
}

export interface DetectionResult {
  id: string;
  originalPrompt: string;
  normalizedPrompt: string;
  riskLevel: RiskLevel;
  score: number; // 0-100
  triggeredRules: TriggeredRule[];
  timestamp: Date;
  blocked: boolean;
  warningMessage?: string;
  attackType?: string;
  safeAlternative?: string;
  detectedLanguage?: string;
  translated?: boolean;
  confidence?: string;
}

export interface TriggeredRule {
  ruleId: string;
  ruleName: string;
  category: string;
  riskLevel: RiskLevel;
  matchedText: string;
}

export interface AnalysisStats {
  total: number;
  safe: number;
  suspicious: number;
  malicious: number;
  blocked: number;
}
