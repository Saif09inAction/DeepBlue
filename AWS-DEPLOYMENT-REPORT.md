# DeepBlue — AWS Deployment Report
**Generated:** June 18, 2026 | **Author:** Saif Salmani | **Project:** DeepBlue Platform

---

## 1. Project Stack Analysis

### Frontend

| Property | Value |
|---|---|
| **Framework** | React 19.2.6 |
| **Build Tool** | Vite 8.0.12 |
| **Language** | TypeScript ~6.0.2 |
| **Styling** | TailwindCSS 3.4.19 + PostCSS |
| **Package Manager** | npm (package-lock.json present) |
| **Routing** | React Router DOM 7.18.0 |
| **State Management** | React built-in (useState, useRef, custom hooks) — no Redux/Zustand |
| **Charts** | Recharts 3.8.1 |
| **Maps** | Leaflet 1.9.4 + react-leaflet 5.0.0 |
| **Animations** | Framer Motion 12.40.0 |
| **Icons** | Lucide React 1.21.0 |
| **HTTP Client** | Native Fetch API (no Axios) |
| **Authentication** | None (frontend is public, API uses header-based API key) |

### Backend

| Property | Value |
|---|---|
| **Framework** | FastAPI 0.111.0 |
| **Language** | Python 3.11 |
| **Server** | Uvicorn 0.29.0 (ASGI) |
| **Validation** | Pydantic 2.7.1 |
| **HTTP Client** | httpx 0.27.0 |
| **Metrics** | prometheus-client 0.20.0 |
| **Logging** | Python built-in logging + Rich 13.7.1 |
| **Authentication** | API Key via `X-API-Key` header (optional in demo) |
| **CORS** | Configured via FastAPI CORSMiddleware |
| **Data Storage** | In-memory (Python dicts) — no real DB in demo |

### Database

| Property | Value |
|---|---|
| **Demo (current)** | In-memory Python dict — no persistence |
| **Planned (Terraform)** | PostgreSQL 15 with TimescaleDB extension on AWS RDS |
| **ORM** | None in demo — raw SQL planned for production |
| **Migrations** | None in demo — not yet implemented |
| **Seed Data** | Built-in via `seed_sensors()` function in `main.py` |
| **Cache** | Redis 7.2 (configured in docker-compose full profile) |

### API Architecture

| Property | Value |
|---|---|
| **Style** | REST (JSON over HTTP) |
| **Base path** | `/v1/` |
| **Docs** | Auto-generated Swagger UI at `/docs` |
| **Metrics** | Prometheus endpoint at `/metrics` |
| **Health** | `/health` (liveness) + `/ready` (readiness) |
| **Versioning** | URL versioning (`/v1/`) |
| **WebSockets** | None |
| **GraphQL** | None |

---

## 2. Project Structure

```
devops-exam/                          ← Root project directory
│
├── 📁 frontend/                      ← React SPA
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts             ← API call functions
│   │   │   ├── mappers.ts            ← API response → frontend type transformers
│   │   │   └── useApi.ts             ← Custom data-fetching hook
│   │   ├── components/Layout/
│   │   │   ├── AppLayout.tsx         ← Main layout wrapper
│   │   │   ├── Navbar.tsx            ← Top navigation bar
│   │   │   └── Sidebar.tsx           ← Collapsible sidebar
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         ← Executive Dashboard
│   │   │   ├── OceanMap.tsx          ← Live Ocean Map (Leaflet)
│   │   │   ├── ClimateAnalytics.tsx  ← Climate charts (Recharts)
│   │   │   ├── AlertCenter.tsx       ← Alert management
│   │   │   ├── ResearchData.tsx      ← Dataset browser
│   │   │   ├── Infrastructure.tsx    ← K8s cluster status
│   │   │   ├── Architecture.tsx      ← Architecture diagram
│   │   │   └── DevOpsPipeline.tsx    ← CI/CD pipeline view
│   │   ├── data/mockData.ts          ← Fallback mock data
│   │   ├── types/index.ts            ← TypeScript interfaces
│   │   └── lib/utils.ts              ← Utility functions
│   ├── Dockerfile                    ← Multi-stage: Node build → Nginx serve
│   ├── nginx.conf                    ← Nginx SPA config + API proxy
│   ├── vite.config.ts                ← Vite + dev proxy config
│   ├── tailwind.config.js            ← Tailwind theme config
│   ├── tsconfig.app.json             ← TypeScript compiler config
│   └── package.json                  ← Dependencies (React 19, Vite 8)
│
├── 📁 demo/                          ← FastAPI backend
│   ├── main.py                       ← Full API server (sensors, alerts, metrics)
│   ├── requirements.txt              ← Python dependencies
│   ├── Dockerfile                    ← Python 3.11-slim container
│   └── tests/
│       ├── test_api.py               ← 34 Pytest unit tests
│       └── smoke_tests.py            ← Live environment smoke tests
│
├── 📁 terraform/                     ← Infrastructure as Code
│   ├── modules/eks/
│   │   ├── main.tf                   ← EKS cluster + node groups + Karpenter
│   │   ├── variables.tf              ← Input variables
│   │   └── outputs.tf                ← Exported values (cluster endpoint, etc.)
│   └── environments/prod/
│       └── main.tf                   ← Production root config (VPC, RDS, S3, IAM)
│
├── 📁 kubernetes/                    ← K8s manifests
│   ├── deployments/api-service.yaml  ← Deployment + Service + HPA + PDB
│   ├── namespaces/all-namespaces.yaml
│   ├── argocd/argocd-app-prod.yaml   ← GitOps app definition
│   ├── rbac/rbac.yaml                ← Roles + ClusterRoles + Bindings
│   └── network-policies/zero-trust-policies.yaml
│
├── 📁 monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml            ← Scrape config (targets demo-api:8000)
│   │   └── rules/deepblue-alerts.yml ← Alert rules
│   ├── alertmanager/alertmanager.yml ← Alert routing (PagerDuty, Slack, email)
│   └── grafana/
│       ├── dashboards/deepblue-overview.json  ← Auto-provisioned dashboard
│       └── provisioning/             ← Grafana datasource + dashboard config
│
├── 📁 elk/                           ← ELK Stack configs
│   ├── elasticsearch/elasticsearch.yml
│   ├── logstash/
│   │   ├── logstash.yml
│   │   └── pipeline/deepblue.conf    ← Log parsing pipeline
│   ├── kibana/kibana.yml
│   └── filebeat/
│       ├── filebeat.yml              ← Kubernetes autodiscover config
│       └── filebeat-daemonset.yaml   ← DaemonSet manifest
│
├── 📁 vault/                         ← HashiCorp Vault
│   ├── config/vault.hcl              ← Vault server config (Raft + KMS unseal)
│   ├── policies/
│   │   ├── deepblue-app.hcl          ← App read-only policy
│   │   ├── deepblue-admin.hcl        ← Admin full-access policy
│   │   └── deepblue-readonly.hcl     ← Monitoring read-only policy
│   └── scripts/init-vault.sh         ← Full Vault initialization script
│
├── 📁 ansible/
│   └── playbooks/harden-eks-nodes.yml ← CIS benchmark hardening
│
├── 📁 jenkins/
│   ├── Jenkinsfile                   ← 10-stage CI/CD pipeline
│   └── jenkins-config.yml            ← Jenkins Configuration as Code
│
├── 📁 .github/workflows/
│   ├── ci.yml                        ← 7-job end-to-end GitHub Actions pipeline
│   └── terraform-plan.yml            ← Terraform plan/apply workflow
│
├── 📁 docs/
│   ├── deployment-diagram.md         ← Mermaid deployment diagrams
│   ├── disaster-recovery-plan.md     ← Full DR runbook
│   └── screenshots/README.md         ← Screenshot checklist
│
├── docker-compose.yml                ← demo + full profiles
├── .gitignore
├── README.md
├── prepare.md                        ← Project explanation guide
└── DeepBlue-Complete-Solution.md     ← Full 2700-line DevOps documentation
```

---

## 3. Environment Variables

### GitHub Actions Secrets (required for CI/CD)

| Variable | Required | Description |
|---|---|---|
| `AWS_ACCOUNT_ID` | ✅ Yes | Your 12-digit AWS account number |
| `AWS_ACCESS_KEY_ID` | ✅ Yes | IAM user/role key for ECR push + EKS deploy |
| `AWS_SECRET_ACCESS_KEY` | ✅ Yes | IAM user/role secret |
| `SLACK_WEBHOOK_URL` | ⚠️ Optional | Slack incoming webhook for deploy notifications |
| `GITHUB_TOKEN` | ✅ Auto | Auto-provided by GitHub Actions |

### Backend (FastAPI — demo/main.py)

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_BASE` | ⚠️ Tests only | `http://localhost:8000` | Base URL for smoke tests |
| *(no other env vars)* | — | — | API uses hardcoded config in demo mode |

### Docker Compose

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_PASSWORD` | ⚠️ Full profile | `deepblue_local_dev` | PostgreSQL admin password |
| `GF_SECURITY_ADMIN_PASSWORD` | ⚠️ | `deepblue2026` | Grafana admin password |
| `VAULT_DEV_ROOT_TOKEN_ID` | ⚠️ | `deepblue-dev-root-token` | Vault dev mode root token |

### Kubernetes (api-service.yaml)

| Variable | Required | Source | Description |
|---|---|---|---|
| `POD_NAME` | ✅ | `fieldRef: metadata.name` | Injected by Kubernetes |
| `REDIS_URL` | ✅ | Kubernetes Secret | Redis connection string |
| `DATABASE_URL` | ✅ (prod) | Vault dynamic secret | PostgreSQL connection |
| `API_KEY_SECRET` | ✅ (prod) | Kubernetes Secret | API authentication key |

### Missing — Needs to be Created

| Variable | Where Needed | Description |
|---|---|---|
| `VITE_API_URL` | frontend/.env.production | API base URL for production build |
| `AWS_REGION` | .env / CI | Target AWS region |
| `ECR_REPOSITORY` | CI | ECR registry URL |

---

## 4. Database Analysis

| Property | Demo (Now) | Production (Planned) |
|---|---|---|
| **Database** | None — in-memory Python dicts | PostgreSQL 15 + TimescaleDB |
| **Version** | N/A | PostgreSQL 15, TimescaleDB 2.x |
| **ORM** | None | None (raw SQL / asyncpg planned) |
| **Migrations** | None | Not implemented yet |
| **Seed Data** | `seed_sensors()` in main.py runs on startup | Manual seed script needed |
| **Persistence** | None — all data lost on restart | RDS Multi-AZ, hourly S3 backups |
| **AWS Service** | N/A | AWS RDS (db.t3.medium), Multi-AZ |
| **Cache** | None in demo | Redis 7.2 on AWS ElastiCache |
| **Connection** | N/A | Via Vault dynamic secrets |

**Note:** The demo API generates fresh in-memory sensor data on every startup. This is intentional for the demo — it means no database is required to run the project locally.

---

## 5. Deployment Readiness Check

### ✅ What Is Ready

- ✅ **Docker images build successfully** — `deepblue/demo-api:latest` (63.6 MB), `deepblue/frontend:latest` (21.9 MB)
- ✅ **Docker Compose works** — both demo and full profiles tested and running
- ✅ **Health check endpoints** — `/health` and `/ready` implemented, returning correct JSON
- ✅ **Prometheus metrics endpoint** — `/metrics` exposed and scraped by Prometheus
- ✅ **Nginx reverse proxy configured** — frontend proxies `/v1/*` to API backend
- ✅ **Kubernetes manifests present** — Deployment, Service, HPA, PDB, RBAC, NetworkPolicy
- ✅ **Terraform infrastructure code** — EKS, VPC, RDS, S3, IAM modules written
- ✅ **GitHub Actions CI/CD pipeline** — 7-job pipeline with lint, test, build, scan, deploy
- ✅ **Grafana auto-provisioning** — dashboard JSON + datasource YAML for zero-config setup
- ✅ **API tests** — 34 Pytest tests covering all endpoints
- ✅ **Security headers** in Nginx (X-Frame-Options, CSP, HSTS-ready)
- ✅ **Multi-stage Docker builds** — minimal image sizes, no dev tools in production
- ✅ **CORS configured** — FastAPI CORSMiddleware allows browser requests

### ❌ What Is Missing

- ❌ **`.env.example` file** — no template for required environment variables
- ❌ **`VITE_API_URL` environment variable** — frontend has API URL hardcoded as `demo-api` (Docker service name), not a real domain
- ❌ **Terraform state bucket** — S3 bucket `deepblue-terraform-state-prod` does not exist yet (must be created before `terraform init`)
- ❌ **ECR repositories** — `deepblue-api-service`, `deepblue-frontend` ECR repos not created
- ❌ **AWS credentials** — no AWS CLI configured, no IAM user/role created
- ❌ **Real database migration** — no SQL schema files, no Alembic/Flyway setup
- ❌ **SSL/TLS certificate** — no HTTPS configured (needed for production)
- ❌ **Domain name** — no Route53 hosted zone or custom domain

### ⚠️ Potential Issues

- ⚠️ **`version: "3.9"` in docker-compose.yml** — deprecated attribute (harmless warning but messy)
- ⚠️ **Grafana password in plaintext** — `deepblue2026` hardcoded in docker-compose.yml (fine for demo, not production)
- ⚠️ **Vault running in dev mode** — `vault server -dev` stores all data in memory, restarts lose all secrets (demo only)
- ⚠️ **No rate limiting on API** — FastAPI has no rate limiter, vulnerable to request flooding
- ⚠️ **CORS set to `*`** — allows any origin; should be locked to your domain in production
- ⚠️ **No real authentication** — API key check in FastAPI is optional (`X-API-Key` header), not enforced
- ⚠️ **Large JS bundle** — frontend builds to 1 MB (Vite warns about this); acceptable for demo but should be code-split for production
- ⚠️ **Nginx hardcodes `demo-api`** — the hostname `demo-api` only works inside Docker network; on EKS, it should be a Kubernetes service name like `api-service.deepblue-prod.svc.cluster.local`

---

## 6. Docker Analysis

### Docker Files Present — Yes ✅

#### `demo/Dockerfile` — FastAPI Backend
```
Base image:  python:3.11-slim  (63.6 MB final image)
Type:        Single-stage
Strategy:    requirements.txt copied first (cache optimization)
Healthcheck: HTTP GET /health every 15 seconds
Entrypoint:  python main.py
Exposes:     Port 8000
```

#### `frontend/Dockerfile` — React Frontend
```
Base image:  Node:20-alpine (builder) → nginx:1.25-alpine (final)
Type:        Multi-stage build ✅
Stage 1:     npm ci + tsc + vite build → creates /app/dist
Stage 2:     nginx:1.25-alpine copies /app/dist + nginx.conf
Final size:  21.9 MB (no Node.js in production image)
Exposes:     Port 80
```

#### `docker-compose.yml` — Orchestration
```
Profiles:    demo (4 services) | full (11 services)
Network:     deepblue-net (bridge)
Volumes:     prometheus_data, grafana_data, postgres_data, redis_data,
             kafka_data, zookeeper_data, elasticsearch_data, kibana_data, vault_data
Health deps: frontend waits for demo-api healthy
             grafana waits for prometheus healthy
```

#### `Dockerfiles/api-service.Dockerfile` and `ingestion-service.Dockerfile`
These are legacy files in `/Dockerfiles/` folder. They reference `./services/api-service` and `./services/ingestion-service` directories that **do not exist**. These files are **not used** by docker-compose.yml anymore. They can be ignored for deployment.

---

## 7. AWS Deployment Recommendation

### Option A — Simple (EC2 + RDS + S3)

**Best for:** Quick demo, low cost, easy setup

```
Architecture:
Internet → EC2 t3.medium (Docker Compose) → RDS PostgreSQL
                                           → S3 (logs/assets)
```

| Service | Purpose | Approx Cost/month |
|---|---|---|
| EC2 t3.medium | Run Docker Compose (all containers) | ~$30 |
| RDS db.t3.micro | PostgreSQL (optional) | ~$15 |
| S3 | Static assets, logs | ~$1 |
| Route53 | DNS for custom domain | ~$1 |
| ACM | Free SSL certificate | Free |
| **Total** | | **~$47/month** |

**Pros:** Simple, deploy in 30 minutes, works exactly like local Docker Compose
**Cons:** No auto-scaling, single point of failure, not "cloud-native"

---

### Option B — DevOps Grade (ECS + ECR + ALB)

**Best for:** Showing cloud-native deployment without full Kubernetes complexity

```
Architecture:
Internet → Route53 → CloudFront → ALB
                                   ├── ECS Task: frontend (Nginx)
                                   └── ECS Task: demo-api (FastAPI)
                        ECR (stores Docker images)
                        CloudWatch (logs + metrics)
```

| Service | Purpose | Approx Cost/month |
|---|---|---|
| ECS Fargate (2 tasks) | Run frontend + API containers | ~$15 |
| ECR | Store Docker images | ~$1 |
| ALB | Load balancer | ~$16 |
| CloudFront | CDN for frontend | ~$1 |
| Route53 | DNS | ~$1 |
| ACM | SSL certificate | Free |
| CloudWatch | Logs + metrics | ~$3 |
| **Total** | | **~$37/month** |

**Pros:** Serverless containers (no server management), auto-scaling, proper load balancing
**Cons:** More complex than EC2, ECS is less impressive than EKS for a DevOps project

---

### Option C — Full DevOps (EKS + ECR + ALB + Route53)

**Best for:** Final-year B.Tech DevOps project presentation — shows full Kubernetes expertise

```
Architecture:
Internet → Route53 → CloudFront (CDN) → WAF
                                          ↓
                                         ALB (Application Load Balancer)
                                          ↓
                            EKS Cluster (Kubernetes)
                            ├── Namespace: deepblue-prod
                            │   ├── Pod: frontend (Nginx, 2 replicas)
                            │   └── Pod: demo-api (FastAPI, 3 replicas)
                            ├── Namespace: deepblue-monitoring
                            │   ├── Pod: prometheus
                            │   └── Pod: grafana
                            └── Namespace: deepblue-logging
                                └── Pod: kibana
                            ECR → stores all Docker images
                            S3  → Terraform state, assets, backups
                            CloudWatch → logs, alarms
```

| Service | Purpose | Approx Cost/month |
|---|---|---|
| EKS Cluster | Kubernetes control plane | ~$73 |
| EC2 t3.medium × 2 (worker nodes) | Run pods | ~$60 |
| ECR | 3 Docker image repos | ~$1 |
| ALB | Ingress load balancer | ~$16 |
| CloudFront | CDN | ~$1 |
| Route53 | DNS | ~$1 |
| ACM | SSL certificate | Free |
| S3 | Terraform state + assets | ~$1 |
| CloudWatch | Logs + metrics | ~$5 |
| **Total** | | **~$158/month** |

**Pros:** Full DevOps story, Kubernetes, auto-scaling, GitOps with ArgoCD
**Cons:** Most expensive, complex setup (~2 hours), overkill for a demo

---

### ⭐ Recommendation for B.Tech Final Year Project

**Use Option B (ECS) for actual deployment + describe Option C (EKS) in your presentation.**

**Why:**
1. Option B costs ~$37/month and you can stay within **AWS Free Tier** for most of it
2. ECS Fargate runs the same Docker images you already built — zero code changes needed
3. For your viva/presentation, you already have the full EKS Terraform code (`terraform/modules/eks/`) and Kubernetes manifests — you can show and explain them without running them
4. This is the industry-standard approach: demonstrate knowledge of the full stack in documentation, deploy the practical demo version

---

## 8. Deployment Commands

### Local Development
```bash
# Install frontend dependencies
cd frontend && npm install

# Start frontend dev server (with API proxy)
npm run dev
# Opens: http://localhost:5173

# In another terminal — start backend
cd demo
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
# Opens: http://localhost:8000
```

### Build Production Version
```bash
# Build frontend (TypeScript compile + Vite bundle)
cd frontend && npm run build
# Output: frontend/dist/

# Build Docker images
docker build -t deepblue/demo-api:latest ./demo
docker build -t deepblue/frontend:latest ./frontend
```

### Run with Docker Compose (Recommended)
```bash
# Demo stack (API + Frontend + Prometheus + Grafana)
docker compose --profile demo up -d

# View logs
docker compose logs -f demo-api
docker compose logs -f frontend

# Check health
docker compose --profile demo ps

# Stop
docker compose --profile demo down

# Full infrastructure stack
docker compose --profile full up -d
```

### Run API Tests
```bash
cd demo
source .venv/bin/activate
pytest tests/test_api.py -v

# Live smoke tests
API_BASE=http://localhost:8000 python tests/smoke_tests.py
```

### Tag and Push to ECR
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag images
docker tag deepblue/demo-api:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/deepblue-api-service:latest

docker tag deepblue/frontend:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/deepblue-frontend:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/deepblue-api-service:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/deepblue-frontend:latest
```

### Deploy to EC2 (Option A)
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Install Docker and git
sudo yum update -y
sudo yum install -y docker git
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and run
git clone https://github.com/Saif09inAction/DeepBlue.git
cd DeepBlue
docker compose --profile demo up -d

# App is live at:
# http://YOUR_EC2_IP:8080   → Dashboard
# http://YOUR_EC2_IP:8000   → API
# http://YOUR_EC2_IP:3000   → Grafana
```

---

## 9. Missing Files Report

| File | Status | Notes |
|---|---|---|
| `demo/Dockerfile` | ✅ Present | Single-stage Python 3.11-slim |
| `frontend/Dockerfile` | ✅ Present | Multi-stage Node → Nginx |
| `docker-compose.yml` | ✅ Present | demo + full profiles |
| `frontend/nginx.conf` | ✅ Present | SPA config + API proxy |
| `.github/workflows/ci.yml` | ✅ Present | 7-job pipeline |
| `.github/workflows/terraform-plan.yml` | ✅ Present | IaC pipeline |
| `terraform/modules/eks/main.tf` | ✅ Present | EKS cluster module |
| `terraform/environments/prod/main.tf` | ✅ Present | Production root config |
| `kubernetes/deployments/api-service.yaml` | ✅ Present | Full deployment spec |
| `kubernetes/namespaces/all-namespaces.yaml` | ✅ Present | All namespaces with quotas |
| `kubernetes/rbac/rbac.yaml` | ✅ Present | Full RBAC setup |
| `kubernetes/argocd/argocd-app-prod.yaml` | ✅ Present | GitOps app definition |
| `kubernetes/network-policies/zero-trust-policies.yaml` | ✅ Present | Zero-trust networking |
| `monitoring/prometheus/prometheus.yml` | ✅ Present | Scrape config |
| `monitoring/prometheus/rules/deepblue-alerts.yml` | ✅ Present | Alert rules |
| `monitoring/grafana/dashboards/deepblue-overview.json` | ✅ Present | Auto-provisioned dashboard |
| `elk/elasticsearch/elasticsearch.yml` | ✅ Present | ES config |
| `elk/logstash/pipeline/deepblue.conf` | ✅ Present | Log pipeline |
| `elk/kibana/kibana.yml` | ✅ Present | Kibana config |
| `elk/filebeat/filebeat-daemonset.yaml` | ✅ Present | K8s DaemonSet |
| `vault/config/vault.hcl` | ✅ Present | Vault server config |
| `vault/scripts/init-vault.sh` | ✅ Present | Vault init automation |
| `jenkins/Jenkinsfile` | ✅ Present | 10-stage Jenkins pipeline |
| `docs/disaster-recovery-plan.md` | ✅ Present | Full DR runbook |
| `docs/deployment-diagram.md` | ✅ Present | Mermaid diagrams |
| **`.env.example`** | ❌ **Missing** | Template for env variables |
| **`services/api-service/`** | ❌ **Missing** | Referenced in legacy Dockerfiles (not needed) |
| **`frontend/.env.production`** | ❌ **Missing** | `VITE_API_URL` for AWS deployment |

---

## 10. Final Deployment Summary

### 1. Exact Deployment Architecture (Recommended: Option B — ECS)

```
                    ┌─────────────────────────────────────────────────┐
                    │                   AWS Cloud                     │
                    │                                                 │
  Browser ──────►  │  Route53 ──► CloudFront ──► ALB                │
                    │                              ├──► ECS: frontend │
                    │                              └──► ECS: demo-api │
                    │                                                 │
                    │  ECR ──► stores Docker images                   │
                    │  S3  ──► static assets + logs                  │
                    │  CloudWatch ──► logs + alarms                  │
                    │  ACM ──► free HTTPS certificate                │
                    └─────────────────────────────────────────────────┘
```

### 2. AWS Services Required

| Service | Required For | Free Tier? |
|---|---|---|
| **ECR** | Store Docker images | 500 MB free |
| **ECS Fargate** | Run containers | No free tier |
| **ALB** | Load balancer + HTTPS termination | No free tier |
| **CloudFront** | CDN for frontend | 1 TB/month free |
| **Route53** | DNS (optional — use EC2 IP directly) | $0.50/hosted zone |
| **ACM** | Free SSL certificate | Free |
| **S3** | Assets + logs | 5 GB free |
| **CloudWatch** | Logs | 5 GB free |
| **IAM** | Roles and permissions | Free |
| **VPC** | Network | Free |

### 3. Estimated Monthly AWS Cost

| Scenario | Services | Cost |
|---|---|---|
| **Option A — EC2 only** | t3.micro EC2 + Route53 | **Free** (12-month free tier) |
| **Option A — EC2 t3.medium** | Full Docker Compose | **~$47/month** |
| **Option B — ECS Fargate** | ECS + ALB + ECR + CloudWatch | **~$37/month** |
| **Option C — EKS Full** | EKS + EC2 nodes + all services | **~$158/month** |
| **Minimum demo** | EC2 t2.micro (free tier) | **$0 for 12 months** |

### 4. Deployment Difficulty

| Option | Difficulty | Time to Deploy | Best For |
|---|---|---|---|
| EC2 + Docker Compose | 🟢 **Easy** | 30 minutes | Quick demo |
| ECS Fargate | 🟡 **Medium** | 1–2 hours | Proper cloud demo |
| EKS Full Stack | 🔴 **Hard** | 3–5 hours | Full DevOps showcase |

### 5. Step-by-Step Deployment Plan

#### Phase 1 — Prepare (15 minutes)
```
Step 1. Create AWS account (if not already done)
Step 2. Create IAM user with AdministratorAccess
Step 3. Install AWS CLI: brew install awscli
Step 4. Configure: aws configure (enter Access Key ID + Secret)
Step 5. Verify: aws sts get-caller-identity
```

#### Phase 2 — Create ECR Repositories (5 minutes)
```
Step 6. Create ECR repos:
  aws ecr create-repository --repository-name deepblue-api-service --region us-east-1
  aws ecr create-repository --repository-name deepblue-frontend --region us-east-1

Step 7. Login to ECR:
  aws ecr get-login-password --region us-east-1 | \
    docker login --username AWS --password-stdin \
    $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
```

#### Phase 3 — Push Docker Images (10 minutes)
```
Step 8. Tag and push API image:
  ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
  docker tag deepblue/demo-api:latest $ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/deepblue-api-service:latest
  docker push $ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/deepblue-api-service:latest

Step 9. Tag and push frontend image:
  docker tag deepblue/frontend:latest $ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/deepblue-frontend:latest
  docker push $ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/deepblue-frontend:latest
```

#### Phase 4A — Deploy on EC2 (Easiest — 20 minutes)
```
Step 10. Launch EC2 t2.micro (free tier) or t3.medium in us-east-1
         - AMI: Amazon Linux 2023
         - Security Group: allow ports 22, 80, 8080, 8000, 3000, 9090

Step 11. SSH into EC2:
  ssh -i your-key.pem ec2-user@EC2_PUBLIC_IP

Step 12. Install Docker:
  sudo yum update -y && sudo yum install -y docker git
  sudo systemctl start docker && sudo usermod -aG docker ec2-user
  exit && ssh again (re-login for group to apply)

Step 13. Clone and run:
  git clone https://github.com/Saif09inAction/DeepBlue.git
  cd DeepBlue
  docker compose --profile demo up -d

Step 14. Access:
  http://EC2_PUBLIC_IP:8080  → Dashboard
  http://EC2_PUBLIC_IP:8000  → API docs
  http://EC2_PUBLIC_IP:3000  → Grafana
```

#### Phase 4B — Deploy on ECS Fargate (Proper Cloud — 2 hours)
```
Step 10. Create VPC, subnets, security groups (or use default VPC)
Step 11. Create ECS Cluster: aws ecs create-cluster --cluster-name deepblue
Step 12. Create Task Definitions for demo-api and frontend
Step 13. Create ALB + target groups
Step 14. Create ECS Services pointing to ALB
Step 15. Request ACM certificate for your domain
Step 16. Create Route53 record pointing to ALB
Step 17. Access at https://your-domain.com
```

#### Phase 4C — Full EKS Deployment (DevOps Grade — 3+ hours)
```
Step 10. Create S3 bucket for Terraform state:
  aws s3 mb s3://deepblue-terraform-state-prod --region us-east-1

Step 11. Run Terraform:
  cd terraform/environments/prod
  terraform init
  terraform plan
  terraform apply

Step 12. Update kubeconfig:
  aws eks update-kubeconfig --name deepblue-prod --region us-east-1

Step 13. Apply Kubernetes manifests:
  kubectl apply -f kubernetes/namespaces/
  kubectl apply -f kubernetes/rbac/
  kubectl apply -f kubernetes/deployments/

Step 14. Install ArgoCD:
  kubectl create namespace argocd
  kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

Step 15. Apply Prometheus + Grafana via Helm:
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm install prometheus prometheus-community/kube-prometheus-stack -n deepblue-monitoring

Step 16. Get LoadBalancer URL:
  kubectl get svc -n deepblue-prod
```

---

> **Bottom line:** For your B.Tech presentation, the **EC2 option (Phase 4A)** gives you a live public URL in under 30 minutes at zero cost using AWS Free Tier. It runs the exact same Docker images you've already built and tested locally. No code changes needed.

---
*Report generated: June 18, 2026 — DeepBlue Platform v2.4.1*
