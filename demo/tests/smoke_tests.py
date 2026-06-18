#!/usr/bin/env python3
"""
DeepBlue — Smoke Tests for staging/production
Run against a live environment: python smoke_tests.py

Set API_BASE env var to override default (e.g. https://api.deepblue.oceanresearch.io)
"""
import os
import sys
import json
import httpx

API_BASE = os.getenv("API_BASE", "http://localhost:8000")
TIMEOUT  = 15

TESTS = [
    # (method, path, expected_status, description, required_keys)
    ("GET", "/health",                    200, "Health check",           ["status", "sensors_online"]),
    ("GET", "/",                          200, "Platform overview",      ["platform", "version"]),
    ("GET", "/v1/sensors?limit=5",        200, "List sensors",           ["sensors", "total"]),
    ("GET", "/v1/ocean-basins",           200, "Ocean basins",           ["ocean_basins"]),
    ("GET", "/v1/alerts?limit=5",         200, "List alerts",            ["alerts", "total"]),
    ("GET", "/v1/alerts/stats",           200, "Alert statistics",       ["total_alerts", "critical"]),
    ("GET", "/v1/climate/summary",        200, "Climate summary",        ["global_ocean_temperature_c"]),
    ("GET", "/v1/ingestion/feed?limit=5", 200, "Ingestion feed",         ["events", "buffer_size"]),
    ("GET", "/v1/infrastructure/status",  200, "Infrastructure status",  ["cluster", "namespaces"]),
    ("GET", "/docs",                      200, "Swagger UI",             []),
]

def run():
    print(f"\n{'='*60}")
    print(f"  DeepBlue Smoke Tests")
    print(f"  Target: {API_BASE}")
    print(f"{'='*60}\n")

    passed = 0
    failed = 0

    with httpx.Client(base_url=API_BASE, timeout=TIMEOUT) as client:
        for method, path, expected_status, description, required_keys in TESTS:
            try:
                response = client.request(method, path)
                status_ok = response.status_code == expected_status

                # Check required keys in JSON response
                keys_ok = True
                if required_keys and response.headers.get("content-type", "").startswith("application/json"):
                    data = response.json()
                    missing = [k for k in required_keys if k not in data]
                    keys_ok = len(missing) == 0
                    if missing:
                        print(f"  ✗ FAIL  [{response.status_code}]  {path}")
                        print(f"          Missing keys: {missing}")
                        failed += 1
                        continue

                if status_ok and keys_ok:
                    print(f"  ✓ PASS  [{response.status_code}]  {path}  — {description}")
                    passed += 1
                else:
                    print(f"  ✗ FAIL  [{response.status_code}]  {path}  — expected {expected_status}")
                    failed += 1

            except httpx.ConnectError:
                print(f"  ✗ ERROR  {path}  — Connection refused (is the API running?)")
                failed += 1
            except Exception as e:
                print(f"  ✗ ERROR  {path}  — {type(e).__name__}: {e}")
                failed += 1

    print(f"\n{'='*60}")
    print(f"  Results: {passed} passed, {failed} failed / {len(TESTS)} total")
    print(f"{'='*60}\n")

    if failed > 0:
        sys.exit(1)
    else:
        print("  ✅ All smoke tests passed!")

if __name__ == "__main__":
    run()
