import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Server, Cpu, HardDrive, Activity, CheckCircle, AlertTriangle, Zap, Database } from "lucide-react";
import { infraMetrics } from "../data/mockData";
import { cn } from "../lib/utils";

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 border border-ocean-700/40 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}{p.unit || ""}
        </p>
      ))}
    </div>
  );
};

function Gauge({ value, max = 100, label, color, unit = "%" }: {
  value: number; max?: number; label: string; color: string; unit?: string;
}) {
  const pct = (value / max) * 100;
  const warningColor = pct > 80 ? "text-red-400" : pct > 60 ? "text-yellow-400" : color;
  const barColor     = pct > 80 ? "bg-red-500" : pct > 60 ? "bg-yellow-500" : color.replace("text-","bg-");
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={cn("font-semibold", warningColor)}>{value}{unit}</span>
      </div>
      <div className="h-2 bg-deep-600 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1 }}
        />
      </div>
    </div>
  );
}

const NAMESPACES = [
  { name:"deepblue-ingestion",  pods:5,  desired:5,  cpu:52, mem:61, status:"healthy" },
  { name:"deepblue-api",        pods:5,  desired:5,  cpu:38, mem:44, status:"healthy" },
  { name:"deepblue-processing", pods:3,  desired:3,  cpu:71, mem:78, status:"healthy" },
  { name:"deepblue-monitoring", pods:8,  desired:8,  cpu:22, mem:35, status:"healthy" },
  { name:"deepblue-security",   pods:4,  desired:4,  cpu:15, mem:28, status:"healthy" },
  { name:"deepblue-cicd",       pods:2,  desired:2,  cpu:8,  mem:20, status:"healthy" },
];

const NODE_GROUPS = [
  { name:"system",     nodes:3, max:6,  type:"m6i.large",   capacity:"ON_DEMAND", cpu:35, status:"healthy" },
  { name:"ingestion",  nodes:5, max:20, type:"c6i.2xlarge",  capacity:"SPOT",      cpu:52, status:"healthy" },
  { name:"processing", nodes:3, max:15, type:"r6i.4xlarge",  capacity:"SPOT",      cpu:71, status:"healthy" },
  { name:"api",        nodes:5, max:30, type:"c6i.xlarge",   capacity:"ON_DEMAND", cpu:38, status:"healthy" },
  { name:"gpu",        nodes:0, max:5,  type:"g4dn.xlarge",  capacity:"SPOT",      cpu:0,  status:"scaled_to_zero" },
];

const DATA_STORES = [
  { name:"RDS TimescaleDB",   status:"available", detail:"Multi-AZ · 156 connections",      color:"text-green-400" },
  { name:"MSK Kafka",         status:"active",    detail:"3 brokers · lag: 142 msgs",        color:"text-green-400" },
  { name:"ElastiCache Redis", status:"available", detail:"3 shards · 380MB used",           color:"text-green-400" },
  { name:"OpenSearch",        status:"green",     detail:"3 nodes · 42 indices",            color:"text-green-400" },
  { name:"S3 Raw Data",       status:"available", detail:"68.4 TB · 12.4M objects",         color:"text-green-400" },
  { name:"ECR Registry",      status:"available", detail:"24 repos · 1,840 images",         color:"text-green-400" },
];

export default function Infrastructure() {
  const [live, setLive] = useState(infraMetrics);

  useEffect(() => {
    const t = setInterval(() => {
      const last = live[live.length - 1];
      const newPoint = {
        timestamp: new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }),
        cpu:     parseFloat((Math.random() * 65 + 20).toFixed(1)),
        memory:  parseFloat((Math.random() * 30 + 50).toFixed(1)),
        disk:    parseFloat((Math.random() * 10 + 65).toFixed(1)),
        requests:Math.floor(Math.random() * 7000 + 1500),
        latency: parseFloat((Math.random() * 150 + 10).toFixed(1)),
        errors:  Math.floor(Math.random() * 8),
      };
      setLive(prev => [...prev.slice(1), newPoint]);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const latest = live[live.length - 1];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Infrastructure Monitoring</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            EKS Cluster · us-east-1 · Kubernetes 1.29 · Live telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
          <span className="text-sm text-green-400">All Systems Healthy</span>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"CPU Utilization",    value:`${latest.cpu}%`,       icon:Cpu,      color:"text-ocean-300",  bg:"bg-ocean-500/10",  border:"border-ocean-500/20"  },
          { label:"Memory Usage",       value:`${latest.memory}%`,    icon:Server,   color:"text-purple-400", bg:"bg-purple-500/10", border:"border-purple-500/20" },
          { label:"API Request Rate",   value:`${(latest.requests/1000).toFixed(1)}k/s`, icon:Activity, color:"text-cyan-400", bg:"bg-cyan-500/10", border:"border-cyan-500/20" },
          { label:"Error Rate",         value:`${latest.errors}/min`,  icon:AlertTriangle, color:"text-yellow-400", bg:"bg-yellow-500/10", border:"border-yellow-500/20" },
        ].map((m, i) => (
          <motion.div key={m.label}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
            className={cn("glass-card p-4 border", m.border, m.bg)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className={cn("text-2xl font-bold mt-1 font-mono", m.color)}>{m.value}</p>
              </div>
              <m.icon className={cn("w-6 h-6", m.color)} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CPU + Memory */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
          className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">CPU & Memory Usage</h3>
          <p className="text-xs text-slate-500 mb-4">Last 24 hours</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={live}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tick={{ fill:"#64748b", fontSize:9 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} unit="%" domain={[0,100]} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="cpu"    name="CPU"    stroke="#0ea5e9" strokeWidth={2} dot={false} unit="%" />
              <Line type="monotone" dataKey="memory" name="Memory" stroke="#a78bfa" strokeWidth={2} dot={false} unit="%" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* API Requests */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.25 }}
          className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">API Request Volume</h3>
          <p className="text-xs text-slate-500 mb-4">Requests per interval</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={live}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timestamp" tick={{ fill:"#64748b", fontSize:9 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="requests" name="Requests" stroke="#06b6d4" fill="url(#reqGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Resource gauges */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
        className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">System Resource Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <p className="text-xs text-slate-500 uppercase font-medium mb-3">Compute</p>
            <Gauge value={latest.cpu}    label="CPU Usage"    color="text-ocean-300" />
            <Gauge value={latest.memory} label="Memory Usage" color="text-purple-400" />
            <Gauge value={latest.disk}   label="Disk Usage"   color="text-amber-400" />
          </div>
          <div className="space-y-3">
            <p className="text-xs text-slate-500 uppercase font-medium mb-3">Kubernetes</p>
            {NAMESPACES.slice(0,4).map(ns => (
              <Gauge key={ns.name} value={ns.cpu}
                label={ns.name.replace("deepblue-","")}
                color="text-cyan-400" />
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-xs text-slate-500 uppercase font-medium mb-3">Network</p>
            <Gauge value={latest.latency}   max={500} label="API Latency P99" color="text-green-400" unit="ms" />
            <Gauge value={latest.errors}    max={50}  label="Error Rate"      color="text-red-400"   unit="/min" />
            <Gauge value={latest.requests}  max={10000} label="Request Rate"  color="text-ocean-300" unit="/s" />
          </div>
        </div>
      </motion.div>

      {/* Namespaces + Nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Namespaces */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
          className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Kubernetes Namespaces</h3>
          <div className="space-y-2.5">
            {NAMESPACES.map(ns => (
              <div key={ns.name}
                className="flex items-center gap-3 p-3 bg-deep-600/30 rounded-lg border border-ocean-800/20">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-white truncate">{ns.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-deep-500 rounded-full overflow-hidden">
                      <div className="h-full bg-ocean-400 rounded-full"
                        style={{ width:`${ns.cpu}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{ns.cpu}% CPU</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-white">{ns.pods}/{ns.desired}</p>
                  <p className="text-[10px] text-slate-500">pods</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Node groups */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
          className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">EKS Node Groups</h3>
          <div className="space-y-2.5">
            {NODE_GROUPS.map(ng => (
              <div key={ng.name}
                className="flex items-center gap-3 p-3 bg-deep-600/30 rounded-lg border border-ocean-800/20">
                <div className={cn("w-2 h-2 rounded-full shrink-0",
                  ng.status === "healthy" ? "bg-green-400" : "bg-slate-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white capitalize">{ng.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{ng.type} · {ng.capacity}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-white">{ng.nodes}/{ng.max}</p>
                  <p className="text-[10px] text-slate-500">nodes</p>
                </div>
                <div className="text-right shrink-0 min-w-[48px]">
                  <p className={cn("text-xs font-semibold",
                    ng.cpu > 70 ? "text-yellow-400" : "text-ocean-300"
                  )}>{ng.cpu}%</p>
                  <p className="text-[10px] text-slate-500">CPU</p>
                </div>
              </div>
            ))}
          </div>

          {/* Data stores */}
          <h3 className="text-sm font-semibold text-white mb-3 mt-5">Data Stores</h3>
          <div className="grid grid-cols-2 gap-2">
            {DATA_STORES.map(ds => (
              <div key={ds.name}
                className="p-2.5 bg-deep-600/30 rounded-lg border border-ocean-800/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-[11px] font-medium text-white truncate">{ds.name}</p>
                </div>
                <p className="text-[9px] text-slate-500">{ds.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
