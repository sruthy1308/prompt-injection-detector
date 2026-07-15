import type { DetectionResult } from "@/types/detection";
import { adminStore } from "./admin-store";

let idCounter = 0;

export async function analyzePrompt(prompt: string): Promise<DetectionResult> {
  const response = await fetch("http://127.0.0.1:8000/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error("Backend request failed");
  }

  const data = await response.json();
  console.log("BACKEND DATA:", data);

  const riskLevel =
    data.classification === "Malicious"
      ? "malicious"
      : data.classification === "Suspicious"
      ? "suspicious"
      : "safe";

  const score =
    data.risk_score !== undefined
      ? data.risk_score
      : data.risk_level === "High"
      ? 90
      : data.risk_level === "Medium"
      ? 55
      : 10;

  const result: DetectionResult = {
    id: `analysis-${++idCounter}`,
    originalPrompt: prompt,
    normalizedPrompt: prompt.toLowerCase(),
    riskLevel,
    score,
    triggeredRules: [],
    timestamp: new Date(),
    blocked: riskLevel === "malicious",
    warningMessage: data.explanation,
    attackType: data.attack_type !== "None" ? data.attack_type : undefined,
    safeAlternative: data.safe_alternative ?? undefined,
    detectedLanguage: data.detected_language ?? "en",
    translated: data.translated ?? false,
    confidence: data.confidence ?? undefined,
  };

  adminStore.add(result);
  return result;
}