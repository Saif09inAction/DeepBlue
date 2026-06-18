"""
DeepBlue API — Unit & Integration Tests
Run with: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app

client = TestClient(app)


# ── Health & Root ────────────────────────────────────────────────────────────

class TestHealthEndpoints:

    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_response_structure(self):
        data = client.get("/health").json()
        assert "status" in data
        assert "version" in data
        assert "uptime_seconds" in data
        assert "sensors_online" in data
        assert "active_alerts" in data
        assert data["status"] == "healthy"

    def test_health_sensors_online_is_positive(self):
        data = client.get("/health").json()
        assert data["sensors_online"] >= 0

    def test_root_returns_platform_info(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "platform" in data
        assert "DeepBlue" in data["platform"]


# ── Sensors ──────────────────────────────────────────────────────────────────

class TestSensorEndpoints:

    def test_list_sensors_default(self):
        response = client.get("/v1/sensors")
        assert response.status_code == 200
        data = response.json()
        assert "sensors" in data
        assert "total" in data
        assert isinstance(data["sensors"], list)

    def test_list_sensors_with_limit(self):
        response = client.get("/v1/sensors?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["sensors"]) <= 5

    def test_list_sensors_limit_too_large_returns_422(self):
        response = client.get("/v1/sensors?limit=999")
        assert response.status_code == 422

    def test_list_sensors_limit_zero_returns_422(self):
        response = client.get("/v1/sensors?limit=0")
        assert response.status_code == 422

    def test_sensor_has_required_fields(self):
        data = client.get("/v1/sensors?limit=1").json()
        assert len(data["sensors"]) > 0
        sensor = data["sensors"][0]
        required = ["sensor_id", "name", "type", "ocean_basin", "latitude",
                    "longitude", "depth_m", "status", "last_reading"]
        for field in required:
            assert field in sensor, f"Missing field: {field}"

    def test_sensor_latitude_in_range(self):
        data = client.get("/v1/sensors?limit=10").json()
        for sensor in data["sensors"]:
            assert -90 <= sensor["latitude"] <= 90

    def test_sensor_longitude_in_range(self):
        data = client.get("/v1/sensors?limit=10").json()
        for sensor in data["sensors"]:
            assert -180 <= sensor["longitude"] <= 180

    def test_get_single_sensor(self):
        sensors = client.get("/v1/sensors?limit=1").json()["sensors"]
        if sensors:
            sensor_id = sensors[0]["sensor_id"]
            response = client.get(f"/v1/sensors/{sensor_id}")
            assert response.status_code == 200
            assert response.json()["sensor_id"] == sensor_id

    def test_get_nonexistent_sensor_returns_404(self):
        response = client.get("/v1/sensors/SNS-DOES-NOT-EXIST")
        assert response.status_code == 404


# ── Ocean Basins ─────────────────────────────────────────────────────────────

class TestOceanBasinEndpoints:

    def test_ocean_basins_returns_200(self):
        response = client.get("/v1/ocean-basins")
        assert response.status_code == 200

    def test_ocean_basins_has_expected_basins(self):
        data = client.get("/v1/ocean-basins").json()
        assert "ocean_basins" in data
        expected = {"north_atlantic", "south_atlantic", "north_pacific",
                    "south_pacific", "indian", "arctic", "southern"}
        actual = set(data["ocean_basins"].keys())
        assert expected == actual

    def test_ocean_basin_has_sensor_count(self):
        data = client.get("/v1/ocean-basins").json()
        for basin, info in data["ocean_basins"].items():
            assert "total_sensors" in info, f"{basin} missing total_sensors"
            assert info["total_sensors"] >= 0


# ── Alerts ───────────────────────────────────────────────────────────────────

class TestAlertEndpoints:

    def test_list_alerts_default(self):
        response = client.get("/v1/alerts")
        assert response.status_code == 200
        data = response.json()
        assert "alerts" in data
        assert "total" in data

    def test_list_alerts_limit_max_50(self):
        response = client.get("/v1/alerts?limit=100")
        assert response.status_code == 422

    def test_alert_has_required_fields(self):
        data = client.get("/v1/alerts?limit=5").json()
        for alert in data["alerts"]:
            assert "id" in alert
            assert "severity" in alert
            assert "message" in alert
            assert "ocean_basin" in alert
            assert "timestamp" in alert

    def test_alert_severity_is_valid(self):
        data = client.get("/v1/alerts?limit=20").json()
        valid_severities = {"critical", "warning"}
        for alert in data["alerts"]:
            assert alert["severity"] in valid_severities

    def test_alert_stats_returns_counts(self):
        response = client.get("/v1/alerts/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_alerts" in data
        assert "critical" in data
        assert "warning" in data
        assert data["critical"] + data["warning"] <= data["total_alerts"]


# ── Climate ──────────────────────────────────────────────────────────────────

class TestClimateEndpoints:

    def test_climate_summary_returns_200(self):
        response = client.get("/v1/climate/summary")
        assert response.status_code == 200

    def test_climate_summary_has_temperature(self):
        data = client.get("/v1/climate/summary").json()
        assert "global_ocean_temperature_c" in data
        temp = data["global_ocean_temperature_c"]
        assert "min" in temp
        assert "max" in temp
        assert "avg" in temp

    def test_climate_temperature_range_is_realistic(self):
        data = client.get("/v1/climate/summary").json()
        temp = data["global_ocean_temperature_c"]
        assert -5 <= temp["min"] <= 40, "Min temperature unrealistic"
        assert -5 <= temp["max"] <= 40, "Max temperature unrealistic"
        assert temp["min"] <= temp["avg"] <= temp["max"]

    def test_climate_co2_ppm_is_realistic(self):
        data = client.get("/v1/climate/summary").json()
        if "atmospheric_co2_ppm" in data:
            co2 = data["atmospheric_co2_ppm"]["avg"]
            assert 350 <= co2 <= 500, f"CO2 {co2} ppm outside realistic range"


# ── Ingestion Feed ───────────────────────────────────────────────────────────

class TestIngestionEndpoints:

    def test_ingestion_feed_returns_200(self):
        response = client.get("/v1/ingestion/feed")
        assert response.status_code == 200

    def test_ingestion_feed_has_events(self):
        data = client.get("/v1/ingestion/feed").json()
        assert "events" in data
        assert "buffer_size" in data
        assert "ingestion_rate_eps" in data

    def test_ingestion_limit_max_100(self):
        response = client.get("/v1/ingestion/feed?limit=200")
        assert response.status_code == 422

    def test_ingestion_rate_is_non_negative(self):
        data = client.get("/v1/ingestion/feed").json()
        assert data["ingestion_rate_eps"] >= 0


# ── Infrastructure ───────────────────────────────────────────────────────────

class TestInfrastructureEndpoints:

    def test_infra_status_returns_200(self):
        response = client.get("/v1/infrastructure/status")
        assert response.status_code == 200

    def test_infra_has_cluster_info(self):
        data = client.get("/v1/infrastructure/status").json()
        assert "cluster" in data
        assert "region" in data
        assert "kubernetes_version" in data
        assert data["region"] == "us-east-1"

    def test_infra_has_namespaces(self):
        data = client.get("/v1/infrastructure/status").json()
        assert "namespaces" in data
        assert len(data["namespaces"]) > 0

    def test_infra_has_node_groups(self):
        data = client.get("/v1/infrastructure/status").json()
        assert "node_groups" in data
        assert len(data["node_groups"]) > 0

    def test_infra_sla_is_realistic(self):
        data = client.get("/v1/infrastructure/status").json()
        sla = data.get("sla_availability_pct", 100)
        assert 90 <= sla <= 100
