import type { DetectionResult } from "@/types/detection";

// Simple in-memory store shared across the app
class AdminStore {
  private listeners: (() => void)[] = [];
  results: DetectionResult[] = [];

  add(result: DetectionResult) {
    this.results = [result, ...this.results].slice(0, 500);
    this.listeners.forEach((l) => l());
  }

  clear() {
    this.results = [];
    this.listeners.forEach((l) => l());
  }

  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((l) => l !== fn); };
  }

  getStats() {
    const total = this.results.length;
    const safe = this.results.filter((r) => r.riskLevel === "safe").length;
    const suspicious = this.results.filter((r) => r.riskLevel === "suspicious").length;
    const malicious = this.results.filter((r) => r.riskLevel === "malicious").length;
    const blocked = this.results.filter((r) => r.blocked).length;
    return { total, safe, suspicious, malicious, blocked };
  }

  getAttackTypeBreakdown() {
    const map: Record<string, number> = {};
    this.results.forEach((r) => {
      const key = r.attackType || (r.riskLevel === "safe" ? "Safe" : "Unknown");
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }

  getHourlyActivity() {
    const map: Record<string, { safe: number; suspicious: number; malicious: number }> = {};
    this.results.forEach((r) => {
      const h = new Date(r.timestamp).getHours();
      const key = `${h.toString().padStart(2, "0")}:00`;
      if (!map[key]) map[key] = { safe: 0, suspicious: 0, malicious: 0 };
      map[key][r.riskLevel]++;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, v]) => ({ hour, ...v }));
  }

  getScoreDistribution() {
    const buckets = [
      { range: "0-20",  count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100",count: 0 },
    ];
    this.results.forEach((r) => {
      if (r.score <= 20) buckets[0].count++;
      else if (r.score <= 40) buckets[1].count++;
      else if (r.score <= 60) buckets[2].count++;
      else if (r.score <= 80) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }
}

export const adminStore = new AdminStore();
