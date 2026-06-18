import type { Sensor, Vessel, Alert, Dataset, InfraMetric, TimeSeriesPoint, OceanBasin } from "../types";

const rnd = (min: number, max: number, dec = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(dec));

const now = new Date();
const ago = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();

// ── 100 Sensors ─────────────────────────────────────────────────────────────
const BASINS: { basin: OceanBasin; latRange: [number,number]; lngRange: [number,number] }[] = [
  { basin: "north_atlantic",  latRange: [10,  65],  lngRange: [-80, 0]   },
  { basin: "south_atlantic",  latRange: [-60, 10],  lngRange: [-60, 20]  },
  { basin: "north_pacific",   latRange: [10,  65],  lngRange: [120, 180] },
  { basin: "south_pacific",   latRange: [-60, 10],  lngRange: [-180,-70] },
  { basin: "indian",          latRange: [-60, 30],  lngRange: [20,  120] },
  { basin: "arctic",          latRange: [65,  85],  lngRange: [-180,180] },
  { basin: "southern",        latRange: [-80, -60], lngRange: [-180,180] },
];
const SENSOR_TYPES = ["temperature","salinity","pressure","current","co2","ph","turbidity","acoustic"];
const VESSEL_NAMES = [
  "RV Endeavour","RV Polaris","RV Neptune","RV Discovery","RV Atlantis",
  "RV Challenger","RV Darwin","RV Oceanus","RV Knorr","RV Kilo Moana",
  "AUV Sentry","AUV Nereid","AUV Remus","Argo Float 21","Argo Float 47",
];
const STATUSES: Sensor["status"][] = ["online","online","online","warning","critical","offline"];

export const sensors: Sensor[] = Array.from({ length: 100 }, (_, i) => {
  const b = BASINS[i % BASINS.length];
  return {
    id:          `SNS-${b.basin.substring(0,3).toUpperCase()}-${String(i+1).padStart(4,"0")}`,
    name:        `${VESSEL_NAMES[i % VESSEL_NAMES.length]} Sensor #${i+1}`,
    type:        SENSOR_TYPES[i % SENSOR_TYPES.length],
    oceanBasin:  b.basin,
    lat:         rnd(b.latRange[0], b.latRange[1], 4),
    lng:         rnd(b.lngRange[0], b.lngRange[1], 4),
    depth:       rnd(0, 5000, 1),
    status:      STATUSES[i % STATUSES.length],
    temperature: rnd(-2, 32, 2),
    salinity:    rnd(30, 40, 3),
    pressure:    rnd(0, 600, 1),
    waveHeight:  rnd(0.1, 12, 2),
    co2:         rnd(380, 450, 1),
    ph:          rnd(7.8, 8.3, 3),
    lastUpdated: ago(rnd(0, 120, 0)),
    firmware:    `v${Math.floor(rnd(1,3,0))}.${Math.floor(rnd(0,9,0))}.${Math.floor(rnd(0,9,0))}`,
    vessel:      VESSEL_NAMES[i % VESSEL_NAMES.length],
  };
});

// ── 20 Vessels ───────────────────────────────────────────────────────────────
export const vessels: Vessel[] = Array.from({ length: 20 }, (_, i) => {
  const b = BASINS[i % BASINS.length];
  const types: Vessel["type"][] = ["research_vessel","autonomous_vehicle","buoy","satellite"];
  return {
    id:         `VES-${String(i+1).padStart(3,"0")}`,
    name:       VESSEL_NAMES[i % VESSEL_NAMES.length],
    type:       types[i % types.length],
    lat:        rnd(b.latRange[0], b.latRange[1], 4),
    lng:        rnd(b.lngRange[0], b.lngRange[1], 4),
    status:     i < 15 ? "online" : i < 18 ? "warning" : "offline",
    mission:    ["Deep Sea Survey","Climate Monitoring","Tsunami Watch","Coral Reef Study","Arctic Expedition"][i % 5],
    speed:      rnd(0, 18, 1),
    heading:    rnd(0, 360, 0),
    lastUpdate: ago(rnd(0, 60, 0)),
  };
});

// ── 50 Alerts ─────────────────────────────────────────────────────────────────
const ALERT_TYPES = ["Tsunami Risk","Temperature Anomaly","CO₂ Spike","Salinity Change",
  "Storm System","pH Deviation","Pressure Drop","Rogue Wave","Oil Spill Detection","Seismic Activity"];
const ALERT_SEVERITIES: Alert["severity"][] = ["critical","critical","warning","warning","info"];
const ALERT_STATUSES: Alert["status"][] = ["firing","firing","acknowledged","resolved","resolved"];

export const alerts: Alert[] = Array.from({ length: 50 }, (_, i) => {
  const b = BASINS[i % BASINS.length];
  const sev = ALERT_SEVERITIES[i % ALERT_SEVERITIES.length];
  const stat = ALERT_STATUSES[i % ALERT_STATUSES.length];
  return {
    id:          `ALT-${String(i+1).padStart(4,"0")}`,
    title:       ALERT_TYPES[i % ALERT_TYPES.length],
    description: `Anomalous reading detected in ${b.basin.replace("_"," ")} region. Multiple sensors reporting deviation from baseline thresholds.`,
    severity:    sev,
    status:      stat,
    oceanBasin:  b.basin,
    location:    `${b.basin.replace("_"," ").split(" ").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ")}`,
    detectedAt:  ago(rnd(0, 1440, 0)),
    resolvedAt:  stat === "resolved" ? ago(rnd(0, 60, 0)) : undefined,
    sensorIds:   [sensors[i % 100].id, sensors[(i+1) % 100].id],
    type:        ALERT_TYPES[i % ALERT_TYPES.length],
    value:       rnd(0, 100, 2),
    threshold:   rnd(0, 80, 2),
  };
});

// ── Datasets ─────────────────────────────────────────────────────────────────
export const datasets: Dataset[] = [
  { id:"DS-001", name:"Global Ocean Temperature 2026",    category:"ocean",     size:"4.2 TB",  records:1200000, date:"2026-06-15", status:"available",  description:"Comprehensive sea surface and subsurface temperature records from 2,400+ buoys.", format:"NetCDF-4", coverage:"Global", downloadUrl:"#" },
  { id:"DS-002", name:"Satellite SST Daily Composite",     category:"satellite", size:"890 GB",  records:365000,  date:"2026-06-16", status:"available",  description:"Daily sea surface temperature composite from MODIS and VIIRS instruments.", format:"HDF-EOS",  coverage:"Global", downloadUrl:"#" },
  { id:"DS-003", name:"Ocean Acidification Survey Q2",     category:"climate",   size:"220 MB",  records:48000,   date:"2026-06-10", status:"available",  description:"pH and CO₂ measurements across all major ocean basins for Q2 2026.", format:"CSV",      coverage:"Multi-basin", downloadUrl:"#" },
  { id:"DS-004", name:"Deep Sea Pressure Profiles 2025",   category:"ocean",     size:"1.8 TB",  records:820000,  date:"2026-01-30", status:"archived",   description:"Pressure and density profiles from Argo floats at 2000m depth.", format:"NetCDF-4", coverage:"Global", downloadUrl:"#" },
  { id:"DS-005", name:"Arctic Ice Thickness Report",        category:"climate",   size:"340 MB",  records:96000,   date:"2026-05-20", status:"available",  description:"Ice thickness and extent measurements from IceSat-2 satellite.", format:"GeoTIFF",  coverage:"Arctic", downloadUrl:"#" },
  { id:"DS-006", name:"Current Velocity Vectors June",      category:"ocean",     size:"2.1 GB",  records:240000,  date:"2026-06-17", status:"available",  description:"Ocean current velocity vectors from OSCAR and GLORYS model output.", format:"NetCDF-4", coverage:"Global", downloadUrl:"#" },
  { id:"DS-007", name:"Climate Model Ensemble Run #47",      category:"research",  size:"12.4 TB", records:5400000, date:"2026-06-01", status:"processing", description:"Ensemble climate model simulation for 2026–2100 projection scenarios.", format:"GRIB2",    coverage:"Global", downloadUrl:"#" },
  { id:"DS-008", name:"Tropical Storm Track Database",       category:"climate",   size:"156 MB",  records:18000,   date:"2026-06-12", status:"available",  description:"Historical and current tropical cyclone tracks and intensity data.", format:"CSV",      coverage:"Tropical", downloadUrl:"#" },
  { id:"DS-009", name:"Coral Reef Health Index 2026",        category:"research",  size:"780 MB",  records:120000,  date:"2026-04-15", status:"available",  description:"Bleaching probability, water clarity, and biotic condition indices.", format:"HDF5",     coverage:"Indo-Pacific", downloadUrl:"#" },
  { id:"DS-010", name:"Tsunami Early Warning Signals",       category:"research",  size:"94 GB",   records:360000,  date:"2026-06-18", status:"processing", description:"Real-time seismograph and ocean pressure sensor array data.", format:"Binary",   coverage:"Pacific Ring", downloadUrl:"#" },
];

// ── Infrastructure metrics (last 24 hours, hourly) ────────────────────────────
export const infraMetrics: InfraMetric[] = Array.from({ length: 24 }, (_, i) => ({
  timestamp: new Date(now.getTime() - (23-i) * 3600000).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }),
  cpu:       rnd(20, 85, 1),
  memory:    rnd(45, 78, 1),
  disk:      rnd(62, 75, 1),
  requests:  Math.floor(rnd(1200, 8400, 0)),
  latency:   rnd(8, 180, 1),
  errors:    Math.floor(rnd(0, 12, 0)),
}));

// ── Time-series data ──────────────────────────────────────────────────────────
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const temperatureTrend: TimeSeriesPoint[] = months.map((m, i) => ({
  time:   m,
  value:  rnd(14 + i * 0.3, 16 + i * 0.3, 2),
  value2: rnd(16 + i * 0.2, 18 + i * 0.2, 2),
  value3: rnd(12 + i * 0.4, 14 + i * 0.4, 2),
}));

export const waveHeightTrend: TimeSeriesPoint[] = months.map(m => ({
  time:  m,
  value: rnd(1.2, 5.8, 2),
}));

export const ingestionVolume: TimeSeriesPoint[] = Array.from({ length: 24 }, (_, i) => ({
  time:  `${String(i).padStart(2,"0")}:00`,
  value: rnd(800, 3200, 0),
}));

export const co2Trend: TimeSeriesPoint[] = months.map((m, i) => ({
  time:  m,
  value: rnd(395 + i * 0.8, 420 + i * 0.8, 1),
}));

export const seaLevelTrend: TimeSeriesPoint[] = Array.from({ length: 20 }, (_, i) => ({
  time:  `200${String(4+i).padStart(1,"0")}`,
  value: rnd(0 + i * 3.2, 4 + i * 3.2, 1),
}));

export const stormActivity: TimeSeriesPoint[] = months.map(m => ({
  time:   m,
  value:  Math.floor(rnd(0, 12, 0)),
  value2: Math.floor(rnd(0, 6, 0)),
}));

export const alertDistribution = [
  { name: "Critical",    value: alerts.filter(a => a.severity==="critical").length,  fill: "#ef4444" },
  { name: "Warning",     value: alerts.filter(a => a.severity==="warning").length,   fill: "#f59e0b" },
  { name: "Info",        value: alerts.filter(a => a.severity==="info").length,      fill: "#0ea5e9" },
];

export const basinSensorCount = BASINS.map(b => ({
  name:  b.basin.replace("_"," ").replace(/\b\w/g, c => c.toUpperCase()),
  value: sensors.filter(s => s.oceanBasin === b.basin).length,
}));

// ── Live activity feed ────────────────────────────────────────────────────────
export type ActivityItem = { id: string; time: string; msg: string; type: "info"|"warn"|"error"|"success" };

export const generateActivity = (): ActivityItem => {
  const items = [
    { msg: `Sensor ${sensors[Math.floor(Math.random()*100)].id} reported new reading`,   type: "info"    as const },
    { msg: `Alert ${alerts[Math.floor(Math.random()*50)].id} status updated`,            type: "warn"    as const },
    { msg: `ETL pipeline processed 48,000 records in 142ms`,                             type: "success" as const },
    { msg: `Kafka consumer lag: raw-sensor-data topic at 124 messages`,                  type: "warn"    as const },
    { msg: `ArgoCD synced deepblue-api-prod successfully`,                               type: "success" as const },
    { msg: `RDS read replica lag: 0.8 seconds`,                                          type: "info"    as const },
    { msg: `New vessel ${VESSEL_NAMES[Math.floor(Math.random()*15)]} went online`,       type: "success" as const },
    { msg: `Temperature anomaly detected in North Pacific basin`,                        type: "error"   as const },
    { msg: `GitHub Actions CI pipeline passed for ingestion-service:v2.4.2`,            type: "success" as const },
    { msg: `Trivy scan: 0 critical vulnerabilities in api-service:sha-a3f7b2c`,         type: "success" as const },
  ];
  const item = items[Math.floor(Math.random() * items.length)];
  return { id: Math.random().toString(36).slice(2), time: new Date().toLocaleTimeString(), ...item };
};
