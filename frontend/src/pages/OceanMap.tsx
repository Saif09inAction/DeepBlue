import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Thermometer, Droplets, Gauge, Waves, Wind, FlaskConical, Filter, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { sensors, vessels } from "../data/mockData";
import type { Sensor, OceanBasin } from "../types";
import { cn, basinLabel, formatRelative } from "../lib/utils";

const STATUS_COLOR: Record<string, string> = {
  online:   "#10b981",
  warning:  "#f59e0b",
  critical: "#ef4444",
  offline:  "#6b7280",
};

const BASINS: { id: OceanBasin | "all"; label: string }[] = [
  { id: "all",            label: "All Oceans"     },
  { id: "north_atlantic", label: "N. Atlantic"    },
  { id: "south_atlantic", label: "S. Atlantic"    },
  { id: "north_pacific",  label: "N. Pacific"     },
  { id: "south_pacific",  label: "S. Pacific"     },
  { id: "indian",         label: "Indian"         },
  { id: "arctic",         label: "Arctic"         },
  { id: "southern",       label: "Southern"       },
];

function SensorPopup({ s }: { s: Sensor }) {
  const statusBadge =
    s.status === "online"   ? "bg-green-500/20 text-green-400 border-green-500/30"  :
    s.status === "warning"  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30":
    s.status === "critical" ? "bg-red-500/20 text-red-400 border-red-500/30"        :
                              "bg-slate-500/20 text-slate-400 border-slate-500/30";

  return (
    <div className="min-w-[220px]">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-sm text-white leading-tight">{s.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{s.id}</p>
        </div>
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", statusBadge)}>
          {s.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        {[
          { icon: Thermometer, label: "Temperature", value: `${s.temperature}°C`    },
          { icon: Droplets,    label: "Salinity",    value: `${s.salinity} PSU`      },
          { icon: Gauge,       label: "Pressure",    value: `${s.pressure} bar`      },
          { icon: Waves,       label: "Wave Height", value: `${s.waveHeight} m`      },
          { icon: Wind,        label: "Current",     value: `${(Math.random()*3+0.2).toFixed(1)} m/s` },
          { icon: FlaskConical,label: "pH",          value: `${s.ph}`                },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1">
            <Icon className="w-3 h-3 text-ocean-400 shrink-0" />
            <div>
              <p className="text-[9px] text-slate-500">{label}</p>
              <p className="text-[11px] font-medium text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-slate-500">
        Depth: {s.depth}m · Basin: {basinLabel(s.oceanBasin)}
        <br />Updated: {formatRelative(s.lastUpdated)} · FW: {s.firmware}
      </div>
    </div>
  );
}

export default function OceanMap() {
  const [selectedBasin, setSelectedBasin] = useState<OceanBasin | "all">("all");
  const [selectedType,  setSelectedType]  = useState<string>("all");
  const [showVessels,   setShowVessels]   = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [stats, setStats] = useState({ online: 0, warning: 0, critical: 0 });

  const types = ["all", ...Array.from(new Set(sensors.map(s => s.type)))];

  const filtered = sensors.filter(s =>
    (selectedBasin === "all" || s.oceanBasin === selectedBasin) &&
    (selectedType  === "all" || s.type       === selectedType)
  );

  useEffect(() => {
    setStats({
      online:   filtered.filter(s => s.status === "online").length,
      warning:  filtered.filter(s => s.status === "warning").length,
      critical: filtered.filter(s => s.status === "critical").length,
    });
  }, [filtered]);

  return (
    <div className="relative h-[calc(100vh-56px)] flex flex-col">
      {/* Filter Bar */}
      <div className="bg-deep-800/90 backdrop-blur-xl border-b border-ocean-800/30
                      px-4 py-2 flex items-center gap-3 flex-wrap shrink-0 z-10">
        <Filter className="w-4 h-4 text-ocean-400 shrink-0" />
        <div className="flex items-center gap-1.5 flex-wrap">
          {BASINS.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBasin(b.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                selectedBasin === b.id
                  ? "bg-ocean-500 text-white"
                  : "bg-deep-700/50 text-slate-400 hover:text-ocean-300 border border-ocean-800/30"
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-ocean-800/50 hidden md:block" />
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="bg-deep-700/50 border border-ocean-800/30 text-xs text-slate-300
                     rounded-lg px-2 py-1 focus:outline-none focus:border-ocean-400/50"
        >
          {types.map(t => (
            <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={showVessels} onChange={e => setShowVessels(e.target.checked)}
                 className="accent-ocean-400" />
          <span className="text-xs text-slate-400">Vessels</span>
        </label>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-3 text-xs">
          {[
            { label: "Online",   count: stats.online,   color: "text-green-400"  },
            { label: "Warning",  count: stats.warning,  color: "text-yellow-400" },
            { label: "Critical", count: stats.critical, color: "text-red-400"    },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <span className={cn("font-bold text-sm", s.color)}>{s.count}</span>
              <span className="text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={10}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {/* Sensor markers */}
          {filtered.map(sensor => (
            <CircleMarker
              key={sensor.id}
              center={[sensor.lat, sensor.lng]}
              radius={sensor.status === "critical" ? 8 : 6}
              pathOptions={{
                color:       STATUS_COLOR[sensor.status],
                fillColor:   STATUS_COLOR[sensor.status],
                fillOpacity: 0.8,
                weight:      sensor.status === "critical" ? 2 : 1,
              }}
              eventHandlers={{ click: () => setSelectedSensor(sensor) }}
            >
              <Popup>
                <SensorPopup s={sensor} />
              </Popup>
            </CircleMarker>
          ))}

          {/* Vessel markers */}
          {showVessels && vessels.map(vessel => (
            <CircleMarker
              key={vessel.id}
              center={[vessel.lat, vessel.lng]}
              radius={7}
              pathOptions={{
                color:       "#a78bfa",
                fillColor:   "#a78bfa",
                fillOpacity: 0.7,
                weight:      1.5,
                dashArray:   "4 2",
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-white">{vessel.name}</p>
                  <p className="text-slate-400 text-xs capitalize">{vessel.type.replace("_"," ")}</p>
                  <p className="text-xs mt-1">Mission: <span className="text-ocean-300">{vessel.mission}</span></p>
                  <p className="text-xs">Speed: {vessel.speed} kn · Heading: {vessel.heading}°</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 left-4 glass-card p-3 z-[1000] text-xs space-y-1.5">
          <p className="font-semibold text-white text-[11px] mb-2">Legend</p>
          {[
            { color: "#10b981", label: "Online / Normal"  },
            { color: "#f59e0b", label: "Warning"           },
            { color: "#ef4444", label: "Critical"          },
            { color: "#6b7280", label: "Offline"           },
            { color: "#a78bfa", label: "Vessel", dashed: true },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: l.color, border: l.dashed ? "1.5px dashed "+l.color : "none" }} />
              <span className="text-slate-400">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Summary panel */}
        <div className="absolute top-4 right-4 glass-card p-3 z-[1000] text-xs w-44">
          <p className="font-semibold text-white mb-2">Showing {filtered.length} sensors</p>
          <p className="text-slate-500">{basinLabel(selectedBasin)} · {selectedType}</p>
          <div className="mt-2 space-y-1">
            {[
              { label: "Online",   pct: stats.online   / filtered.length * 100, color: "bg-green-400"  },
              { label: "Warning",  pct: stats.warning  / filtered.length * 100, color: "bg-yellow-400" },
              { label: "Critical", pct: stats.critical / filtered.length * 100, color: "bg-red-400"    },
            ].map(b => (
              <div key={b.label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-slate-500">{b.label}</span>
                  <span className="text-white font-medium">{Math.round(b.pct)}%</span>
                </div>
                <div className="h-1 bg-deep-600 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", b.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${b.pct}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
