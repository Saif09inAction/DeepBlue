export type SensorStatus = "online" | "warning" | "critical" | "offline";
export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus   = "firing" | "resolved" | "acknowledged";
export type OceanBasin    =
  | "north_atlantic" | "south_atlantic"
  | "north_pacific"  | "south_pacific"
  | "indian" | "arctic" | "southern";

export interface Sensor {
  id:          string;
  name:        string;
  type:        string;
  oceanBasin:  OceanBasin;
  lat:         number;
  lng:         number;
  depth:       number;
  status:      SensorStatus;
  temperature: number;
  salinity:    number;
  pressure:    number;
  waveHeight:  number;
  co2:         number;
  ph:          number;
  lastUpdated: string;
  firmware:    string;
  vessel?:     string;
}

export interface Vessel {
  id:         string;
  name:       string;
  type:       "research_vessel" | "autonomous_vehicle" | "buoy" | "satellite";
  lat:        number;
  lng:        number;
  status:     SensorStatus;
  mission:    string;
  speed?:     number;
  heading?:   number;
  lastUpdate: string;
}

export interface Alert {
  id:          string;
  title:       string;
  description: string;
  severity:    AlertSeverity;
  status:      AlertStatus;
  oceanBasin:  OceanBasin;
  location:    string;
  detectedAt:  string;
  resolvedAt?: string;
  sensorIds:   string[];
  type:        string;
  value?:      number;
  threshold?:  number;
}

export interface Dataset {
  id:          string;
  name:        string;
  category:    "ocean" | "satellite" | "climate" | "research";
  size:        string;
  records:     number;
  date:        string;
  status:      "available" | "processing" | "archived";
  description: string;
  format:      string;
  coverage:    string;
  downloadUrl: string;
}

export interface InfraMetric {
  timestamp: string;
  cpu:       number;
  memory:    number;
  disk:      number;
  requests:  number;
  latency:   number;
  errors:    number;
}

export interface TimeSeriesPoint {
  time:  string;
  value: number;
  value2?: number;
  value3?: number;
}

export interface KafkaMetric {
  topic: string;
  lag: number;
  throughput: number;
}
