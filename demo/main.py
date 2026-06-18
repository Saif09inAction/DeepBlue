"""
DeepBlue – Oceanographic Research & Climate Intelligence Platform
Live Demo API Server  |  v2.4.1

Demonstrates the real platform API architecture:
  - RESTful endpoints for sensors, ocean basins, alerts, and climate data
  - Prometheus metrics at /metrics
  - Health/readiness probes for Kubernetes
  - Simulated real-time sensor ingestion (50 global sensors, 7 ocean basins)
  - API key RBAC authentication
"""

# ── Standard library ──────────────────────────────────────────────────────────
import asyncio
import random
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

# ── Third-party ───────────────────────────────────────────────────────────────
import uvicorn
from fastapi import FastAPI, Depends, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from prometheus_client import (
    Counter, Gauge, Histogram,
    CONTENT_TYPE_LATEST, generate_latest, CollectorRegistry
)
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────────────────────────────────────
# Prometheus – use a dedicated registry so re-imports never cause duplicates
# ─────────────────────────────────────────────────────────────────────────────
REGISTRY = CollectorRegistry()

REQUEST_COUNT = Counter(
    "deepblue_api_requests_total",
    "Total API requests",
    ["method", "endpoint", "status_code"],
    registry=REGISTRY,
)
REQUEST_LATENCY = Histogram(
    "deepblue_api_request_duration_seconds",
    "API request latency",
    ["endpoint"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
    registry=REGISTRY,
)
ACTIVE_SENSORS = Gauge(
    "deepblue_active_sensors_total",
    "Number of currently active sensors",
    ["ocean_basin", "sensor_type"],
    registry=REGISTRY,
)
INGESTION_RATE = Gauge(
    "deepblue_ingestion_events_per_second",
    "Current sensor event ingestion rate",
    registry=REGISTRY,
)
KAFKA_LAG = Gauge(
    "deepblue_kafka_consumer_lag",
    "Simulated Kafka consumer lag",
    ["topic"],
    registry=REGISTRY,
)
ALERTS_FIRED = Counter(
    "deepblue_alerts_fired_total",
    "Total alerts fired",
    ["severity", "ocean_basin"],
    registry=REGISTRY,
)

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────
OCEAN_BASINS = [
    "north_atlantic", "south_atlantic", "north_pacific",
    "south_pacific", "indian", "arctic", "southern",
]
SENSOR_TYPES = ["temperature", "salinity", "pressure", "current", "co2", "ph", "turbidity"]
VESSEL_NAMES = [
    "RV Endeavour", "RV Polaris", "RV Neptune", "RV Discovery",
    "RV Atlantis", "AUV-Reef-01", "AUV-Deep-03", "Buoy-Pacific-42",
]
VALID_API_KEYS = {
    "deepblue-demo-key-2026": "demo-user",
    "deepblue-research-key":  "research-lead",
    "deepblue-admin-key":     "platform-admin",
}
START_TIME = time.time()

# ─────────────────────────────────────────────────────────────────────────────
# In-memory state
# ─────────────────────────────────────────────────────────────────────────────
SENSOR_REGISTRY: dict = {}
ALERT_LOG: list = []
INGESTION_BUFFER: list = []

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _generate_reading(sensor_type: str) -> dict:
    ranges = {
        "temperature": (-2.0, 32.0,  "°C"),
        "salinity":    (30.0, 40.0,  "PSU"),
        "pressure":    (0.0,  600.0, "bar"),
        "current":     (0.0,  3.5,   "m/s"),
        "co2":         (380.0, 450.0,"ppm"),
        "ph":          (7.8,  8.3,   "pH"),
        "turbidity":   (0.0,  100.0, "NTU"),
    }
    lo, hi, unit = ranges.get(sensor_type, (0.0, 100.0, "unknown"))
    return {
        "value": round(random.uniform(lo, hi), 3),
        "unit":  unit,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def seed_sensors():
    for i in range(1, 51):
        basin  = random.choice(OCEAN_BASINS)
        stype  = random.choice(SENSOR_TYPES)
        sid    = f"SNS-{basin[:3].upper()}-{i:04d}"
        status = random.choice(["online", "online", "online", "maintenance"])
        SENSOR_REGISTRY[sid] = {
            "sensor_id":    sid,
            "name":         random.choice(VESSEL_NAMES) + f" #{i}",
            "type":         stype,
            "ocean_basin":  basin,
            "latitude":     round(random.uniform(-90, 90), 4),
            "longitude":    round(random.uniform(-180, 180), 4),
            "depth_m":      round(random.uniform(0, 5000), 1),
            "status":       status,
            "last_reading": _generate_reading(stype),
            "last_seen":    datetime.now(timezone.utc).isoformat(),
            "firmware":     f"v{random.randint(1,3)}.{random.randint(0,9)}.{random.randint(0,9)}",
            "quality_flag": random.choice(["QC_PASS", "QC_PASS", "QC_PASS", "QC_SUSPECT"]),
        }
        if status == "online":
            ACTIVE_SENSORS.labels(ocean_basin=basin, sensor_type=stype).inc()


seed_sensors()

# ─────────────────────────────────────────────────────────────────────────────
# Background simulation task
# ─────────────────────────────────────────────────────────────────────────────
async def simulate_ingestion():
    tick = 0
    while True:
        await asyncio.sleep(2)
        tick += 1
        updated = 0
        for sid, sensor in SENSOR_REGISTRY.items():
            if sensor["status"] == "online" and random.random() < 0.6:
                sensor["last_reading"] = _generate_reading(sensor["type"])
                sensor["last_seen"]    = datetime.now(timezone.utc).isoformat()
                updated += 1
                INGESTION_BUFFER.append({
                    "sensor_id": sid,
                    "value":     sensor["last_reading"]["value"],
                    "ts":        sensor["last_seen"],
                })
                if len(INGESTION_BUFFER) > 500:
                    INGESTION_BUFFER.pop(0)

        INGESTION_RATE.set(updated / 2)
        KAFKA_LAG.labels(topic="raw-sensor-data").set(max(0, random.gauss(120, 40)))
        KAFKA_LAG.labels(topic="qc-sensor-data").set(max(0, random.gauss(30, 10)))

        if tick % 30 == 0:
            basin    = random.choice(OCEAN_BASINS)
            severity = random.choice(["warning", "critical"])
            ALERT_LOG.insert(0, {
                "id":           str(uuid.uuid4())[:8],
                "timestamp":    datetime.now(timezone.utc).isoformat(),
                "severity":     severity,
                "ocean_basin":  basin,
                "message":      random.choice([
                    f"Anomalous temperature spike detected in {basin}",
                    f"CO₂ concentration exceeds baseline in {basin}",
                    f"Salinity anomaly – possible freshwater intrusion in {basin}",
                    f"Unusual current velocity in {basin} thermocline layer",
                    f"pH drop below 8.0 threshold in {basin} surface waters",
                ]),
                "sensor_count": random.randint(2, 8),
                "status":       "firing",
            })
            if len(ALERT_LOG) > 50:
                ALERT_LOG.pop()
            ALERTS_FIRED.labels(severity=severity, ocean_basin=basin).inc()


# ─────────────────────────────────────────────────────────────────────────────
# Lifespan (replaces deprecated on_event)
# ─────────────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(application: FastAPI):
    asyncio.create_task(simulate_ingestion())
    yield


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI Application
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    lifespan=lifespan,
    title="DeepBlue API",
    description=(
        "Oceanographic Research & Climate Intelligence Platform – "
        "Live Demo API streaming real-time sensor data from global ocean networks."
    ),
    version="2.4.1",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={"name": "DeepBlue Platform Team", "email": "platform@deepblue.org"},
    license_info={"name": "Apache 2.0"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Auth dependency ───────────────────────────────────────────────────────────
async def get_api_key(x_api_key: Optional[str] = Header(default=None)) -> str:
    if x_api_key and x_api_key in VALID_API_KEYS:
        return VALID_API_KEYS[x_api_key]
    return "anonymous"


# ── Metrics middleware ────────────────────────────────────────────────────────
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start    = time.time()
    response = await call_next(request)
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
    ).inc()
    REQUEST_LATENCY.labels(endpoint=request.url.path).observe(time.time() - start)
    return response


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────────────────────────
class IngestRequest(BaseModel):
    sensor_id:   str   = Field(..., description="Unique sensor identifier")
    sensor_type: str   = Field(..., description="Type of measurement")
    value:       float = Field(..., description="Measured value")
    unit:        str   = Field(..., description="Unit of measurement")
    latitude:    float = Field(..., ge=-90, le=90)
    longitude:   float = Field(..., ge=-180, le=180)
    ocean_basin: str
    metadata:    Optional[dict] = None


# ─────────────────────────────────────────────────────────────────────────────
# Health Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health/live", tags=["Health"])
async def liveness():
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/health/ready", tags=["Health"])
async def readiness():
    return {
        "status": "ready",
        "checks": {"sensor_registry": "ok", "ingestion_buffer": "ok", "alert_engine": "ok"},
        "sensors_online": sum(1 for s in SENSOR_REGISTRY.values() if s["status"] == "online"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status":               "healthy",
        "version":              "2.4.1",
        "uptime_seconds":       round(time.time() - START_TIME, 2),
        "sensors_online":       sum(1 for s in SENSOR_REGISTRY.values() if s["status"] == "online"),
        "ingestion_buffer_size": len(INGESTION_BUFFER),
        "active_alerts":        len([a for a in ALERT_LOG if a["status"] == "firing"]),
        "timestamp":            datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Prometheus Metrics
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/metrics", tags=["Observability"])
async def metrics():
    return PlainTextResponse(
        content=generate_latest(REGISTRY).decode("utf-8"),
        media_type=CONTENT_TYPE_LATEST,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Platform Overview
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Platform"])
async def root():
    return {
        "platform": "DeepBlue Oceanographic Research & Climate Intelligence Platform",
        "version":  "2.4.1",
        "environment": "demo",
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "stats": {
            "total_sensors":         len(SENSOR_REGISTRY),
            "online_sensors":        sum(1 for s in SENSOR_REGISTRY.values() if s["status"] == "online"),
            "ocean_basins_monitored": len(OCEAN_BASINS),
            "ingestion_buffer_events": len(INGESTION_BUFFER),
            "total_alerts_fired":    len(ALERT_LOG),
        },
        "endpoints": {
            "docs":            "http://localhost:8000/docs",
            "metrics":         "http://localhost:8000/metrics",
            "sensors":         "http://localhost:8000/v1/sensors",
            "ocean_basins":    "http://localhost:8000/v1/ocean-basins",
            "alerts":          "http://localhost:8000/v1/alerts",
            "ingestion_feed":  "http://localhost:8000/v1/ingestion/feed",
            "climate_summary": "http://localhost:8000/v1/climate/summary",
            "infra_status":    "http://localhost:8000/v1/infrastructure/status",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Sensor Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/v1/sensors", tags=["Sensors"])
async def list_sensors(
    ocean_basin: Optional[str] = Query(None),
    sensor_type: Optional[str] = Query(None),
    status:      Optional[str] = Query(None),
    limit:  int = Query(20, ge=1, le=100),
    offset: int = Query(0,  ge=0),
    user: str = Depends(get_api_key),
):
    sensors = list(SENSOR_REGISTRY.values())
    if ocean_basin: sensors = [s for s in sensors if s["ocean_basin"] == ocean_basin]
    if sensor_type: sensors = [s for s in sensors if s["type"]         == sensor_type]
    if status:      sensors = [s for s in sensors if s["status"]        == status]
    return {
        "total": len(sensors),
        "limit": limit, "offset": offset,
        "sensors": sensors[offset: offset + limit],
        "requested_by": user,
    }


@app.get("/v1/sensors/{sensor_id}", tags=["Sensors"])
async def get_sensor(sensor_id: str, user: str = Depends(get_api_key)):
    if sensor_id not in SENSOR_REGISTRY:
        raise HTTPException(404, detail=f"Sensor '{sensor_id}' not found")
    return SENSOR_REGISTRY[sensor_id]


@app.post("/v1/sensors/ingest", tags=["Sensors"])
async def ingest_reading(payload: IngestRequest, user: str = Depends(get_api_key)):
    if user == "anonymous":
        raise HTTPException(401, detail="API key required for data ingestion")
    ts       = datetime.now(timezone.utc).isoformat()
    event_id = str(uuid.uuid4())
    SENSOR_REGISTRY[payload.sensor_id] = {
        "sensor_id":    payload.sensor_id,
        "type":         payload.sensor_type,
        "ocean_basin":  payload.ocean_basin,
        "latitude":     payload.latitude,
        "longitude":    payload.longitude,
        "depth_m":      (payload.metadata or {}).get("depth_m", 0),
        "status":       "online",
        "last_reading": {"value": payload.value, "unit": payload.unit, "timestamp": ts},
        "last_seen":    ts,
        "quality_flag": "QC_PENDING",
    }
    INGESTION_BUFFER.append({"event_id": event_id, "sensor_id": payload.sensor_id,
                              "value": payload.value, "ts": ts})
    return {"status": "accepted", "event_id": event_id,
            "kafka_topic": "raw-sensor-data", "timestamp": ts}


# ─────────────────────────────────────────────────────────────────────────────
# Ocean Basin Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/v1/ocean-basins", tags=["Ocean Basins"])
async def ocean_basins_summary(user: str = Depends(get_api_key)):
    summary = {}
    for basin in OCEAN_BASINS:
        bs = [s for s in SENSOR_REGISTRY.values() if s["ocean_basin"] == basin]
        temps = [s["last_reading"]["value"] for s in bs
                 if s["type"] == "temperature" and s["status"] == "online"]
        summary[basin] = {
            "total_sensors":    len(bs),
            "online":           sum(1 for s in bs if s["status"] == "online"),
            "maintenance":      sum(1 for s in bs if s["status"] == "maintenance"),
            "sensor_types":     list({s["type"] for s in bs}),
            "avg_surface_temp_c": round(sum(temps)/len(temps), 2) if temps else None,
            "anomaly_count":    len([a for a in ALERT_LOG if a["ocean_basin"] == basin]),
        }
    return {"ocean_basins": summary, "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/v1/ocean-basins/{basin}", tags=["Ocean Basins"])
async def get_basin(basin: str, user: str = Depends(get_api_key)):
    if basin not in OCEAN_BASINS:
        raise HTTPException(404, detail=f"Unknown basin '{basin}'. Valid: {OCEAN_BASINS}")
    bs = [s for s in SENSOR_REGISTRY.values() if s["ocean_basin"] == basin]
    return {
        "basin":          basin,
        "total_sensors":  len(bs),
        "sensors":        bs,
        "recent_alerts":  [a for a in ALERT_LOG if a["ocean_basin"] == basin][:5],
        "timestamp":      datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Alert Engine
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/v1/alerts", tags=["Alerts"])
async def list_alerts(
    severity:    Optional[str] = Query(None),
    ocean_basin: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    user: str = Depends(get_api_key),
):
    alerts = list(ALERT_LOG)
    if severity:    alerts = [a for a in alerts if a["severity"]    == severity]
    if ocean_basin: alerts = [a for a in alerts if a["ocean_basin"] == ocean_basin]
    return {"total": len(alerts), "alerts": alerts[:limit],
            "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/v1/alerts/stats", tags=["Alerts"])
async def alert_stats(user: str = Depends(get_api_key)):
    return {
        "total_alerts": len(ALERT_LOG),
        "critical":     sum(1 for a in ALERT_LOG if a["severity"] == "critical"),
        "warning":      sum(1 for a in ALERT_LOG if a["severity"] == "warning"),
        "by_basin":     {b: len([a for a in ALERT_LOG if a["ocean_basin"] == b])
                         for b in OCEAN_BASINS},
        "timestamp":    datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Ingestion Feed
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/v1/ingestion/feed", tags=["Ingestion"])
async def ingestion_feed(
    limit: int = Query(20, ge=1, le=100),
    user: str = Depends(get_api_key),
):
    return {
        "buffer_size":       len(INGESTION_BUFFER),
        "ingestion_rate_eps": round(INGESTION_RATE._value.get(), 2),
        "kafka_lag": {
            "raw-sensor-data": round(KAFKA_LAG.labels(topic="raw-sensor-data")._value.get(), 0),
            "qc-sensor-data":  round(KAFKA_LAG.labels(topic="qc-sensor-data")._value.get(), 0),
        },
        "events":    list(reversed(INGESTION_BUFFER))[:limit],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Climate Summary
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/v1/climate/summary", tags=["Climate"])
async def climate_summary(user: str = Depends(get_api_key)):
    def stats(values):
        if not values: return {}
        return {"min": round(min(values),3), "max": round(max(values),3),
                "avg": round(sum(values)/len(values),3), "count": len(values)}

    online = [s for s in SENSOR_REGISTRY.values() if s["status"] == "online"]
    return {
        "global_ocean_temperature_c": stats([s["last_reading"]["value"] for s in online if s["type"]=="temperature"]),
        "atmospheric_co2_ppm":         stats([s["last_reading"]["value"] for s in online if s["type"]=="co2"]),
        "ocean_ph":                    stats([s["last_reading"]["value"] for s in online if s["type"]=="ph"]),
        "data_quality": {
            "qc_pass":    sum(1 for s in SENSOR_REGISTRY.values() if s.get("quality_flag")=="QC_PASS"),
            "qc_suspect": sum(1 for s in SENSOR_REGISTRY.values() if s.get("quality_flag")=="QC_SUSPECT"),
            "qc_pending": sum(1 for s in SENSOR_REGISTRY.values() if s.get("quality_flag")=="QC_PENDING"),
        },
        "active_sensors":    sum(1 for s in SENSOR_REGISTRY.values() if s["status"]=="online"),
        "basins_monitored":  len(OCEAN_BASINS),
        "timestamp":         datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Infrastructure Status (simulates EKS / AWS)
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/v1/infrastructure/status", tags=["Infrastructure"])
async def infra_status(user: str = Depends(get_api_key)):
    return {
        "cluster":            "deepblue-prod-eks",
        "region":             "us-east-1",
        "kubernetes_version": "1.29",
        "namespaces": {
            "deepblue-ingestion":  {"pods_running":5, "hpa_max":50, "cpu_pct":round(random.uniform(35,65),1)},
            "deepblue-api":        {"pods_running":5, "hpa_max":50, "cpu_pct":round(random.uniform(20,55),1)},
            "deepblue-processing": {"pods_running":3, "hpa_max":15, "cpu_pct":round(random.uniform(40,80),1)},
            "deepblue-monitoring": {"pods_running":8, "hpa_max":None,"cpu_pct":round(random.uniform(10,30),1)},
        },
        "node_groups": {
            "system":     {"nodes":3, "status":"healthy"},
            "ingestion":  {"nodes":5, "status":"healthy"},
            "processing": {"nodes":3, "status":"healthy"},
            "api":        {"nodes":5, "status":"healthy"},
            "gpu":        {"nodes":0, "status":"scaled_to_zero"},
        },
        "data_stores": {
            "rds_timescaledb":   {"status":"available", "connections":random.randint(40,120)},
            "msk_kafka":         {"status":"active",    "broker_count":3},
            "elasticache_redis": {"status":"available", "used_memory_mb":random.randint(200,450)},
            "opensearch":        {"status":"green",     "index_count":42},
        },
        "platform_uptime_seconds": round(time.time()-START_TIME, 1),
        "sla_availability_pct":    99.97,
        "timestamp":               datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info", access_log=True)
