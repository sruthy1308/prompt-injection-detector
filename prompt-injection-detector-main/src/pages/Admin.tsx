import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Shield, ShieldX, ShieldCheck, ShieldAlert, Ban,
  Activity, AlertTriangle, Database, Cpu, ArrowLeft,
  Search, Download, ToggleLeft, ToggleRight, RefreshCw,
  Clock, TrendingUp, Filter, Lock, Eye, EyeOff,
} from "lucide-react";
import { adminStore } from "@/lib/admin-store";
import type { DetectionResult } from "@/types/detection";
import { ParticleField } from "@/components/ParticleField";

// ── Change this to your preferred admin password ──
const ADMIN_PASSWORD = "admin123";
const SESSION_KEY = "pid_admin_auth";

const COLORS = {
  safe:       "#00d97e",
  suspicious: "#f5a623",
  malicious:  "#e5534b",
  primary:    "#00d97e",
};

const ATTACK_COLORS = ["#00d97e","#f5a623","#e5534b","#38bdf8","#a78bfa","#fb923c"];

// ── Rule engine config (frontend toggle only) ──
const DEFAULT_RULES = [
  { id: "harmful",    name: "Harmful Content",      active: true,  hits: 0 },
  { id: "injection",  name: "Prompt Injection",      active: true,  hits: 0 },
  { id: "role",       name: "Role Manipulation",     active: true,  hits: 0 },
  { id: "override",   name: "Instruction Override",  active: true,  hits: 0 },
  { id: "exfil",      name: "Data Exfiltration",     active: true,  hits: 0 },
  { id: "social",     name: "Social Engineering",    active: true,  hits: 0 },
  { id: "encoding",   name: "Encoding Attack",       active: true,  hits: 0 },
];

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number | string; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="cyber-card rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-muted-foreground/50">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm p-3 font-mono text-xs space-y-1">
      {label && <p className="text-muted-foreground mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
      setPassword("");
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <ParticleField />
        <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60 z-50" />
        <div className="relative z-10 w-full max-w-sm mx-4">
          <div className="cyber-card rounded-xl border border-primary/20 bg-card/80 backdrop-blur-sm p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h1 className="font-display text-xl font-bold text-primary tracking-wider">ADMIN ACCESS</h1>
              <p className="font-mono text-xs text-muted-foreground/60">Enter admin password to continue</p>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Password"
                  className={`w-full bg-background/60 border rounded-lg px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 transition-all pr-10 ${
                    pwError ? "border-malicious/60 focus:ring-malicious/40" : "border-border focus:ring-primary/40 focus:border-primary/40"
                  }`}
                />
                <button onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwError && <p className="font-mono text-[11px] text-malicious">Incorrect password. Try again.</p>}
              <button onClick={handleLogin}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-mono text-sm font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                Access Dashboard
              </button>
            </div>
            <div className="text-center">
              <Link to="/" className="font-mono text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                ← Back to detector
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {

  const refresh = useCallback(() => {
    setResults([...adminStore.results]);
    setStats(adminStore.getStats());

    // Update rule hit counts from results
    setRules((prev) => prev.map((r) => ({
      ...r,
      hits: adminStore.results.filter((res) =>
        res.attackType?.toLowerCase().includes(r.id) ||
        res.attackType?.toLowerCase().replace(" ", "") === r.id
      ).length,
    })));
  }, []);

  useEffect(() => {
    refresh();
    return adminStore.subscribe(refresh);
  }, [refresh]);

  const filtered = results.filter((r) => {
    const matchLevel = filterLevel === "all" || r.riskLevel === filterLevel;
    const matchSearch = r.originalPrompt.toLowerCase().includes(search.toLowerCase()) ||
      (r.attackType || "").toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const hourly   = adminStore.getHourlyActivity();
  const attacks  = adminStore.getAttackTypeBreakdown();
  const scoreDist = adminStore.getScoreDistribution();

  const uptimeStr = (() => {
    const s = Math.floor((Date.now() - uptime.getTime()) / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m ${s % 60}s`;
  })();

  const exportCSV = () => {
    const rows = [
      ["ID","Prompt","Risk Level","Score","Attack Type","Timestamp","Blocked"],
      ...results.map((r) => [
        r.id, `"${r.originalPrompt.replace(/"/g,'""')}"`,
        r.riskLevel, r.score, r.attackType || "None",
        new Date(r.timestamp).toISOString(), r.blocked,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `promptguard-logs-${Date.now()}.csv`;
    a.click();
  };

  const tabs = [
    { id: "overview", label: "Overview",    icon: Activity },
    { id: "logs",     label: "Prompt Logs", icon: Database },
    { id: "rules",    label: "Rule Engine", icon: Shield },
    { id: "system",   label: "System",      icon: Cpu },
  ] as const;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleField />
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60 z-50" />

      <div className="relative z-10">
        {/* Top nav */}
        <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Link>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-display text-sm font-bold text-primary tracking-wider">PROMPT INJECTION DETECTOR</span>
                <span className="font-mono text-[10px] text-muted-foreground/50 border border-border px-1.5 py-0.5 rounded">ADMIN</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-safe">
                <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
                System Online
              </div>
              <button onClick={refresh} className="p-1.5 rounded-md border border-border hover:bg-accent transition-colors">
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Tab nav */}
          <div className="flex gap-1 p-1 rounded-xl border border-border bg-card/50 w-fit">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="Total Scans"  value={stats.total}      icon={Activity}     color="text-foreground/80" />
                <StatCard label="Safe"         value={stats.safe}       icon={ShieldCheck}  color="text-safe"         sub={stats.total ? `${Math.round(stats.safe/stats.total*100)}%` : "0%"} />
                <StatCard label="Suspicious"   value={stats.suspicious} icon={ShieldAlert}  color="text-suspicious"   sub={stats.total ? `${Math.round(stats.suspicious/stats.total*100)}%` : "0%"} />
                <StatCard label="Malicious"    value={stats.malicious}  icon={ShieldX}      color="text-malicious"    sub={stats.total ? `${Math.round(stats.malicious/stats.total*100)}%` : "0%"} />
                <StatCard label="Blocked"      value={stats.blocked}    icon={Ban}          color="text-malicious"    />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Hourly activity */}
                <div className="lg:col-span-2 cyber-card rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground/60 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" /> Hourly Activity
                  </h3>
                  {hourly.length === 0 ? (
                    <div className="h-48 flex items-center justify-center font-mono text-xs text-muted-foreground/40">No data yet — run some analyses</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={hourly}>
                        <defs>
                          <linearGradient id="gSafe" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={COLORS.safe}       stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.safe}       stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gSusp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={COLORS.suspicious} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.suspicious} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gMal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={COLORS.malicious}  stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.malicious}  stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#666" }} />
                        <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#666" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                        <Area type="monotone" dataKey="safe"       stroke={COLORS.safe}       fill="url(#gSafe)" strokeWidth={1.5} />
                        <Area type="monotone" dataKey="suspicious" stroke={COLORS.suspicious} fill="url(#gSusp)" strokeWidth={1.5} />
                        <Area type="monotone" dataKey="malicious"  stroke={COLORS.malicious}  fill="url(#gMal)"  strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Attack type pie */}
                <div className="cyber-card rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground/60 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-primary" /> Attack Types
                  </h3>
                  {attacks.length === 0 ? (
                    <div className="h-48 flex items-center justify-center font-mono text-xs text-muted-foreground/40">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={attacks} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                          dataKey="value" nameKey="name" paddingAngle={3}>
                          {attacks.map((_, i) => (
                            <Cell key={i} fill={ATTACK_COLORS[i % ATTACK_COLORS.length]} opacity={0.85} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 9, fontFamily: "JetBrains Mono" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Score distribution + recent threats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="cyber-card rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground/60 mb-4 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-primary" /> Risk Score Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={scoreDist}>
                      <XAxis dataKey="range" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#666" }} />
                      <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#666" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[4,4,0,0]}>
                        {scoreDist.map((_, i) => (
                          <Cell key={i} fill={i < 2 ? COLORS.safe : i === 2 ? COLORS.suspicious : COLORS.malicious} opacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent threats */}
                <div className="cyber-card rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground/60 mb-3 flex items-center gap-2">
                    <ShieldX className="w-3.5 h-3.5 text-malicious" /> Recent Threats
                  </h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {results.filter((r) => r.riskLevel !== "safe").slice(0, 8).length === 0 ? (
                      <p className="font-mono text-xs text-muted-foreground/40 text-center py-4">No threats detected yet</p>
                    ) : (
                      results.filter((r) => r.riskLevel !== "safe").slice(0, 8).map((r) => (
                        <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                          <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${r.riskLevel === "malicious" ? "bg-malicious" : "bg-suspicious"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-[11px] text-foreground/80 truncate">{r.originalPrompt}</p>
                            <p className="font-mono text-[9px] text-muted-foreground/50">{r.attackType || r.riskLevel} · {new Date(r.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── LOGS ── */}
          {activeTab === "logs" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search prompts or attack types..."
                    className="w-full pl-9 pr-4 py-2 bg-card/60 border border-border rounded-lg font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40" />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-card/50">
                  {["all","safe","suspicious","malicious"].map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-all ${
                        filterLevel === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}>{f}</button>
                  ))}
                </div>
                <button onClick={exportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>

              <div className="cyber-card rounded-xl border border-border bg-card/70 backdrop-blur-sm overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_80px_120px_80px] gap-0 border-b border-border bg-muted/30 px-4 py-2">
                  {["Prompt","Risk Level","Score","Attack Type","Time"].map((h) => (
                    <span key={h} className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">{h}</span>
                  ))}
                </div>
                <div className="max-h-[500px] overflow-y-auto divide-y divide-border/40">
                  {filtered.length === 0 ? (
                    <div className="py-12 text-center font-mono text-xs text-muted-foreground/40">No results found</div>
                  ) : (
                    filtered.map((r) => (
                      <div key={r.id} className="grid grid-cols-[1fr_100px_80px_120px_80px] gap-0 px-4 py-3 hover:bg-muted/20 transition-colors">
                        <span className="font-mono text-xs text-foreground/80 truncate pr-4">{r.originalPrompt}</span>
                        <span className={`font-mono text-[10px] font-bold uppercase ${
                          r.riskLevel === "safe" ? "text-safe" : r.riskLevel === "suspicious" ? "text-suspicious" : "text-malicious"
                        }`}>{r.riskLevel}</span>
                        <span className="font-mono text-xs text-muted-foreground">{r.score}</span>
                        <span className="font-mono text-[10px] text-muted-foreground/70 truncate">{r.attackType || "—"}</span>
                        <span className="font-mono text-[10px] text-muted-foreground/50">{new Date(r.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
                  <span className="font-mono text-[10px] text-muted-foreground/40">{filtered.length} of {results.length} entries</span>
                </div>
              </div>
            </div>
          )}

          {/* ── RULES ── */}
          {activeTab === "rules" && (
            <div className="space-y-4 animate-fade-in-up">
              <p className="font-mono text-xs text-muted-foreground/50">Toggle detection rules. Disabled rules will be skipped during analysis.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rules.map((rule) => (
                  <div key={rule.id} className={`cyber-card rounded-xl border bg-card/70 backdrop-blur-sm p-4 flex items-center justify-between transition-all ${
                    rule.active ? "border-primary/20" : "border-border opacity-50"
                  }`}>
                    <div className="space-y-0.5">
                      <p className="font-mono text-sm font-semibold text-foreground">{rule.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/50">{rule.hits} hits this session</p>
                    </div>
                    <button onClick={() => setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, active: !r.active } : r))}
                      className="transition-colors">
                      {rule.active
                        ? <ToggleRight className="w-8 h-8 text-primary" />
                        : <ToggleLeft  className="w-8 h-8 text-muted-foreground/40" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SYSTEM ── */}
          {activeTab === "system" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in-up">
              <div className="cyber-card rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 space-y-4">
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground/60 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-primary" /> Backend Status
                </h3>
                {[
                  { label: "API Endpoint",    value: "http://127.0.0.1:8000" },
                  { label: "Model",           value: "Logistic Regression (TF-IDF)" },
                  { label: "Vectorizer",      value: "TF-IDF ngram(1,3) 8000 features" },
                  { label: "Detection Layers",value: "Rule-Based + ML" },
                  { label: "Session Uptime",  value: uptimeStr },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <span className="font-mono text-[11px] text-muted-foreground/60">{item.label}</span>
                    <span className="font-mono text-[11px] text-foreground/80">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="cyber-card rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 space-y-4">
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground/60 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary" /> Session Stats
                </h3>
                {[
                  { label: "Total Analyzed",    value: stats.total },
                  { label: "Threats Detected",  value: stats.malicious + stats.suspicious },
                  { label: "Blocked",           value: stats.blocked },
                  { label: "Detection Rate",    value: stats.total ? `${Math.round((stats.malicious + stats.suspicious) / stats.total * 100)}%` : "0%" },
                  { label: "Active Rules",      value: `${rules.filter((r) => r.active).length} / ${rules.length}` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <span className="font-mono text-[11px] text-muted-foreground/60">{item.label}</span>
                    <span className="font-mono text-[11px] text-primary font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="md:col-span-2 cyber-card rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5">
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground/60 mb-4 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Activity Log
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {results.slice(0, 20).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 font-mono text-[10px]">
                      <span className="text-muted-foreground/40 shrink-0">{new Date(r.timestamp).toLocaleTimeString()}</span>
                      <span className={`shrink-0 w-16 ${r.riskLevel === "safe" ? "text-safe" : r.riskLevel === "suspicious" ? "text-suspicious" : "text-malicious"}`}>
                        [{r.riskLevel.toUpperCase()}]
                      </span>
                      <span className="text-muted-foreground/60 truncate">{r.originalPrompt}</span>
                    </div>
                  ))}
                  {results.length === 0 && (
                    <p className="text-muted-foreground/40 text-center py-4">No activity yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
