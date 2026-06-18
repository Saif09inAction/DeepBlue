# DeepBlue — Demonstration Screenshots

This folder contains screenshots for the project submission and presentation.

## How to Take Screenshots

1. Start the backend:
   ```bash
   cd demo && source .venv/bin/activate && python main.py
   ```

2. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```

3. Open `http://localhost:5173` in your browser

4. Take screenshots of each page listed below

---

## Required Screenshots Checklist

| # | Page | URL | File to Save As |
|---|------|-----|----------------|
| 1 | Executive Dashboard | `localhost:5173/` | `01-executive-dashboard.png` |
| 2 | Live Ocean Map (all basins) | `localhost:5173/map` | `02-ocean-map-all.png` |
| 3 | Live Ocean Map (filtered) | `localhost:5173/map` + select a basin | `03-ocean-map-filtered.png` |
| 4 | Climate Analytics | `localhost:5173/analytics` | `04-climate-analytics.png` |
| 5 | Alert Center (critical view) | `localhost:5173/alerts` | `05-alert-center.png` |
| 6 | Research Data Center | `localhost:5173/data` | `06-research-data.png` |
| 7 | Infrastructure Monitoring | `localhost:5173/infrastructure` | `07-infrastructure.png` |
| 8 | System Architecture | `localhost:5173/architecture` | `08-system-architecture.png` |
| 9 | DevOps Pipeline | `localhost:5173/devops` | `09-devops-pipeline.png` |
| 10 | FastAPI Swagger Docs | `localhost:8000/docs` | `10-api-swagger.png` |
| 11 | FastAPI Health Check | `localhost:8000/health` | `11-api-health.png` |

---

## Additional Screenshots for Documentation

| # | Description | What to Capture |
|---|-------------|----------------|
| 12 | GitHub Repository | `github.com/Saif09inAction/DeepBlue` — show file structure |
| 13 | GitHub Actions Workflow | Actions tab — show pipeline stages |
| 14 | Jenkinsfile (code view) | `jenkins/Jenkinsfile` opened in editor |
| 15 | Terraform modules | `terraform/` folder structure |
| 16 | Kubernetes manifests | `kubernetes/` folder structure |
| 17 | Prometheus config | `monitoring/prometheus/prometheus.yml` |
| 18 | Grafana dashboard JSON | `monitoring/grafana/dashboards/` |
| 19 | ELK Stack configs | `elk/` folder structure |
| 20 | Vault policies | `vault/policies/` folder |

---

## Screenshot Tips

- Use **F11** for full-screen mode before taking screenshots
- Take screenshots at **1920×1080** resolution for best quality
- For the ocean map, zoom in on a region with multiple sensor markers
- For the alert center, make sure some "Critical" alerts are visible
- For infrastructure, show it while the charts are animating

## Tools for Screenshots on macOS

```bash
# Full page screenshot with Cmd+Shift+4 then Space to capture window
# Or use browser DevTools: Cmd+Shift+P → "Capture full size screenshot"
```

---

*Place all screenshot files (`.png`) directly in this folder before submitting.*
