import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
}
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Waves, Ship, Satellite, Globe2, AlertTriangle, Database,
  TrendingUp, TrendingDown, Activity, Zap, ArrowUpRight,
} from "lucide-react";
import {
  temperatureTrend, ingestionVolume, waveHeightTrend,
  generateActivity, type ActivityItem,
} from "../data/mockData";
import { cn, formatRelative } from "../lib/utils";
import { api } from "../api/client";
import { useApi } from "../api/useApi";

function AnimatedValue({ end, active }: { end: number; active: boolean }) {
  const count = useCountUp(active ? end : 0);
  return <span className="stat-value">{count.toLocaleString()}</span>;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, unit = "", delta, color, delay = 0,
}: {
  icon: React.ElementType; label: string; value: number; unit?: string;
  delta?: number; color: string; delay?: number;
}) {
  const ref  = useRef(null);
  const view = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={view ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="glass-card-hover p-5 relative overflow-hidden"
    >
      {/* Background glow */}
      <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10", color)} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">{label}</p>
          <div className="flex items-end gap-1.5">
            <AnimatedValue end={value} active={view} />
            {unit && <span className="text-sm text-slate-400 mb-1">{unit}</span>}
          </div>
          {delta !== undefined && (
            <div className={cn("flex items-center gap-1 mt-1.5 text-xs font-medium",
              delta >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(delta)}% from last week
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", color.replace("bg-","bg-").replace("-500","-500/20"))}>
          <Icon className={cn("w-6 h-6", color.replace("bg-","text-"))} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Globe Hero ────────────────────────────────────────────────────────────────
function GlobeHero() {
  return (
    <div className="relative flex items-center justify-center h-36 mb-2 overflow-hidden">
      {/* Animated rings */}
      {[120, 90, 60, 30].map((size, i) => (
        <motion.div
          key={size}
          className="absolute rounded-full border border-ocean-400/10"
          style={{ width: size * 2, height: size * 2 }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
        />
      ))}
      {/* Core globe */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-24 h-24 rounded-full flex items-center justify-center
                   bg-gradient-to-br from-ocean-600/40 to-cyber-600/30
                   border border-ocean-400/20 shadow-ocean-lg"
      >
        <Globe2 className="w-10 h-10 text-ocean-300" />
        <motion.div
          className="absolute inset-0 rounded-full bg-ocean-400/5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      {/* Orbiting dots */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.div
          key={deg}
          className="absolute w-1.5 h-1.5 rounded-full bg-ocean-400"
          style={{
            left: "50%", top: "50%",
            transform: `rotate(${deg}deg) translateX(70px)`,
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>(
    Array.from({ length: 8 }, generateActivity)
  );
  useEffect(() => {
    const t = setInterval(() => {
      setItems(prev => [generateActivity(), ...prev.slice(0, 11)]);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const color = (type: ActivityItem["type"]) => {
    switch (type) {
      case "success": return "bg-green-400";
      case "warn":    return "bg-yellow-400";
      case "error":   return "bg-red-400";
      default:        return "bg-ocean-400";
    }
  };

  return (
    <div className="space-y-0 max-h-64 overflow-y-auto pr-1">
      {items.map(item => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3 py-2.5 border-b border-ocean-800/20 last:border-0"
        >
          <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", color(item.type))} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300 truncate">{item.msg}</p>
            <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{item.time}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 border border-ocean-700/40 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: health }  = useApi(api.health,  null, 10_000);
  const { data: basins }  = useApi(api.oceanBasins, null, 20_000);
  const { data: ingest }  = useApi(() => api.ingestion(20), null, 8_000);
  const { data: alertStats } = useApi(api.alertStats, null, 10_000);

  const onlineSensors = health?.sensors_online  ?? 0;
  const activeAlerts  = health?.active_alerts   ?? 0;
  const ingestionRate = ingest?.ingestion_rate_eps ?? 0;
  const bufferSize    = ingest?.buffer_size ?? 0;

  // Build basin chart from live API data
  const basinSensorCount = basins
    ? Object.entries(basins.ocean_basins).map(([key, val]) => ({
        name: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        value: val.total_sensors,
      }))
    : [];

  // Alert distribution from live API
  const alertDistribution = alertStats
    ? [
        { name: "Critical", value: alertStats.critical,                                      fill: "#ef4444" },
        { name: "Warning",  value: alertStats.warning,                                       fill: "#f59e0b" },
        { name: "Resolved", value: Math.max(0, alertStats.total_alerts - alertStats.critical - alertStats.warning), fill: "#10b981" },
      ]
    : [
        { name: "Critical", value: 0, fill: "#ef4444" },
        { name: "Warning",  value: 0, fill: "#f59e0b" },
        { name: "Resolved", value: 0, fill: "#10b981" },
      ];

  const kpis = [
    { icon: Waves,         label: "Active Sensors",      value: onlineSensors,       unit:"",    delta: 4.2,  color:"bg-ocean-400"  },
    { icon: Ship,          label: "Research Vessels",     value: 8,                   unit:"",    delta: 0,    color:"bg-cyan-400"   },
    { icon: Satellite,     label: "Satellite Feeds",      value: 12,                  unit:"",    delta: 8.3,  color:"bg-purple-400" },
    { icon: Globe2,        label: "Ocean Basins",         value: basins ? Object.keys(basins.ocean_basins).length : 7, unit:"", delta: 0, color:"bg-emerald-400"},
    { icon: AlertTriangle, label: "Active Alerts",        value: activeAlerts,        unit:"",    delta: -12,  color:"bg-red-400"    },
    { icon: Database,      label: "Buffer Events",        value: bufferSize,          unit:"",    delta: 22.1, color:"bg-amber-400"  },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-glow-blue pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-info">LIVE</span>
              <span className="text-xs text-slate-500 font-mono">
                {new Date().toUTCString()}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
              DeepBlue Intelligence Platform
            </h1>
            <p className="text-slate-400 text-sm">
              Real-time oceanographic monitoring across {basins ? Object.keys(basins.ocean_basins).length : 7} ocean basins · {onlineSensors || "—"} active sensors · v{health?.version ?? "2.4.1"}
            </p>
            <div className="flex items-center gap-4 mt-4">
              {[
                { label:"Ingestion Rate",   value: ingestionRate > 0 ? `${ingestionRate.toFixed(1)} ev/s` : "—",  up: true  },
                { label:"Kafka Lag Topics", value: ingest ? Object.keys(ingest.kafka_lag).length + " topics" : "—", up: false },
                { label:"System Health",    value: health?.status === "healthy" ? "99.97%" : "Degraded", up: health?.status === "healthy" },
                { label:"Buffer Events",    value: bufferSize > 0 ? bufferSize.toLocaleString() : "—", up: false },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <ArrowUpRight className={cn("w-3 h-3", stat.up ? "text-green-400" : "text-red-400",
                    !stat.up && "rotate-90")} />
                  <span className="text-xs text-slate-500">{stat.label}:</span>
                  <span className="text-xs font-semibold text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
          <GlobeHero />
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => <KpiCard key={k.label} {...k} delay={i * 0.08} />)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Temperature Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Ocean Temperature Trends</h3>
              <p className="text-xs text-slate-500">North Atlantic · North Pacific · Southern Ocean</p>
            </div>
            <Activity className="w-4 h-4 text-ocean-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={temperatureTrend}>
              <defs>
                {[
                  { id:"t1", color:"#0ea5e9" },
                  { id:"t2", color:"#06b6d4" },
                  { id:"t3", color:"#8b5cf6" },
                ].map(g => (
                  <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={g.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={g.color} stopOpacity={0}   />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} unit="°C" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
              <Area type="monotone" dataKey="value"  name="N. Atlantic" stroke="#0ea5e9" fill="url(#t1)" strokeWidth={2} />
              <Area type="monotone" dataKey="value2" name="N. Pacific"  stroke="#06b6d4" fill="url(#t2)" strokeWidth={2} />
              <Area type="monotone" dataKey="value3" name="Southern"    stroke="#8b5cf6" fill="url(#t3)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Ingestion Volume */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Data Ingestion Volume</h3>
              <p className="text-xs text-slate-500">Events per second · last 24 hours</p>
            </div>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ingestionVolume}>
              <defs>
                <linearGradient id="ingBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#0ea5e9" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false}
                     interval={3} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Events" fill="url(#ingBar)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wave Height */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Wave Height Trends</h3>
              <p className="text-xs text-slate-500">Average significant wave height (meters)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={waveHeightTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} unit="m" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" name="Wave Height" stroke="#06b6d4"
                    strokeWidth={2.5} dot={false} activeDot={{ r:4, fill:"#06b6d4" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Alert Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Alert Distribution</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={alertDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                   paddingAngle={4} dataKey="value">
                {alertDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-2">
            {alertDistribution.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="font-semibold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Basin breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Sensors per Ocean Basin</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={basinSensorCount} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill:"#64748b", fontSize:10 }}
                     axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Sensors" fill="#0ea5e9" radius={[0,4,4,0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Live Activity Feed</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          <ActivityFeed />
        </motion.div>
      </div>
    </div>
  );
}
