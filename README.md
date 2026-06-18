# DeepBlue – Oceanographic Research & Climate Intelligence Platform

> Enterprise-Grade DevOps Solution | Final Year B.Tech Project

---

## About the Project

DeepBlue is a full-stack cloud-native platform for real-time oceanographic monitoring and climate intelligence. It tracks data from 51+ sensors across 7 ocean basins, processes millions of events per day, and provides actionable insights through a modern web dashboard.

Built as part of my final-year B.Tech project to demonstrate end-to-end DevOps practices — from infrastructure as code to CI/CD automation, Kubernetes orchestration, and observability.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Cloud** | AWS (EKS, EC2, S3, RDS, Route53, CloudWatch, IAM, VPC) |
| **IaC** | Terraform, Ansible |
| **Containers** | Docker, Kubernetes (EKS), Helm |
| **CI/CD** | GitHub Actions, ArgoCD (GitOps) |
| **Backend** | Python, FastAPI, Kafka, TimescaleDB, Redis |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, Recharts, Leaflet |
| **Monitoring** | Prometheus, Grafana, Loki, ELK Stack |
| **Security** | HashiCorp Vault, OPA, Falco, Trivy |

---

## Project Structure

```
DeepBlue/
│
├── DeepBlue-Complete-Solution.md        ← Full architecture & documentation
│
├── frontend/                            ← React dashboard application
│   ├── src/
│   │   ├── pages/                       ← 8 dashboard pages
│   │   ├── components/                  ← Reusable UI components
│   │   ├── api/                         ← API client & hooks
│   │   └── data/                        ← Mock data for demo
│   └── ...
│
├── demo/                                ← FastAPI simulation backend
│   ├── main.py                          ← API server with live data simulation
│   └── requirements.txt
│
├── .github/workflows/                   ← CI/CD GitHub Actions pipelines
├── terraform/                           ← AWS infrastructure as code
├── kubernetes/                          ← K8s manifests, RBAC, NetworkPolicies
├── monitoring/                          ← Prometheus, Alertmanager config
├── ansible/                             ← Node hardening playbooks
├── Dockerfiles/                         ← Multi-stage container builds
└── docker-compose.yml                   ← Local development stack
```

---

## Dashboard Pages

| # | Page | Description |
|---|------|-------------|
| 1 | **Executive Dashboard** | KPI cards, animated counters, live activity feed, charts |
| 2 | **Live Ocean Map** | Interactive Leaflet map with real sensor markers |
| 3 | **Climate Analytics** | Temperature, CO₂, sea level, storm activity charts |
| 4 | **Alert Center** | Real-time alert management with search & filters |
| 5 | **Research Data Center** | Dataset explorer with download management |
| 6 | **Infrastructure Monitoring** | Grafana-style K8s/pod/node health dashboard |
| 7 | **System Architecture** | Animated architecture diagram |
| 8 | **DevOps Pipeline** | CI/CD flow visualization with live status |

---

## Quick Start

### 1. Run the Demo Backend

```bash
cd demo
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
# → API running at http://localhost:8000
# → Swagger docs at http://localhost:8000/docs
```

### 2. Run the Frontend

```bash
cd frontend
npm install
npm run dev
# → Dashboard at http://localhost:5173
```

---

## Key DevOps Deliverables

- **27 documented deliverables** in `DeepBlue-Complete-Solution.md`
- Multi-stage Docker builds for microservices
- Terraform modules for EKS, VPC, RDS, S3
- Kubernetes RBAC, NetworkPolicies, HPA, PDB
- GitOps with ArgoCD application manifests
- Prometheus alert rules + Alertmanager routing
- CIS-hardened EKS nodes via Ansible
- Zero-trust network policy enforcement

---

## Architecture Highlights

- **Event-driven ingestion** via Apache Kafka (MSK)
- **GitOps deployment** via ArgoCD watching this repository
- **Horizontal auto-scaling** on EKS with Karpenter
- **Zero-trust security** with OPA policies and Vault secrets
- **99.97% SLA** target with multi-AZ RDS and S3 cross-region replication
- **DR RTO < 4 hours, RPO < 1 hour**

---

## Author

**Saif** — B.Tech Final Year  
GitHub: [@Saif09inAction](https://github.com/Saif09inAction)
