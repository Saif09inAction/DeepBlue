import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { Thermometer, Cloud, TrendingUp, Zap, Download } from "lucide-react";
import { temperatureTrend, co2Trend, seaLevelTrend, stormActivity, waveHeightTrend } from "../data/mockData";

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 border border-ocean-700/40 text-xs">
      <p className="text-slate-400 mb-1 font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
};

function ChartCard({
  title, subtitle, icon: Icon, iconColor, children, delay = 0,
}: {
  title: string; subtitle: string; icon: React.ElementType;
  iconColor: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-ocean-800/30 text-slate-500
                             hover:text-ocean-300 transition-colors" title="Download data">
            <Download className="w-3.5 h-3.5" />
          </button>
          <div className={`p-2 rounded-xl ${iconColor} bg-opacity-10`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// Stat highlights
const highlights = [
  { label: "Global Avg Ocean Temp",  value: "+1.4°C",  sub: "above 1990 baseline", color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20"    },
  { label: "Atmospheric CO₂",        value: "424 ppm", sub: "June 2026 mean",       color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  },
  { label: "Sea Level Rise",         value: "+8.2 cm", sub: "since 2000",           color: "text-ocean-300",  bg: "bg-ocean-500/10",  border: "border-ocean-500/20"  },
  { label: "Arctic Ice Volume",      value: "-34%",    sub: "from 1980 average",    color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
];

// 5-year forecast data
const forecastData = Array.from({ length: 10 }, (_, i) => ({
  year:     `202${i > 5 ? "6" : "2"}-0${(i % 6)+1}`,
  actual:   i < 6 ? 14.2 + i * 0.18 + (Math.random()*0.3 - 0.1) : undefined,
  forecast: i >= 5 ? 15.0 + (i-5) * 0.2 : undefined,
  lower:    i >= 5 ? 14.8 + (i-5) * 0.1 : undefined,
  upper:    i >= 5 ? 15.2 + (i-5) * 0.3 : undefined,
}));

export default function ClimateAnalytics() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white">Climate Analytics</h2>
        <p className="text-slate-500 text-sm mt-1">
          Long-term trend analysis · Ocean–Atmosphere interactions · IPCC-aligned metrics
        </p>
      </motion.div>

      {/* Highlight stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {highlights.map((h, i) => (
          <motion.div
            key={h.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card p-4 border ${h.border} ${h.bg}`}
          >
            <p className="text-xs text-slate-500 font-medium mb-1">{h.label}</p>
            <p className={`text-2xl font-bold ${h.color}`}>{h.value}</p>
            <p className="text-[10px] text-slate-600 mt-1">{h.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ocean Temperature */}
        <ChartCard
          title="Ocean Temperature Anomaly"
          subtitle="Monthly mean surface temperature deviation (°C)"
          icon={Thermometer} iconColor="text-red-400" delay={0.1}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={temperatureTrend}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} unit="°C" />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={15} stroke="#f59e0b" strokeDasharray="4 4" opacity={0.5} label={{ value:"Baseline", fill:"#f59e0b", fontSize:10 }} />
              <Area type="monotone" dataKey="value" name="N.Atlantic" stroke="#ef4444" fill="url(#tempGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="value2" name="N.Pacific"  stroke="#f97316" fill="none" strokeWidth={1.5} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Sea Level Rise */}
        <ChartCard
          title="Sea Level Rise"
          subtitle="Cumulative rise since 2004 (mm)"
          icon={TrendingUp} iconColor="text-ocean-300" delay={0.15}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={seaLevelTrend}>
              <defs>
                <linearGradient id="slGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} unit="mm" />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="value" name="Sea Level" stroke="#0ea5e9" fill="url(#slGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* CO₂ Concentration */}
        <ChartCard
          title="Atmospheric CO₂ Concentration"
          subtitle="Monthly mean measured at sensor array (ppm)"
          icon={Cloud} iconColor="text-amber-400" delay={0.2}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={co2Trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} unit="ppm"
                     domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={420} stroke="#ef4444" strokeDasharray="4 4" opacity={0.6}
                             label={{ value:"Alert 420ppm", fill:"#ef4444", fontSize:10 }} />
              <Line type="monotone" dataKey="value" name="CO₂" stroke="#f59e0b"
                    strokeWidth={2.5} dot={false} activeDot={{ r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Storm Activity */}
        <ChartCard
          title="Storm Activity Index"
          subtitle="Monthly tropical storm and cyclone count"
          icon={Zap} iconColor="text-purple-400" delay={0.25}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stormActivity}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:11, color:"#64748b" }} />
              <Bar dataKey="value"  name="Tropical Storms" fill="#8b5cf6" radius={[3,3,0,0]} opacity={0.85} />
              <Bar dataKey="value2" name="Hurricanes/Cyclones" fill="#ef4444" radius={[3,3,0,0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Full-width forecast */}
      <ChartCard
        title="Climate Forecast Model – Ocean Temperature Projection"
        subtitle="Ensemble model projection 2026–2027 with uncertainty bands"
        icon={TrendingUp} iconColor="text-cyan-400" delay={0.3}
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} unit="°C"
                   domain={[13.5, 16]} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:11, color:"#64748b" }} />
            <ReferenceLine x="2026-01" stroke="#64748b" strokeDasharray="6 3" opacity={0.5}
                           label={{ value:"Now", fill:"#94a3b8", fontSize:10 }} />
            <Line type="monotone" dataKey="actual"   name="Observed"     stroke="#0ea5e9" strokeWidth={2.5} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="forecast" name="Forecast"     stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" connectNulls dot={false} />
            <Line type="monotone" dataKey="upper"    name="Upper bound"  stroke="#f59e0b" strokeWidth={1} strokeDasharray="2 4" opacity={0.5} connectNulls dot={false} />
            <Line type="monotone" dataKey="lower"    name="Lower bound"  stroke="#f59e0b" strokeWidth={1} strokeDasharray="2 4" opacity={0.5} connectNulls dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
