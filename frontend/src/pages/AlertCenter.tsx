import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Filter, AlertTriangle, Info, CheckCircle, Clock, MapPin, Cpu } from "lucide-react";
import { alerts as allAlerts } from "../data/mockData";
import type { Alert } from "../types";
import { cn, formatRelative, basinLabel } from "../lib/utils";

const SEV_ICON = {
  critical: AlertTriangle,
  warning:  Bell,
  info:     Info,
};
const SEV_COLOR = {
  critical: { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400",    badge: "badge-critical" },
  warning:  { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", badge: "badge-warning"  },
  info:     { bg: "bg-ocean-500/10",  border: "border-ocean-500/30",  text: "text-ocean-300",  badge: "badge-info"     },
};
const STATUS_COLOR = {
  firing:       "bg-red-500/20 text-red-300 border border-red-500/30",
  acknowledged: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  resolved:     "bg-green-500/20 text-green-300 border border-green-500/30",
};

function AlertCard({ alert, idx }: { alert: Alert; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon   = SEV_ICON[alert.severity];
  const colors = SEV_COLOR[alert.severity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className={cn("glass-card border overflow-hidden cursor-pointer transition-all duration-200",
        colors.border, expanded && colors.bg
      )}
      onClick={() => setExpanded(p => !p)}
    >
      <div className="p-4 flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", colors.bg)}>
          <Icon className={cn("w-4 h-4", colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{alert.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                  STATUS_COLOR[alert.status])}>{alert.status}</span>
                <span className={colors.badge.includes("badge") ? colors.badge : "badge-info"}>
                  {alert.severity}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-slate-500 font-mono">{formatRelative(alert.detectedAt)}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{alert.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.location}</span>
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{alert.sensorIds.length} sensors</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-ocean-800/20 pt-3 space-y-3">
              <p className="text-xs text-slate-400">{alert.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label:"Basin",      value: basinLabel(alert.oceanBasin) },
                  { label:"Type",       value: alert.type                   },
                  { label:"Detected",   value: new Date(alert.detectedAt).toLocaleString() },
                  { label:"Resolved",   value: alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : "—" },
                  { label:"Value",      value: alert.value ? `${alert.value.toFixed(2)}` : "—" },
                  { label:"Threshold",  value: alert.threshold ? `${alert.threshold.toFixed(2)}` : "—" },
                ].map(f => (
                  <div key={f.label} className="bg-deep-600/40 rounded-lg p-2">
                    <p className="text-[10px] text-slate-600 uppercase">{f.label}</p>
                    <p className="text-white font-medium mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] text-slate-600 uppercase mb-1">Affected Sensors</p>
                <div className="flex gap-1.5 flex-wrap">
                  {alert.sensorIds.map(id => (
                    <span key={id} className="px-2 py-0.5 bg-ocean-500/10 text-ocean-300
                                              border border-ocean-500/20 rounded text-[10px] font-mono">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {alert.status === "firing" && (
                  <>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/20
                                       text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors">
                      Acknowledge
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20
                                       text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-colors">
                      Resolve
                    </button>
                  </>
                )}
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ocean-500/20
                                   text-ocean-300 border border-ocean-500/30 hover:bg-ocean-500/30 transition-colors">
                  View on Map
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AlertCenter() {
  const [search, setSearch]         = useState("");
  const [severityFilter, setSev]    = useState<string>("all");
  const [statusFilter,   setStat]   = useState<string>("all");
  const [sortBy,         setSort]   = useState<"time" | "severity">("time");

  const filtered = useMemo(() => {
    let arr = allAlerts;
    if (search)               arr = arr.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) ||
                                                     a.location.toLowerCase().includes(search.toLowerCase()));
    if (severityFilter !== "all") arr = arr.filter(a => a.severity === severityFilter);
    if (statusFilter   !== "all") arr = arr.filter(a => a.status   === statusFilter);
    if (sortBy === "severity")    arr = [...arr].sort((a,b) => {
      const order = { critical:0, warning:1, info:2 };
      return order[a.severity] - order[b.severity];
    });
    else arr = [...arr].sort((a,b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
    return arr;
  }, [search, severityFilter, statusFilter, sortBy]);

  const stats = {
    critical:     allAlerts.filter(a => a.severity==="critical" && a.status==="firing").length,
    warning:      allAlerts.filter(a => a.severity==="warning"  && a.status==="firing").length,
    acknowledged: allAlerts.filter(a => a.status==="acknowledged").length,
    resolved:     allAlerts.filter(a => a.status==="resolved").length,
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Alert Center</h2>
          <p className="text-slate-500 text-sm mt-0.5">{allAlerts.length} total alerts across all ocean basins</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-slow" />
          <span className="text-sm text-red-400 font-medium">{stats.critical} Critical Active</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Critical Firing",  count: stats.critical,     icon: AlertTriangle, color:"text-red-400",    bg:"bg-red-500/10",    border:"border-red-500/20"    },
          { label:"Warnings Active",  count: stats.warning,      icon: Bell,          color:"text-yellow-400", bg:"bg-yellow-500/10", border:"border-yellow-500/20" },
          { label:"Acknowledged",     count: stats.acknowledged, icon: Clock,         color:"text-ocean-300",  bg:"bg-ocean-500/10",  border:"border-ocean-500/20"  },
          { label:"Resolved Today",   count: stats.resolved,     icon: CheckCircle,   color:"text-green-400",  bg:"bg-green-500/10",  border:"border-green-500/20"  },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
            className={cn("glass-card p-4 border", s.border, s.bg)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.count}</p>
              </div>
              <s.icon className={cn("w-6 h-6", s.color)} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search alerts…"
            className="w-full bg-deep-700/50 border border-ocean-800/30 rounded-lg
                       pl-9 pr-4 py-1.5 text-sm text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:border-ocean-400/50"
          />
        </div>
        <select value={severityFilter} onChange={e => setSev(e.target.value)}
          className="bg-deep-700/50 border border-ocean-800/30 text-xs text-slate-300
                     rounded-lg px-3 py-1.5 focus:outline-none">
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select value={statusFilter} onChange={e => setStat(e.target.value)}
          className="bg-deep-700/50 border border-ocean-800/30 text-xs text-slate-300
                     rounded-lg px-3 py-1.5 focus:outline-none">
          <option value="all">All Status</option>
          <option value="firing">Firing</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={sortBy} onChange={e => setSort(e.target.value as any)}
          className="bg-deep-700/50 border border-ocean-800/30 text-xs text-slate-300
                     rounded-lg px-3 py-1.5 focus:outline-none">
          <option value="time">Sort: Newest First</option>
          <option value="severity">Sort: Severity</option>
        </select>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} results</span>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-white font-semibold">No alerts match your filters</p>
            <p className="text-slate-500 text-sm mt-1">All clear in selected criteria</p>
          </div>
        ) : (
          filtered.map((alert, i) => <AlertCard key={alert.id} alert={alert} idx={i} />)
        )}
      </div>
    </div>
  );
}
