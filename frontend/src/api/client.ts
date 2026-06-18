/**
 * DeepBlue API Client
 * Connects to the FastAPI backend at http://localhost:8000
 */

const BASE = "http://localhost:8000";
const API_KEY = "deepblue-demo-key-2026";

const headers = { "X-Api-Key": API_KEY, "Content-Type": "application/json" };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

// ── Response shape types (matching FastAPI) ─────────────────────────────────
export interface APISensor {
  sensor_id:    string;
  name:         string;
  type:         string;
  ocean_basin:  string;
  latitude:     number;
  longitude:    number;
  depth_m:      number;
  status:       string;
  last_reading: { value: number; unit: string; timestamp: string };
  last_seen:    string;
  firmware:     string;
  quality_flag: string;
}

export interface APIHealth {
  status:               string;
  version:              string;
  uptime_seconds:       number;
  sensors_online:       number;
  ingestion_buffer_size:number;
  active_alerts:        number;
  timestamp:            string;
}

export interface APIOverview {
  platform:        string;
  version:         string;
  uptime_seconds:  number;
  stats: {
    total_sensors:          number;
    online_sensors:         number;
    ocean_basins_monitored: number;
    ingestion_buffer_events:number;
    total_alerts_fired:     number;
  };
}

export interface APIBasinSummary {
  ocean_basins: Record<string, {
    total_sensors:      number;
    online:             number;
    maintenance:        number;
    sensor_types:       string[];
    avg_surface_temp_c: number | null;
    anomaly_count:      number;
  }>;
  timestamp: string;
}

export interface APIAlert {
  id:           string;
  timestamp:    string;
  severity:     "critical" | "warning";
  status:       string;
  ocean_basin:  string;
  message:      string;
  sensor_count: number;
}

export interface APIAlertList {
  total:  number;
  alerts: APIAlert[];
}

export interface APIClimateSummary {
  global_ocean_temperature_c: { min: number; max: number; avg: number; count: number };
  atmospheric_co2_ppm:         { min: number; max: number; avg: number; count: number };
  ocean_ph:                    { min: number; max: number; avg: number; count: number };
  data_quality: { qc_pass: number; qc_suspect: number; qc_pending: number };
  active_sensors:   number;
  basins_monitored: number;
  timestamp:        string;
}

export interface APIIngestionFeed {
  buffer_size:        number;
  ingestion_rate_eps: number;
  kafka_lag:          Record<string, number>;
  events:             { sensor_id: string; value: number; ts: string; event_id?: string }[];
  timestamp:          string;
}

export interface APIInfraStatus {
  cluster:            string;
  region:             string;
  kubernetes_version: string;
  namespaces:         Record<string, { pods_running: number; hpa_max: number | null; cpu_pct: number }>;
  node_groups:        Record<string, { nodes: number; status: string }>;
  data_stores:        Record<string, { status: string; connections?: number; broker_count?: number; used_memory_mb?: number; index_count?: number }>;
  platform_uptime_seconds: number;
  sla_availability_pct:    number;
  timestamp:          string;
}

// ── API calls ────────────────────────────────────────────────────────────────
export const api = {
  health:      ()             => get<APIHealth>("/health"),
  overview:    ()             => get<APIOverview>("/"),
  sensors:     (limit = 100)  => get<{ total: number; sensors: APISensor[] }>(`/v1/sensors?limit=${limit}`),
  sensor:      (id: string)   => get<APISensor>(`/v1/sensors/${id}`),
  oceanBasins: ()             => get<APIBasinSummary>("/v1/ocean-basins"),
  alerts:      (limit = 50)   => get<APIAlertList>(`/v1/alerts?limit=${limit}`),
  alertStats:  ()             => get<{ total_alerts: number; critical: number; warning: number; by_basin: Record<string,number> }>("/v1/alerts/stats"),
  climate:     ()             => get<APIClimateSummary>("/v1/climate/summary"),
  ingestion:   (limit = 30)   => get<APIIngestionFeed>(`/v1/ingestion/feed?limit=${limit}`),
  infra:       ()             => get<APIInfraStatus>("/v1/infrastructure/status"),
};
