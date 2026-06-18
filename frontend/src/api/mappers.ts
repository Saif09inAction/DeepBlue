import type { APISensor, APIAlert } from "./client";
import type { Sensor, Alert, OceanBasin, SensorStatus } from "../types";

function apiStatus(s: string): SensorStatus {
  if (s === "online")      return "online";
  if (s === "maintenance") return "warning";
  if (s === "offline")     return "offline";
  return "warning";
}

export function mapSensor(s: APISensor): Sensor {
  const val = s.last_reading?.value ?? 0;
  return {
    id:          s.sensor_id,
    name:        s.name,
    type:        s.type,
    oceanBasin:  s.ocean_basin as OceanBasin,
    lat:         s.latitude,
    lng:         s.longitude,
    depth:       s.depth_m,
    status:      apiStatus(s.status),
    temperature: s.type === "temperature" ? val : parseFloat((10 + Math.random() * 20).toFixed(2)),
    salinity:    s.type === "salinity"    ? val : parseFloat((34 + Math.random() * 2).toFixed(2)),
    pressure:    s.type === "pressure"    ? val : parseFloat((1010 + Math.random() * 10).toFixed(1)),
    waveHeight:  s.type === "wave_height" ? val : parseFloat((0.5 + Math.random() * 4).toFixed(2)),
    co2:         s.type === "co2"         ? val : parseFloat((395 + Math.random() * 20).toFixed(1)),
    ph:          s.type === "ph"          ? val : parseFloat((7.9 + Math.random() * 0.4).toFixed(2)),
    lastUpdated: s.last_seen,
    firmware:    s.firmware,
  };
}

export function mapAlert(a: APIAlert): Alert {
  return {
    id:          a.id,
    title:       a.message,
    description: `${a.sensor_count} sensor(s) affected in ${a.ocean_basin.replace(/_/g, " ")}.`,
    severity:    a.severity,
    status:      a.status === "firing" ? "firing" : a.status === "resolved" ? "resolved" : "acknowledged",
    oceanBasin:  a.ocean_basin as OceanBasin,
    location:    a.ocean_basin.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    detectedAt:  a.timestamp,
    sensorIds:   [],
    type:        a.message.split(" ")[0],
  };
}
