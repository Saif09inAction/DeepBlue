import { useState } from "react";
import { motion } from "framer-motion";
import { Database, Download, Search, FileText, Satellite, Waves, BookOpen, CheckCircle, Clock, Archive } from "lucide-react";
import { datasets } from "../data/mockData";
import type { Dataset } from "../types";
import { cn } from "../lib/utils";

const CAT_ICON = { ocean:"Waves", satellite:"Satellite", climate:"FileText", research:"BookOpen" };
const CAT_COLOR = {
  ocean:     { text:"text-ocean-300",  bg:"bg-ocean-500/10",  border:"border-ocean-500/20"  },
  satellite: { text:"text-purple-400", bg:"bg-purple-500/10", border:"border-purple-500/20" },
  climate:   { text:"text-amber-400",  bg:"bg-amber-500/10",  border:"border-amber-500/20"  },
  research:  { text:"text-emerald-400",bg:"bg-emerald-500/10",border:"border-emerald-500/20"},
};
const STATUS_BADGE = {
  available:  "bg-green-500/20 text-green-400 border border-green-500/30",
  processing: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  archived:   "bg-slate-500/20 text-slate-400 border border-slate-500/30",
};
const STATUS_ICON = { available: CheckCircle, processing: Clock, archived: Archive };

const ICONS: Record<string, React.ElementType> = { Waves, Satellite, FileText, BookOpen };

function DatasetCard({ ds, idx }: { ds: Dataset; idx: number }) {
  const cat   = CAT_COLOR[ds.category];
  const Icon  = ICONS[CAT_ICON[ds.category]];
  const SIcon = STATUS_ICON[ds.status];
  return (
    <motion.div
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: idx * 0.05 }}
      className="glass-card-hover p-5"
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-xl shrink-0", cat.bg, cat.border, "border")}>
          <Icon className={cn("w-5 h-5", cat.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-snug">{ds.name}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ds.description}</p>
            </div>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize shrink-0",
              STATUS_BADGE[ds.status])}>
              <SIcon className="w-2.5 h-2.5 inline mr-1" />{ds.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
            <span className="font-medium text-slate-300">{ds.size}</span>
            <span>·</span>
            <span>{ds.records.toLocaleString()} records</span>
            <span>·</span>
            <span>{ds.format}</span>
            <span>·</span>
            <span>{ds.coverage}</span>
            <span>·</span>
            <span>{ds.date}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize",
              cat.border, cat.bg, cat.text)}>
              {ds.category}
            </span>
            <span className="font-mono text-[10px] text-slate-600">{ds.id}</span>
            {ds.status === "available" && (
              <button className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs
                                 font-medium bg-ocean-500/20 text-ocean-300 border border-ocean-500/30
                                 hover:bg-ocean-500/30 transition-colors">
                <Download className="w-3 h-3" />
                Download
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResearchData() {
  const [search,    setSearch]  = useState("");
  const [category,  setCat]     = useState("all");

  const filtered = datasets.filter(d =>
    (category === "all" || d.category === category) &&
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:      datasets.length,
    available:  datasets.filter(d => d.status === "available").length,
    processing: datasets.filter(d => d.status === "processing").length,
    totalSize:  "21.9 TB",
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Research Data Center</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Scientific datasets · Open access archive · CF Convention compliant
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Datasets",   value: stats.total,     icon: Database,      color:"text-ocean-300",  bg:"bg-ocean-500/10",  border:"border-ocean-500/20"  },
          { label:"Available",        value: stats.available, icon: CheckCircle,   color:"text-green-400",  bg:"bg-green-500/10",  border:"border-green-500/20"  },
          { label:"Processing",       value: stats.processing,icon: Clock,         color:"text-yellow-400", bg:"bg-yellow-500/10", border:"border-yellow-500/20" },
          { label:"Total Volume",     value: stats.totalSize, icon: Archive,       color:"text-purple-400", bg:"bg-purple-500/10", border:"border-purple-500/20" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
            className={cn("glass-card p-4 border", s.border, s.bg)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
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
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search datasets…"
            className="w-full bg-deep-700/50 border border-ocean-800/30 rounded-lg
                       pl-9 pr-4 py-1.5 text-sm text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:border-ocean-400/50" />
        </div>
        <div className="flex items-center gap-1.5">
          {["all","ocean","satellite","climate","research"].map(c => (
            <button key={c}
              onClick={() => setCat(c)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize transition-all",
                category === c
                  ? "bg-ocean-500 text-white"
                  : "bg-deep-700/50 text-slate-400 border border-ocean-800/30 hover:text-ocean-300"
              )}>
              {c}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} datasets</span>
      </div>

      {/* Dataset grid */}
      <div className="space-y-3">
        {filtered.map((ds, i) => <DatasetCard key={ds.id} ds={ds} idx={i} />)}
      </div>
    </div>
  );
}
