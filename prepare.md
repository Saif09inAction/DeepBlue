# DeepBlue — Complete Project Explanation Guide
### Prepared by: Saif Salmani | B.Tech Final Year DevOps Project

> **How to use this document:** Read each section before your presentation or viva.
> Every section answers: *What is it? How does it work? Which technology? Why that technology? What does Docker do here?*

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Frontend Application](#2-frontend-application)
   - [Executive Dashboard](#21-executive-dashboard)
   - [Live Ocean Map](#22-live-ocean-map)
   - [Climate Analytics](#23-climate-analytics)
   - [Alert Center](#24-alert-center)
   - [Research Data Center](#25-research-data-center)
   - [Infrastructure Monitoring](#26-infrastructure-monitoring)
   - [System Architecture Page](#27-system-architecture-page)
   - [DevOps Pipeline Page](#28-devops-pipeline-page)
3. [Backend API (FastAPI)](#3-backend-api-fastapi)
4. [Docker & Containerization](#4-docker--containerization)
5. [Docker Compose](#5-docker-compose)
6. [CI/CD Pipeline](#6-cicd-pipeline)
   - [GitHub Actions](#61-github-actions)
   - [Jenkins](#62-jenkins)
   - [ArgoCD (GitOps)](#63-argocd-gitops)
7. [Kubernetes Architecture](#7-kubernetes-architecture)
8. [Terraform (Infrastructure as Code)](#8-terraform-infrastructure-as-code)
9. [Ansible (Configuration Management)](#9-ansible-configuration-management)
10. [Monitoring — Prometheus & Grafana](#10-monitoring--prometheus--grafana)
11. [Logging — ELK Stack](#11-logging--elk-stack)
12. [Secret Management — HashiCorp Vault](#12-secret-management--hashicorp-vault)
13. [Disaster Recovery Plan](#13-disaster-recovery-plan)
14. [AWS Cloud Services Used](#14-aws-cloud-services-used)
15. [Security Architecture](#15-security-architecture)
16. [Common Viva Questions & Answers](#16-common-viva-questions--answers)

---

## 1. Project Overview

### What is DeepBlue?
DeepBlue is an **Oceanographic Research and Climate Intelligence Platform**. It collects real-time sensor data from ocean buoys placed across different ocean basins (Atlantic, Pacific, Indian, Arctic, Southern), processes that data, detects anomalies, raises alerts, and presents everything on a live web dashboard.

### What problem does it solve?
Ocean scientists need real-time visibility into ocean temperature, salinity, pH, dissolved oxygen, and wave height. Traditional systems are slow, not automated, and lack intelligent alerting. DeepBlue automates the entire pipeline — from sensor ingestion to visualisation — and wraps it with enterprise-grade DevOps practices.

### Why is this a good DevOps project?
Because it demonstrates the **full DevOps lifecycle**:
- **Develop** → React frontend + FastAPI backend
- **Containerize** → Docker images
- **Deploy** → Kubernetes on AWS EKS
- **Automate** → CI/CD via GitHub Actions + Jenkins
- **Monitor** → Prometheus + Grafana
- **Log** → ELK Stack
- **Secure** → HashiCorp Vault + IAM + RBAC
- **Recover** → Disaster Recovery Plan

### Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, Recharts, Leaflet, Framer Motion |
| Backend | Python, FastAPI, Uvicorn |
| Containerization | Docker, Docker Compose |
| Orchestration | Kubernetes (AWS EKS) |
| IaC | Terraform, Ansible |
| CI/CD | GitHub Actions, Jenkins, ArgoCD |
| Monitoring | Prometheus, Grafana |
| Logging | Elasticsearch, Logstash, Kibana (ELK), Filebeat |
| Secret Management | HashiCorp Vault |
| Cloud | AWS (EKS, EC2, S3, RDS, Route53, CloudFront, KMS, IAM, VPC) |
| Message Queue | Apache Kafka |
| Cache | Redis |
| Database | PostgreSQL (TimescaleDB) |

---

## 2. Frontend Application

### What is the Frontend?
A **single-page application (SPA)** built with React. It connects to the FastAPI backend to pull live sensor readings, alerts, and infrastructure metrics and displays them in a dark-themed, ocean-inspired dashboard.

### How does the Frontend work?
1. User opens the browser → React loads from Nginx (in Docker) or Vite dev server
2. React Router handles navigation — no page reload when you switch sections
3. Each page makes API calls to the FastAPI backend through a proxy
4. Data refreshes every 10–30 seconds automatically using a custom `useApi` hook
5. Charts and maps re-render when new data arrives

### Which API does the Frontend use?
The frontend calls the **DeepBlue REST API** running at `http://localhost:8000`. All calls go through a Vite proxy (dev) or Nginx reverse proxy (production Docker) to avoid CORS issues.

Key endpoints used by the frontend:
```
GET /health              → Check if API is alive
GET /v1/sensors          → Fetch all ocean sensors and their readings
GET /v1/ocean-basins     → Fetch basin-level summaries
GET /v1/alerts           → Fetch active alerts
GET /v1/climate/trends   → Fetch temperature trends over time
GET /v1/infrastructure/status → Fetch Kubernetes cluster stats
GET /metrics             → Prometheus metrics (scraped by Prometheus, not frontend)
```

### Why React + Vite?
- **React** — component-based, makes building 8 separate pages manageable
- **Vite** — extremely fast build tool, replaces Webpack, hot reload in milliseconds
- **TypeScript** — catches bugs at compile time, not runtime (important for production)
- **TailwindCSS** — utility-first CSS, no need to write separate CSS files
- **Framer Motion** — smooth animations, makes the dashboard feel alive

---

### 2.1 Executive Dashboard

**What it shows:**
- KPI cards: Total Sensors Online, Active Alerts, Ingestion Rate, Buffer Events
- Ocean Basin health (how many sensors per basin)
- Recent alerts feed
- Time-series chart of ocean temperature

**How it works:**
- Calls `/health` → gets `sensors_online`, `active_alerts`, `ingestion_buffer_size`
- Calls `/v1/sensors` → calculates how many sensors are in each ocean basin
- Calls `/v1/alerts` → shows the most recent 5 alerts in the feed
- KPI numbers animate using a custom `useCountUp` hook (counts up from 0 to the real value)

**Which tech?**
- `Recharts` library for the line chart (temperature over time)
- `Framer Motion` for card entrance animations
- `Lucide Icons` for the icons inside KPI cards

**Why this page first?**
An executive dashboard gives a "heartbeat" of the entire system at a glance. Stakeholders can see if the system is healthy in under 10 seconds.

---

### 2.2 Live Ocean Map

**What it shows:**
- An interactive world map with coloured markers for every sensor
- Green = Online, Yellow = Warning, Red = Critical, Grey = Offline
- Click a sensor marker → see its live temperature, salinity, pH, depth
- Stats panel: total sensors, online count, percentage online

**How it works:**
- Calls `/v1/sensors?limit=100` → gets sensor list with `lat`, `lon`, `status`, `latest_reading`
- Passes this data to `react-leaflet` which renders the map
- Markers are coloured based on sensor status
- Map tiles come from OpenStreetMap (free, no API key required)

**Which API / Library?**
- **Leaflet.js** via `react-leaflet` — open-source interactive map library
- **OpenStreetMap** tiles — free map tile provider (no API key needed)
- Why not Google Maps? Google Maps requires a paid API key. Leaflet + OpenStreetMap is free and production-ready.

**Why a map?**
Ocean sensors are geographically distributed. A map makes spatial distribution immediately obvious — you can see which regions have high sensor density and which don't.

**What Docker does here:**
The React app is built and served by an Nginx container. Nginx handles all static file serving (HTML, JS, CSS) and proxies `/v1/*` requests to the FastAPI container.

---

### 2.3 Climate Analytics

**What it shows:**
- Temperature trends per ocean basin (line chart)
- Salinity comparison across basins (bar chart)
- Anomaly detection chart (scatter plot of outliers)
- pH and Dissolved Oxygen trends

**How it works:**
- Calls `/v1/climate/trends` → gets historical time-series for temperature, salinity, pH
- Data is grouped by ocean basin
- Charts update automatically every 30 seconds

**Which library?**
- **Recharts** — a React-native chart library built on D3.js
- Why Recharts over Chart.js? Recharts components are React components, so they integrate naturally with React state and props

**Why this page?**
Climate change analysis requires trend data. Scientists need to see if temperatures are rising, falling, or anomalous compared to historical baselines.

---

### 2.4 Alert Center

**What it shows:**
- All active and resolved alerts
- Filter by: Severity (Critical, High, Medium, Low), Status (Active, Resolved), Ocean Basin
- Search by sensor ID or alert description
- Each alert shows: sensor ID, basin, anomaly type, severity, timestamp, recommended action

**How it works:**
- Calls `/v1/alerts?limit=50` → gets all alerts
- Filter, search, and sort run client-side on the fetched data (no extra API calls for each filter)
- Alerts are colour-coded: Red = Critical, Orange = High, Yellow = Medium, Blue = Low

**Which API?**
```
GET /v1/alerts?limit=50
Response: { total, alerts: [ { id, sensor_id, basin, type, severity, timestamp, description } ] }
```

**Why limit=50?**
The FastAPI backend validates the `limit` parameter with a maximum of 50 (using Pydantic `Query(le=50)`). Sending more than 50 returns HTTP 422.

**Why alert management matters (DevOps angle):**
In production, alerts connect to PagerDuty (on-call engineer), Slack (team notification), and email. The Alertmanager config (`monitoring/alertmanager/alertmanager.yml`) handles this routing.

---

### 2.5 Research Data Center

**What it shows:**
- Published datasets with download links
- Research papers citing DeepBlue data
- Data quality metrics
- Export functionality (CSV, JSON)

**How it works:**
- Uses mock data (no live API for this section)
- Research data changes rarely (monthly, not real-time), so static/mock data is appropriate here

**Why mock data here?**
This is a presentation decision — the core technical demonstration is in the live pages (Dashboard, Map, Alerts). Research data management is a separate system in production (usually connected to a data warehouse like AWS S3 + Athena).

---

### 2.6 Infrastructure Monitoring

**What it shows:**
- Kubernetes cluster status (total nodes, healthy nodes, CPU/memory usage)
- Namespace resource usage
- Node group health
- Database (RDS) and cache (Redis) status

**How it works:**
- Calls `/v1/infrastructure/status` → gets cluster metrics, namespace stats, node group status, data store health
- Simulated data in the demo API (real production would pull from Kubernetes API + CloudWatch)

**Which API?**
```
GET /v1/infrastructure/status
Response: {
  cluster: { name, status, nodes_total, nodes_healthy, cpu_usage, memory_usage },
  namespaces: [ { name, cpu_used, memory_used, pods_running } ],
  node_groups: [ { name, instance_type, nodes, status } ],
  data_stores: [ { name, type, status, connections } ]
}
```

**Why show infrastructure in the app?**
A DevOps platform should provide unified visibility — developers should not need to `kubectl` into a cluster to see health. This page simulates what a real internal developer portal would look like.

---

### 2.7 System Architecture Page

**What it shows:**
- A visual diagram of the entire system architecture
- Components: CloudFront, WAF, Load Balancer, EKS, RDS, Kafka, Redis, S3, Vault, Prometheus, Grafana
- Data flow arrows showing how data moves from sensor → Kafka → API → Dashboard

**How it works:**
- Pure frontend component — no API calls
- Architecture is drawn using React components with CSS positioning and SVG arrows
- Interactive: hovering over a component shows a tooltip with description

**Why include this in the app?**
For a presentation, having the architecture diagram inside the running application itself is more impressive than a static slide. It shows the project is self-documenting.

---

### 2.8 DevOps Pipeline Page

**What it shows:**
- CI/CD pipeline flow: Code Push → Lint → Test → Build → Security Scan → Push to ECR → Deploy to EKS → Smoke Test
- Each stage shows status (passed/failed), duration, and tool used
- Pipeline stages: GitHub Actions stages, then ArgoCD GitOps deployment

**How it works:**
- Pure frontend component — no API calls
- Simulates what a real pipeline run looks like
- Animated progress through stages using Framer Motion

**Why include this?**
Demonstrates understanding of the CI/CD process. In a viva, you can point to this and explain each stage.

---

## 3. Backend API (FastAPI)

### What is FastAPI?
**FastAPI** is a modern Python web framework for building REST APIs. It is:
- **Fast** — one of the fastest Python frameworks (built on Starlette + Uvicorn ASGI)
- **Automatic docs** — generates Swagger UI at `/docs` automatically
- **Type-safe** — uses Python type hints + Pydantic for validation
- **Async** — handles many concurrent requests using Python asyncio

### Where is the code?
`demo/main.py` — the entire backend is in one file for simplicity.

### How does the API work?

**Startup sequence:**
1. Python starts → FastAPI app initializes
2. `lifespan` context manager runs → seeds 40 fake sensors into memory
3. Background task starts → every 5 seconds, generates new readings for each sensor, creates alerts for anomalies
4. Uvicorn starts listening on port 8000

**Data flow:**
```
Background Task (every 5s)
    ↓ generates new reading for each sensor
    ↓ checks if reading is anomalous (e.g. temp > threshold)
    ↓ creates an alert if anomaly detected
    ↓ updates in-memory sensor state

Frontend calls GET /v1/sensors
    ↓ FastAPI returns current in-memory sensor state
    ↓ Frontend updates the map and charts
```

### Key Endpoints Explained

| Endpoint | What it does | Response |
|---|---|---|
| `GET /health` | Health check — used by Kubernetes liveness probe | `{ status, sensors_online, active_alerts }` |
| `GET /ready` | Readiness check — used by Kubernetes readiness probe | `{ ready: true }` |
| `GET /metrics` | Prometheus metrics — scraped by Prometheus every 15s | Text format metrics |
| `GET /v1/sensors` | All sensors with latest readings | Array of sensor objects |
| `GET /v1/ocean-basins` | Basin-level aggregated data | Array of basin summaries |
| `GET /v1/alerts` | Active and recent alerts | Array of alert objects |
| `GET /v1/climate/trends` | Temperature/salinity trends | Time-series data |
| `GET /v1/infrastructure/status` | Fake K8s cluster status | Cluster + namespace data |
| `POST /v1/ingestion/ingest` | Simulate receiving a sensor reading | Confirmation message |

### What does Pydantic do?
Pydantic validates request/response data. For example:
```python
class SensorReading(BaseModel):
    temperature: float = Field(ge=-5, le=40)   # between -5°C and 40°C
    salinity: float = Field(ge=0, le=50)        # between 0 and 50 PSU
```
If the frontend sends `temperature: 999`, Pydantic rejects it with HTTP 422.

### What are Prometheus Metrics?
The `/metrics` endpoint exposes counters and gauges that Prometheus scrapes:
- `deepblue_sensors_online` — how many sensors are currently active
- `deepblue_active_alerts_total` — number of active alerts
- `deepblue_api_requests_total` — total API requests by endpoint and status code
- `deepblue_ingestion_rate` — how many events per second are being ingested

### Why FastAPI over Flask or Django?
| Feature | FastAPI | Flask | Django |
|---|---|---|---|
| Auto Swagger docs | ✅ Built-in | ❌ Manual | ❌ Manual |
| Async support | ✅ Native | ❌ Requires extensions | ❌ Requires extensions |
| Type validation | ✅ Pydantic | ❌ Manual | ❌ Manual |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Learning curve | Low | Low | High |

---

## 4. Docker & Containerization

### What is Docker?
Docker packages your application and all its dependencies into a **container** — a lightweight, isolated environment. The container runs the same way on your laptop, a test server, and a production cloud server.

### Without Docker vs With Docker

**Without Docker (the problem):**
- "It works on my machine" — works locally but fails on the server
- Different Python/Node versions cause bugs
- Manual dependency installation is error-prone

**With Docker (the solution):**
- Everything packaged together — Python version, libraries, config files
- One command to start the entire stack
- Identical behaviour everywhere

---

### Backend Dockerfile (`demo/Dockerfile`)

```dockerfile
FROM python:3.11-slim           # Start from official Python 3.11 image (slim = smaller size)
WORKDIR /app                    # Set working directory inside container
COPY requirements.txt .         # Copy dependencies list first (Docker cache optimization)
RUN pip install -r requirements.txt  # Install Python packages
COPY main.py .                  # Copy application code
EXPOSE 8000                     # Tell Docker the app runs on port 8000
HEALTHCHECK ...                 # Docker checks /health every 15s to verify the app is alive
CMD ["python", "main.py"]       # Command to start the application
```

**Why `python:3.11-slim` and not `python:3.11`?**
The `slim` variant is 150 MB vs 900 MB for the full image. Smaller image = faster deployment, less storage cost, smaller attack surface.

**Why copy `requirements.txt` before `main.py`?**
Docker builds images in layers. If you copy `requirements.txt` first and it hasn't changed, Docker uses the cached layer and skips reinstalling all packages — this makes rebuilds much faster.

---

### Frontend Dockerfile (`frontend/Dockerfile`)

This is a **multi-stage build** — two separate stages in one file:

**Stage 1: Builder (Node.js)**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                      # Install exact dependencies from lock file
COPY . .
RUN npm run build               # TypeScript compile + Vite bundle → /app/dist
```

**Stage 2: Production (Nginx)**
```dockerfile
FROM nginx:1.25-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html   # Copy compiled files only
COPY nginx.conf /etc/nginx/conf.d/default.conf        # Custom nginx config
```

**Why multi-stage?**
The final image contains only Nginx + compiled static files. The Node.js compiler (400 MB) is discarded. Result: ~25 MB final image instead of ~500 MB.

**What does Nginx do?**
- Serves `index.html`, CSS, and JavaScript files to the browser
- Proxies `/v1/*` API requests to the `demo-api` container (so browser never gets CORS errors)
- Adds security headers (X-Frame-Options, Content-Security-Policy)
- Compresses responses with Gzip

---

## 5. Docker Compose

### What is Docker Compose?
Docker Compose is a tool that runs **multiple containers together** as a single application. Instead of starting each container manually, you define all services in `docker-compose.yml` and run one command.

### Our Two Profiles

**Demo Profile** (for presentations — starts in ~30 seconds):
```
docker compose --profile demo up -d
```
Starts: `demo-api` + `frontend` + `prometheus` + `grafana`

**Full Profile** (complete infrastructure — needs ~8 GB RAM):
```
docker compose --profile full up -d
```
Adds: `postgres` + `redis` + `zookeeper` + `kafka` + `kafka-ui` + `elasticsearch` + `kibana` + `vault`

### How do containers communicate?
All containers are on a shared Docker network called `deepblue-net`. They communicate using **service names** as hostnames:
- Frontend Nginx config: `proxy_pass http://demo-api:8000` (not `localhost`)
- Prometheus config: `targets: ['demo-api:8000']` (not `localhost`)

### Health Checks
Each service has a health check. Docker waits for a service to be healthy before starting dependent services:
```
demo-api becomes healthy
    → then frontend starts (it needs the API to be ready)
    → then grafana starts (it needs prometheus to be ready)
```

### Volumes
Persistent data is stored in named volumes so it survives container restarts:
- `prometheus_data` → stores Prometheus time-series metrics history
- `grafana_data` → stores Grafana dashboards and settings
- `postgres_data` → stores database tables and rows
- `elasticsearch_data` → stores log indices

### Services Explained

| Service | Image | Port | Purpose |
|---|---|---|---|
| `demo-api` | `deepblue/demo-api:latest` | 8000 | FastAPI backend (our code) |
| `frontend` | `deepblue/frontend:latest` | 8080 | React app served by Nginx (our code) |
| `prometheus` | `prom/prometheus:v2.47.0` | 9090 | Metrics collection |
| `grafana` | `grafana/grafana:10.2.0` | 3000 | Metrics visualization |
| `postgres` | `timescale/timescaledb` | 5432 | Time-series database |
| `redis` | `redis:7.2-alpine` | 6379 | Cache / session store |
| `kafka` | `confluentinc/cp-kafka` | 9092 | Message queue for sensor events |
| `elasticsearch` | `docker.elastic.co/...` | 9200 | Log storage and search |
| `kibana` | `docker.elastic.co/...` | 5601 | Log visualization |
| `vault` | `hashicorp/vault:1.15` | 8200 | Secret management |

---

## 6. CI/CD Pipeline

### What is CI/CD?
- **CI (Continuous Integration):** Every code push is automatically tested and validated
- **CD (Continuous Delivery/Deployment):** After tests pass, code is automatically built and deployed

**Without CI/CD:** Developer pushes code → manually runs tests → manually builds Docker image → manually deploys to server → hopes nothing breaks

**With CI/CD:** Developer pushes code → pipeline automatically tests, builds, scans, and deploys → team is notified of success or failure

---

### 6.1 GitHub Actions

**File:** `.github/workflows/ci.yml`

**Trigger:** Every `git push` to any branch, or a Pull Request

**7 Jobs in the pipeline:**

```
1. frontend-lint-test
   → Runs: npm ci, tsc --noEmit (TypeScript check), eslint
   → Why: Catch syntax errors and type errors before they reach production

2. backend-test
   → Runs: pip install, pytest demo/tests/test_api.py
   → Why: Run 34 API tests to verify all endpoints work correctly

3. security-scan
   → Runs: Trivy filesystem scanner
   → Checks: Known CVEs in Python packages and Node modules
   → Why: Prevent deploying code with known security vulnerabilities

4. docker-build
   → Builds: deepblue/demo-api:latest, deepblue/frontend:latest
   → Uses: Docker layer caching to speed up builds
   → Why: Verify the Docker images actually build without errors

5. push-to-ecr (main branch only)
   → Tags image with: git commit SHA + "latest"
   → Pushes to: AWS Elastic Container Registry
   → Why: ECR is a private Docker registry — EKS pulls images from here

6. deploy-staging
   → Runs: kubectl set image to update the Kubernetes deployment
   → Why: Test the new version in staging before production

7. integration-tests
   → Runs: smoke_tests.py against the staging URL
   → Checks: /health, /v1/sensors, /v1/alerts all return 200
   → Why: Final verification that the deployed version actually works
```

**Notifications:**
- On failure → Slack message with which job failed and why
- On success → Slack message with deployment details

**Secrets used:**
```
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY  → To push to ECR
KUBE_CONFIG                               → To deploy to EKS
SLACK_WEBHOOK_URL                         → To send Slack notifications
```

---

### 6.2 Jenkins

**File:** `jenkins/Jenkinsfile`

Jenkins is an alternative/additional CI/CD tool. While GitHub Actions runs on GitHub's servers, Jenkins runs on your own Kubernetes cluster (self-hosted).

**Why both GitHub Actions AND Jenkins?**
- GitHub Actions → fast, cloud-based, good for open-source
- Jenkins → self-hosted, no rate limits, integrates with internal tools, used by large enterprises

**10 Stages in the Jenkins pipeline:**

```
Stage 1: Checkout          → Pull source code from GitHub
Stage 2: Lint & Test       → Frontend TypeScript + ESLint check, Backend Pytest
Stage 3: Security Scan     → Trivy scans filesystem for CVEs
Stage 4: Docker Build      → Build API and frontend images
Stage 5: Image Security Scan → Trivy scans the built Docker images
Stage 6: Push to ECR       → Push images to AWS ECR
Stage 7: Terraform Plan    → Show what infrastructure changes will be made
Stage 8: Terraform Apply   → Apply infrastructure changes (main branch only)
Stage 9: Deploy to EKS     → kubectl apply Kubernetes manifests
Stage 10: Smoke Tests      → Run smoke_tests.py against the deployed URL
```

**Jenkins runs on Kubernetes** using a Kubernetes Pod as the agent. Each stage runs in a different container within the same pod:
- `docker` container → for building Docker images
- `node` container → for npm/TypeScript steps
- `python` container → for pytest and smoke tests
- `terraform` container → for Terraform plan/apply
- `kubectl` container → for Kubernetes deployments
- `trivy` container → for security scanning

---

### 6.3 ArgoCD (GitOps)

**File:** `kubernetes/argocd/argocd-app-prod.yaml`

**What is GitOps?**
GitOps means the Git repository is the **single source of truth** for what should be running in Kubernetes. Instead of someone running `kubectl apply` manually, ArgoCD watches the Git repo and automatically applies any changes.

**How it works:**
1. Developer merges PR to `main` branch
2. GitHub Actions CI passes, updates the image tag in the Kubernetes YAML files
3. ArgoCD detects the change in Git (polls every 3 minutes)
4. ArgoCD applies the new Kubernetes manifests automatically
5. If the new deployment fails (health check fails), ArgoCD automatically rolls back

**Why ArgoCD?**
- **Auditability** — every change is a Git commit with author + timestamp
- **Rollback** — just revert the Git commit, ArgoCD rolls back automatically
- **Drift detection** — if someone manually changes a Kubernetes resource, ArgoCD detects and corrects it

---

## 7. Kubernetes Architecture

### What is Kubernetes?
Kubernetes (K8s) is a **container orchestration system**. It manages running containers across a cluster of servers, handling:
- Scheduling (which server runs which container)
- Scaling (add more containers when traffic increases)
- Self-healing (restart failed containers automatically)
- Load balancing (distribute requests across multiple container instances)
- Rolling updates (deploy new version without downtime)

### Our Kubernetes Setup (AWS EKS)

**EKS** = Elastic Kubernetes Service = AWS manages the Kubernetes control plane for you. You just manage your worker nodes.

**Cluster structure:**
```
EKS Cluster (deepblue-prod)
├── Node Group: application-nodes (t3.medium × 3 → scales to 10)
├── Node Group: monitoring-nodes (t3.large × 2)
└── Node Group: data-nodes (r5.xlarge × 2)
```

### Namespaces
We separate workloads into namespaces:

| Namespace | What runs there |
|---|---|
| `deepblue-prod` | API service, ingestion service |
| `deepblue-monitoring` | Prometheus, Grafana, Alertmanager |
| `deepblue-logging` | Logstash, Kibana, Filebeat |
| `deepblue-data` | TimescaleDB, Redis |
| `deepblue-security` | Vault, cert-manager |

**Why namespaces?**
- Resource isolation — monitoring pods can't accidentally consume all resources meant for the application
- RBAC — different teams get access to different namespaces
- Network policies — control which namespaces can talk to each other

### Key Kubernetes Resources Used

**Deployment (`kubernetes/deployments/api-service.yaml`)**
```yaml
replicas: 3          # Run 3 copies of the API container
strategy: RollingUpdate  # Deploy new version gradually, not all at once
```
If one pod crashes, the other 2 still serve requests. Kubernetes automatically restarts the crashed pod.

**HPA (Horizontal Pod Autoscaler)**
```yaml
minReplicas: 3
maxReplicas: 20
metrics:
  - CPU > 70% → add more pods
  - Memory > 80% → add more pods
```
During a traffic spike (e.g. a storm causing all buoys to report at once), HPA automatically adds more pods.

**PDB (Pod Disruption Budget)**
```yaml
minAvailable: 2
```
Kubernetes guarantees at least 2 pods are always running. Protects against all pods being stopped simultaneously during a node upgrade.

**Liveness Probe**
```yaml
httpGet:
  path: /health
  port: 8000
```
Kubernetes hits `/health` every 10 seconds. If it fails 3 times in a row, Kubernetes kills the pod and starts a new one.

**Readiness Probe**
```yaml
httpGet:
  path: /ready
  port: 8000
```
Kubernetes only sends traffic to a pod after `/ready` returns 200. This prevents traffic being sent to a pod that is still starting up.

### RBAC (Role-Based Access Control)
File: `kubernetes/rbac/rbac.yaml`

Controls who can do what in the cluster:
- **Platform team** → can do everything (admin)
- **Dev team** → can read pods, logs, deployments in their namespace only
- **Data team** → can access data namespace only
- **API service account** → can only read ConfigMaps and Secrets (principle of least privilege)

### Network Policies (Zero-Trust)
File: `kubernetes/network-policies/zero-trust-policies.yaml`

By default, Kubernetes allows all pods to talk to all other pods. We lock this down:
- API pods can only talk to PostgreSQL and Redis
- Monitoring pods can only scrape metrics
- No pod can communicate outside its allowed connections

**Why zero-trust?**
If one pod is compromised, the attacker cannot reach the database or other services.

---

## 8. Terraform (Infrastructure as Code)

### What is Terraform?
Terraform lets you define your entire cloud infrastructure in code files (`.tf` files). Instead of clicking through the AWS console, you write code and run `terraform apply` — Terraform creates everything automatically.

**Without Terraform:** Click through AWS console, forget what you created, can't recreate it, different settings in dev vs prod

**With Terraform:** Infrastructure is code, stored in Git, versioned, reviewable, repeatable

### Our Terraform Structure

```
terraform/
├── modules/
│   ├── eks/          → EKS cluster module (reusable)
│   ├── rds/          → PostgreSQL module
│   ├── vpc/          → Networking module
│   └── s3/           → Storage module
└── environments/
    └── prod/
        └── main.tf   → Uses modules to build the full production environment
```

**Modules** are reusable blocks. Instead of repeating the EKS configuration for dev and prod, you write it once as a module and call it with different variables.

### Key Resources Terraform Creates

| Resource | AWS Service | Purpose |
|---|---|---|
| VPC + Subnets | AWS VPC | Private network for all resources |
| EKS Cluster | AWS EKS | Managed Kubernetes |
| RDS Instance | AWS RDS | PostgreSQL database |
| S3 Bucket | AWS S3 | Store raw sensor data, Terraform state |
| IAM Roles | AWS IAM | Permissions for EKS nodes and pods |
| KMS Key | AWS KMS | Encrypt secrets, database, S3 |
| Route53 | AWS Route53 | DNS — `deepblue.io` → Load Balancer IP |

### Terraform Workflow
```bash
terraform init      # Download providers (AWS, Kubernetes)
terraform plan      # Preview what will be created/changed/destroyed
terraform apply     # Actually create/change the infrastructure
terraform destroy   # Tear down everything (used for cleanup)
```

### State File
Terraform stores current infrastructure state in a **state file** (`terraform.tfstate`). We store this in S3 with DynamoDB locking:
- S3 → stores the state file remotely (team can share it)
- DynamoDB → prevents two people running `terraform apply` at the same time

---

## 9. Ansible (Configuration Management)

### What is Ansible?
Ansible configures servers after they are created. Terraform creates an EC2 instance; Ansible then SSHs into it and installs software, sets configurations, and applies security hardening.

**Ansible vs Terraform:**
- Terraform = creates infrastructure (what servers exist)
- Ansible = configures infrastructure (what is installed on those servers)

### Our Ansible Playbook
File: `ansible/playbooks/harden-eks-nodes.yml`

Applies **CIS (Center for Internet Security) benchmarks** to EKS worker nodes:
- Disable root SSH login
- Enable auditd (system call auditing)
- Configure firewall rules
- Disable unnecessary services
- Set kernel security parameters (`sysctl` hardening)
- Install Falco (runtime security monitoring)
- Rotate logs every 7 days

**Why harden EKS nodes?**
EKS manages the Kubernetes control plane, but you are responsible for the worker node security. An unhardened node is vulnerable to privilege escalation attacks.

---

## 10. Monitoring — Prometheus & Grafana

### What is Prometheus?
Prometheus is a **time-series database** that collects metrics. It works by "scraping" — periodically sending HTTP GET requests to `/metrics` endpoints and storing the numbers.

### How it connects to DeepBlue
Prometheus config (`monitoring/prometheus/prometheus.yml`):
```yaml
scrape_configs:
  - job_name: deepblue-demo-api
    static_configs:
      - targets: ['demo-api:8000']   # Scrape the API container every 15s
    metrics_path: /metrics
```

Every 15 seconds, Prometheus calls `http://demo-api:8000/metrics` and stores values like:
- `deepblue_sensors_online 39` → 39 sensors are online right now
- `deepblue_active_alerts_total 2` → 2 active alerts
- `deepblue_api_requests_total{endpoint="/v1/sensors", status="200"} 1547` → 1547 successful calls to /v1/sensors

### Alert Rules
File: `monitoring/prometheus/rules/deepblue-alerts.yml`

Prometheus evaluates rules every 15 seconds:
```yaml
- alert: CriticalSensorAlert
  expr: deepblue_active_alerts_total > 10
  for: 2m
  severity: critical
  message: "More than 10 active alerts for 2 minutes"
```

When a rule fires, Prometheus sends it to **Alertmanager**.

### Alertmanager
File: `monitoring/alertmanager/alertmanager.yml`

Routes alerts to the right people:
- **Critical** → PagerDuty (wakes up on-call engineer immediately)
- **Warning** → Slack `#deepblue-alerts` channel
- **Info** → Email to the team

### What is Grafana?
Grafana is a **visualization tool** that connects to Prometheus and displays metrics as beautiful charts and dashboards.

**Auto-provisioned dashboard:** `monitoring/grafana/dashboards/deepblue-overview.json`
When Grafana starts in Docker, it automatically loads this dashboard (via provisioning config). No manual setup needed.

**Dashboard panels include:**
- Sensors Online (stat panel — shows current number)
- Active Alerts (stat panel with red threshold)
- API Request Rate (graph over last 1 hour)
- Ocean Temperature by Basin (multi-line graph)
- EKS CPU/Memory Utilization (gauge panels)
- Kubernetes Pod Status by Namespace (table)

### Why Prometheus over other tools?
| Feature | Prometheus | CloudWatch | Datadog |
|---|---|---|---|
| Cost | Free, open-source | Pay per metric | Expensive |
| Kubernetes native | ✅ | ❌ | ✅ |
| Self-hosted | ✅ | ❌ (AWS only) | ❌ |
| Query language | PromQL (powerful) | Basic | Advanced |

---

## 11. Logging — ELK Stack

### What is the ELK Stack?
ELK = **Elasticsearch + Logstash + Kibana**

- **Filebeat** — collects logs from pods, ships them to Logstash
- **Logstash** — parses, filters, and transforms logs
- **Elasticsearch** — stores and indexes all logs (search engine)
- **Kibana** — search and visualize logs in a web UI

### How logs flow through the system

```
Kubernetes Pod (API container)
    → writes logs to stdout
    → Filebeat DaemonSet reads from /var/log/containers/
    → sends to Logstash on port 5044

Logstash
    → parses JSON log lines
    → adds metadata (kubernetes.pod.name, cloud.region)
    → looks up geographic location from IP address (GeoIP)
    → drops health check spam (/health endpoint hits)
    → sends to Elasticsearch

Elasticsearch
    → indexes logs into deepblue-api-YYYY.MM.DD
    → 30-day retention policy (old indices deleted automatically)

Kibana
    → connects to Elasticsearch
    → provides search, filter, time-range, and dashboard UI
    → access at http://localhost:5601
```

### Why Filebeat as a DaemonSet?
A DaemonSet runs one pod per node. This ensures every node in the cluster has a Filebeat pod collecting logs — no pods are missed.

### Why ELK over CloudWatch Logs?
- ELK gives you powerful full-text search
- Kibana dashboards are more flexible than CloudWatch
- ELK is free; CloudWatch charges per GB ingested
- ELK can run anywhere (not AWS-only)

### Example Logstash Filter
```
if [request_path] == "/health" { drop {} }
```
Health check endpoints are called thousands of times per day and are not useful in logs. Dropping them saves ~60% storage.

---

## 12. Secret Management — HashiCorp Vault

### What is a Secret?
A secret is any sensitive value: database password, API key, TLS certificate, AWS access key. You must never store these in:
- Git repository (biggest mistake)
- Docker images
- Kubernetes ConfigMaps (unencrypted)
- Environment variables in plaintext

### What is HashiCorp Vault?
Vault is a dedicated **secrets management system**. Applications request secrets from Vault at runtime instead of having them hardcoded.

### How Vault integrates with Kubernetes
File: `vault/scripts/init-vault.sh`

1. Kubernetes pods have a **Service Account**
2. Vault is configured to trust the Kubernetes auth backend
3. Pod authenticates to Vault using its Service Account token
4. Vault verifies the token with the Kubernetes API
5. Vault issues a short-lived token to the pod
6. Pod uses that token to read secrets (database password, API keys)
7. Token expires after 1 hour — pod must re-authenticate

**Key feature:** The database password is never stored anywhere. It exists only in Vault and in memory inside the running pod.

### Dynamic Secrets
Vault can generate **temporary database credentials** on demand:
```
Pod requests DB credentials from Vault
Vault creates a new PostgreSQL user: "deepblue-api-abc123"
Vault gives the pod username + temporary password (expires in 1 hour)
Pod connects to PostgreSQL
After 1 hour, Vault automatically revokes the user
```

Why? If the credentials are leaked, they expire in 1 hour. An attacker cannot use stale credentials.

### Vault Policies
Three policies define what each role can access:
- `deepblue-app` (in `vault/policies/deepblue-app.hcl`) → Read database creds, API keys
- `deepblue-admin` → Full access to manage secrets
- `deepblue-readonly` → Read-only for monitoring agents

### AWS KMS Auto-Unseal
Vault encrypts everything at rest. On startup, it needs a key to decrypt (unseal). We use **AWS KMS** to automatically unseal Vault when it starts — no human needs to enter a key.

---

## 13. Disaster Recovery Plan

### What is Disaster Recovery?
DR is the plan for what to do when things go catastrophically wrong — entire AWS region goes down, database gets corrupted, cluster is deleted.

**File:** `docs/disaster-recovery-plan.md`

### RTO and RPO (Key metrics)
- **RTO (Recovery Time Objective):** Maximum acceptable downtime = **4 hours**
  - Translation: The system must be back online within 4 hours of any disaster
- **RPO (Recovery Point Objective):** Maximum acceptable data loss = **1 hour**
  - Translation: We can lose at most 1 hour of sensor data

### Backup Strategy

| Data | Backup Frequency | Storage | Retention |
|---|---|---|---|
| PostgreSQL DB | Every 1 hour | S3 (cross-region) | 30 days |
| Raw sensor data | Continuous stream | S3 + Glacier | 7 years |
| Kubernetes configs | Every push to Git | GitHub | Forever |
| Vault secrets | Daily snapshot | S3 (encrypted) | 90 days |

### Disaster Scenarios and Responses

**Scenario 1: Single pod crashes**
- Kubernetes detects crash (within 5 seconds)
- Kubernetes restarts the pod automatically
- HPA ensures other pods absorb traffic
- RTO: ~30 seconds

**Scenario 2: Entire EKS node fails**
- Kubernetes detects node as NotReady
- Pods are rescheduled to healthy nodes
- Auto-scaling group adds replacement node
- RTO: ~5 minutes

**Scenario 3: RDS database failure**
- RDS Multi-AZ automatically fails over to standby replica
- Connection string stays the same (Route53 updates automatically)
- RTO: ~2 minutes, RPO: ~0 (synchronous replication)

**Scenario 4: Entire AWS region down (e.g. us-east-1)**
- Route53 health check detects us-east-1 is down
- DNS switches to us-west-2 (DR region)
- us-west-2 has warm EKS cluster ready
- RDS read replica in us-west-2 is promoted to primary
- Restore from last hourly S3 backup
- RTO: ~3 hours, RPO: ~1 hour

---

## 14. AWS Cloud Services Used

### Core Services

| Service | What it does in DeepBlue |
|---|---|
| **EKS** | Runs Kubernetes cluster. Manages control plane automatically |
| **EC2** | Physical VMs that are the Kubernetes worker nodes |
| **VPC** | Private network isolating all our resources from the internet |
| **ALB** | Application Load Balancer — distributes traffic across API pods |
| **CloudFront** | CDN — caches frontend assets globally, reduces latency |
| **Route53** | DNS — maps `deepblue.io` to our Load Balancer |
| **S3** | Stores raw sensor data, Terraform state, backups, frontend assets |
| **RDS** | Managed PostgreSQL database (TimescaleDB extension) |
| **ElastiCache** | Managed Redis — API caching layer |
| **MSK** | Managed Kafka — processes sensor event stream |
| **ECR** | Private Docker registry — stores our container images |
| **IAM** | Identity and Access Management — controls who/what can do what |
| **KMS** | Encryption key management — encrypts S3, RDS, Vault |
| **WAF** | Web Application Firewall — blocks SQL injection, XSS attacks |
| **CloudWatch** | AWS-native monitoring and log collection |
| **Secrets Manager** | Alternative to Vault for some AWS-native secrets |

---

## 15. Security Architecture

### Defence-in-Depth
We apply security at every layer:

**1. Network level:**
- VPC with private subnets — database never exposed to internet
- Security Groups — strict inbound/outbound rules
- WAF — blocks common web attacks
- Network Policies in Kubernetes — zero-trust pod communication

**2. Identity level:**
- IAM roles with least privilege — EKS nodes can only access what they need
- IRSA (IAM Roles for Service Accounts) — pods get AWS permissions without sharing node credentials
- Vault — secrets never in plaintext anywhere

**3. Container level:**
- Trivy scans every image for CVEs before deployment
- Non-root user in Docker containers
- Read-only root filesystem where possible
- Falco — runtime threat detection (detects if a container tries to do something unexpected)

**4. Code level:**
- OPA (Open Policy Agent) — enforces policies before deployment (e.g. "all containers must have resource limits")
- Dependabot (GitHub) — automatically creates PRs for dependency security updates

---

## 16. Common Viva Questions & Answers

**Q: Why did you choose Kubernetes over just running Docker containers?**
A: Docker containers alone don't provide auto-scaling, self-healing, or rolling deployments. If a container crashes, it stays down. Kubernetes automatically restarts it, scales it when traffic increases, and deploys new versions without downtime. For an oceanographic platform with 24/7 uptime requirements, Kubernetes is essential.

**Q: What is the difference between Prometheus and Grafana?**
A: Prometheus is the database — it collects and stores metrics as time-series data. Grafana is the visualization layer — it queries Prometheus and displays the data as graphs and dashboards. Prometheus without Grafana gives you raw numbers; Grafana without Prometheus has nothing to show.

**Q: Why use Kafka instead of sending data directly to the database?**
A: Kafka acts as a buffer and decouples the sensor network from the database. If the database is slow or temporarily down, sensor readings queue up in Kafka and are processed when the database recovers. Direct database writes would cause data loss during outages. Kafka also allows multiple consumers — the API can read the same data as the analytics engine simultaneously.

**Q: What is the difference between liveness and readiness probes?**
A: Liveness probe asks "is this container alive?" — if it fails, Kubernetes kills and restarts the container. Readiness probe asks "is this container ready to receive traffic?" — if it fails, Kubernetes stops sending traffic to it but doesn't kill it. This distinction is important during startup: a container might be alive but still loading its configuration (not ready yet).

**Q: What is GitOps and why use ArgoCD?**
A: GitOps is a practice where Git is the single source of truth for infrastructure state. You never run `kubectl apply` manually. Instead, ArgoCD watches the Git repository and applies any changes automatically. If someone manually changes a Kubernetes resource, ArgoCD detects the "drift" and corrects it back to what Git says. This provides auditability, consistency, and easy rollbacks.

**Q: How does Vault prevent secrets from being stored in Git?**
A: Vault is an external secrets store. Applications authenticate to Vault at runtime (using a Kubernetes Service Account token) and receive secrets in memory. The Git repository contains only a reference to where the secret is in Vault (like "read from `secret/deepblue/db-password`"), not the actual password. Even if the Git repo is public, there are no secrets to expose.

**Q: What would happen if the AWS us-east-1 region went down?**
A: Our DR plan handles this. Route53 health checks detect that us-east-1 is unreachable and automatically switch DNS to our us-west-2 DR region. We have a warm EKS cluster in us-west-2 (already running but at reduced capacity). The RDS read replica is promoted to primary. We restore any missing data from S3 hourly backups. Expected recovery time: under 4 hours.

**Q: Why not just use AWS CloudWatch instead of Prometheus + Grafana?**
A: CloudWatch is AWS-only. Prometheus + Grafana can run anywhere — on-premises, on GCP, on Azure, or in Docker on a laptop. For a multi-cloud or hybrid strategy, vendor-independent tools are better. Also, CloudWatch charges per metric per month; Prometheus is free. Grafana's dashboard capabilities are also significantly more powerful and customizable.

**Q: What is TimescaleDB and why use it over regular PostgreSQL?**
A: TimescaleDB is a PostgreSQL extension optimized for time-series data (data with timestamps, like sensor readings). It automatically partitions data by time, making queries like "show me all readings in the last 24 hours" 10-100x faster than regular PostgreSQL. It also provides built-in data retention policies (automatically delete data older than X days).

**Q: How does the CI/CD pipeline prevent bad code from reaching production?**
A: The pipeline has multiple gates: (1) TypeScript compilation check catches type errors, (2) ESLint catches code style issues, (3) Pytest runs 34 API tests, (4) Trivy scans for security vulnerabilities, (5) Docker build ensures the container actually builds, (6) Smoke tests verify the deployed version responds correctly. Code only reaches production if it passes ALL of these gates.

---

*End of DeepBlue Preparation Guide*
*Good luck with your presentation, Saif!*
