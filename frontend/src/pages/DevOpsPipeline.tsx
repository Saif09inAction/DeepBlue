import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, CheckCircle, XCircle, Clock, Play, Package, Shield, Upload, RefreshCw, Monitor, Zap } from "lucide-react";
import { cn } from "../lib/utils";

type StageStatus = "success" | "running" | "failed" | "pending";

interface PipelineStage {
  id:       string;
  label:    string;
  sublabel: string;
  icon:     React.ElementType;
  color:    string;
  status:   StageStatus;
  duration: string;
}

const INITIAL_STAGES: PipelineStage[] = [
  { id:"github",   label:"GitHub",          sublabel:"Source control · PR merge",      icon:GitBranch,  color:"text-white",      status:"success", duration:"—"     },
  { id:"lint",     label:"Lint & Test",     sublabel:"pytest · ruff · mypy · 85%+ cov",icon:CheckCircle,color:"text-green-400",  status:"success", duration:"1m 42s" },
  { id:"security", label:"Security Scan",   sublabel:"Trivy · Snyk · Checkov",         icon:Shield,     color:"text-amber-400",  status:"success", duration:"2m 15s" },
  { id:"build",    label:"Docker Build",    sublabel:"Multi-stage · BuildKit · SBOM",   icon:Package,    color:"text-ocean-300",  status:"success", duration:"3m 08s" },
  { id:"push",     label:"Push to ECR",     sublabel:"Sign with Cosign · OIDC auth",   icon:Upload,     color:"text-cyan-400",   status:"success", duration:"0m 55s" },
  { id:"dev",      label:"Deploy to Dev",   sublabel:"ArgoCD · Auto-sync · Smoke test",icon:Play,       color:"text-purple-400", status:"success", duration:"1m 30s" },
  { id:"staging",  label:"Staging Deploy",  sublabel:"k6 perf tests · Integration",    icon:RefreshCw,  color:"text-yellow-400", status:"running", duration:"running" },
  { id:"approval", label:"Approval Gate",   sublabel:"Manual review required",         icon:Clock,      color:"text-slate-400",  status:"pending", duration:"—"      },
  { id:"prod",     label:"Production",      sublabel:"ArgoCD · Canary → 100%",         icon:Zap,        color:"text-green-400",  status:"pending", duration:"—"      },
  { id:"monitor",  label:"Post-Deploy Mon.", sublabel:"Prometheus · Grafana · Rollback",icon:Monitor,    color:"text-ocean-300",  status:"pending", duration:"—"      },
];

const STATUS_STYLES: Record<StageStatus, { border: string; bg: string; ring: string }> = {
  success: { border:"border-green-500/40",  bg:"bg-green-500/10",   ring:"ring-green-500/20" },
  running: { border:"border-yellow-500/40", bg:"bg-yellow-500/10",  ring:"ring-yellow-500/20" },
  failed:  { border:"border-red-500/40",    bg:"bg-red-500/10",     ring:"ring-red-500/20" },
  pending: { border:"border-slate-700/40",  bg:"bg-deep-600/30",    ring:"ring-slate-700/20" },
};

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === "success") return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (status === "failed")  return <XCircle     className="w-4 h-4 text-red-400"   />;
  if (status === "running") return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease:"linear" }}>
      <RefreshCw className="w-4 h-4 text-yellow-400" />
    </motion.div>
  );
  return <Clock className="w-4 h-4 text-slate-500" />;
}

const RECENT_RUNS = [
  { id:"#247", branch:"main",     commit:"sha-a3f7b2c", status:"success", duration:"11m 22s", ago:"2 mins ago",  user:"saif@deepblue" },
  { id:"#246", branch:"main",     commit:"sha-91e4a5f", status:"success", duration:"10m 48s", ago:"38 mins ago", user:"ci-bot"         },
  { id:"#245", branch:"release/2.4.1", commit:"sha-7c2d8b1",status:"failed",  duration:"4m 12s",  ago:"1h 12m ago",  user:"saif@deepblue" },
  { id:"#244", branch:"develop",  commit:"sha-e6b3f9a", status:"success", duration:"12m 05s", ago:"3h ago",      user:"data-eng"      },
  { id:"#243", branch:"main",     commit:"sha-2d1c4e7", status:"success", duration:"9m 58s",  ago:"5h ago",      user:"platform-team" },
];

const GITOPS_APPS = [
  { name:"deepblue-ingestion-prod",  sync:"Synced",  health:"Healthy",   version:"v2.4.1", updated:"2m ago" },
  { name:"deepblue-api-prod",        sync:"Synced",  health:"Healthy",   version:"v2.4.1", updated:"2m ago" },
  { name:"deepblue-processing-prod", sync:"Synced",  health:"Healthy",   version:"v2.3.9", updated:"1h ago" },
  { name:"deepblue-monitoring-prod", sync:"Synced",  health:"Healthy",   version:"v1.8.2", updated:"1d ago" },
  { name:"deepblue-security-prod",   sync:"OutOfSync",health:"Degraded", version:"v1.2.0", updated:"3d ago" },
];

export default function DevOpsPipeline() {
  const [stages, setStages] = useState(INITIAL_STAGES);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(60);

  const triggerPipeline = () => {
    if (running) return;
    setRunning(true);
    setStages(prev => prev.map((s, i) => i <= 5 ? { ...s, status:"success" }
      : i === 6 ? { ...s, status:"running" } : { ...s, status:"pending" }
    ));

    let step = 6;
    const interval = setInterval(() => {
      step++;
      setStages(prev => prev.map((s, i) => {
        if (i < step) return { ...s, status:"success" };
        if (i === step) return { ...s, status:"running" };
        return { ...s, status:"pending" };
      }));
      setProgress(Math.round((step / INITIAL_STAGES.length) * 100));
      if (step >= INITIAL_STAGES.length - 1) {
        clearInterval(interval);
        setStages(prev => prev.map(s => ({ ...s, status:"success" })));
        setProgress(100);
        setRunning(false);
      }
    }, 1800);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">DevOps Pipeline</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            GitHub Actions · ArgoCD GitOps · Jenkins · ECR · EKS
          </p>
        </div>
        <button
          onClick={triggerPipeline}
          disabled={running}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            running
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 cursor-not-allowed"
              : "bg-ocean-500/20 text-ocean-300 border border-ocean-500/30 hover:bg-ocean-500/30"
          )}
        >
          {running
            ? <><motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}><RefreshCw className="w-4 h-4" /></motion.div>Running…</>
            : <><Play className="w-4 h-4" />Simulate Pipeline</>
          }
        </button>
      </div>

      {/* Progress bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-slate-400">Pipeline Run #248 · main branch</span>
          <span className="font-mono text-ocean-300">{progress}%</span>
        </div>
        <div className="h-2 bg-deep-600 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-ocean-500 to-cyan-400 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">CI/CD Pipeline Stages</h3>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {stages.map((stage, i) => {
            const s = STATUS_STYLES[stage.status];
            return (
              <div key={stage.id} className="flex items-center shrink-0">
                <motion.div
                  initial={{ opacity:0, y:12 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.07 }}
                  className={cn("w-28 p-3 rounded-xl border text-center transition-all duration-300",
                    s.border, s.bg,
                    stage.status === "running" && "ring-2 " + s.ring
                  )}
                >
                  <div className="flex justify-center mb-1.5">
                    {stage.status === "running"
                      ? <motion.div animate={{ scale:[1,1.2,1] }} transition={{ duration:1, repeat:Infinity }}>
                          <stage.icon className={cn("w-5 h-5", stage.color)} />
                        </motion.div>
                      : <stage.icon className={cn("w-5 h-5", stage.color,
                          stage.status === "pending" && "opacity-40")} />
                    }
                  </div>
                  <p className={cn("text-[11px] font-semibold leading-tight",
                    stage.status === "pending" ? "text-slate-600" : "text-white")}>
                    {stage.label}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <StatusIcon status={stage.status} />
                    <span className={cn("text-[9px] font-mono",
                      stage.status === "pending" ? "text-slate-700" : "text-slate-500")}>
                      {stage.duration}
                    </span>
                  </div>
                </motion.div>
                {i < stages.length - 1 && (
                  <motion.div
                    className={cn("w-6 h-0.5 mx-1 shrink-0",
                      i < stages.findIndex(s => s.status !== "success")
                        ? "bg-green-500/50" : "bg-deep-500"
                    )}
                    animate={{ opacity: stages[i].status === "success" ? 1 : 0.3 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent runs */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Pipeline Runs</h3>
          <div className="space-y-2">
            {RECENT_RUNS.map((run, i) => (
              <motion.div
                key={run.id}
                initial={{ opacity:0, x:-10 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 bg-deep-600/30 rounded-lg border border-ocean-800/20"
              >
                {run.status === "success"
                  ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  : <XCircle    className="w-4 h-4 text-red-400   shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-white">{run.id}</span>
                    <span className="text-[10px] bg-ocean-500/20 text-ocean-300 px-1.5 py-0.5 rounded font-mono">
                      {run.branch}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {run.commit} · {run.user}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-slate-300">{run.duration}</p>
                  <p className="text-[10px] text-slate-600">{run.ago}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ArgoCD Apps */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">ArgoCD Applications</h3>
          <div className="space-y-2">
            {GITOPS_APPS.map((app, i) => (
              <motion.div
                key={app.name}
                initial={{ opacity:0, x:10 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 bg-deep-600/30 rounded-lg border border-ocean-800/20"
              >
                <div className={cn("w-2 h-2 rounded-full shrink-0",
                  app.sync === "Synced" && app.health === "Healthy" ? "bg-green-400" : "bg-red-400"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-white truncate">{app.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium",
                      app.sync === "Synced" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                    )}>{app.sync}</span>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium",
                      app.health === "Healthy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>{app.health}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-ocean-300">{app.version}</p>
                  <p className="text-[10px] text-slate-600">{app.updated}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
