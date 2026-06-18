# DeepBlue – Oceanographic Research & Climate Intelligence Platform

> Enterprise-Grade DevOps Solution | Final Year B.Tech Project

---

## About the Project

DeepBlue is a full-stack cloud-native platform for real-time oceanographic monitoring and climate intelligence. It tracks data from 51+ sensors across 7 ocean basins, processes millions of events per day, and provides actionable insights through a modern web dashboard.

Built as part of my final-year B.Tech project to demonstrate end-to-end DevOps practices — from infrastructure as code to CI/CD automation, Kubernetes orchestration, observability, and secret management.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Cloud** | AWS (EKS, EC2, S3, RDS, Route53, CloudWatch, IAM, VPC, KMS) |
| **IaC** | Terraform, Ansible |
| **Containers** | Docker, Kubernetes (EKS), Helm |
| **CI/CD** | Jenkins (Jenkinsfile), GitHub Actions, ArgoCD (GitOps) |
| **Backend** | Python, FastAPI, Kafka, TimescaleDB, Redis |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, Recharts, Leaflet |
| **Monitoring** | Prometheus, Grafana (dashboard JSON), Alertmanager |
| **Logging** | ELK Stack (Elasticsearch, Logstash, Kibana, Filebeat) |
| **Secret Mgmt** | HashiCorp Vault (Raft HA, AWS KMS Auto-Unseal, Kubernetes Auth) |
| **Security** | OPA/Gatekeeper, Trivy, Falco, Network Policies |

---

## Project Structure

```
DeepBlue/
│
├── frontend/                            ← React dashboard (8 pages, live data)
│   └── src/pages/                       ← Dashboard, Map, Analytics, Alerts,
│                                           Research, Infrastructure, Architecture, Pipeline
│
├── demo/                                ← FastAPI simulation backend
│   └── main.py                          ← Live data simulation server
│
├── jenkins/                             ← Jenkins CI/CD
│   ├── Jenkinsfile                      ← 10-stage pipeline (lint→test→scan→build→deploy)
│   └── jenkins-config.yml               ← Jenkins Configuration as Code (JCasC)
│
├── .github/workflows/                   ← GitHub Actions pipelines
│   └── terraform-plan.yml               ← Terraform validate + plan + apply
│
├── terraform/                           ← AWS Infrastructure as Code
│   ├── modules/eks/                     ← EKS cluster module
│   └── environments/prod/              ← Production root config
│
├── kubernetes/                          ← K8s manifests
│   ├── deployments/api-service.yaml     ← Deployment + HPA + PDB
│   ├── namespaces/all-namespaces.yaml   ← ResourceQuota + LimitRange
│   ├── rbac/rbac.yaml                   ← ClusterRoles + Bindings
│   ├── network-policies/                ← Zero-trust NetworkPolicies
│   └── argocd/argocd-app-prod.yaml      ← GitOps application manifests
│
├── monitoring/                          ← Observability
│   ├── prometheus/prometheus.yml        ← Scrape configs
│   ├── prometheus/rules/                ← Alert rules
│   ├── alertmanager/alertmanager.yml    ← PagerDuty + Slack routing
│   └── grafana/
│       ├── dashboards/deepblue-overview.json  ← Pre-built Grafana dashboard
│       └── provisioning/                ← Auto-provisioning (datasources + dashboards)
│
├── elk/                                 ← ELK Stack (Logging)
│   ├── elasticsearch/elasticsearch.yml  ← Cluster config
│   ├── logstash/logstash.yml            ← Logstash config
│   ├── logstash/pipeline/deepblue.conf  ← Log parsing pipeline
│   ├── kibana/kibana.yml                ← Kibana config
│   └── filebeat/
│       ├── filebeat.yml                 ← Agent config
│       └── filebeat-daemonset.yaml      ← K8s DaemonSet
│
├── vault/                               ← Secret Management
│   ├── config/vault.hcl                 ← Vault server config (Raft HA + AWS KMS)
│   ├── policies/deepblue-app.hcl        ← App service policy
│   ├── policies/deepblue-admin.hcl      ← Admin policy
│   ├── policies/deepblue-readonly.hcl   ← Read-only policy
│   └── scripts/init-vault.sh            ← Full initialization runbook
│
├── ansible/                             ← Configuration Management
│   └── playbooks/harden-eks-nodes.yml   ← CIS benchmark hardening
│
├── Dockerfiles/                         ← Container builds
│   ├── api-service.Dockerfile           ← Multi-stage Python API
│   └── ingestion-service.Dockerfile     ← Multi-stage Python ingestion
│
├── docker-compose.yml                   ← Full local dev stack
│                                           (Postgres, Kafka, Redis, Prometheus,
│                                            Grafana, Elasticsearch, Logstash, Kibana, Vault)
│
├── docs/                                ← Documentation
│   ├── disaster-recovery-plan.md        ← RTO/RPO targets, runbooks, DR schedule
│   ├── deployment-diagram.md            ← Full Mermaid deployment diagrams
│   └── screenshots/                     ← Demonstration screenshots
│
└── DeepBlue-Complete-Solution.md        ← 27 deliverables, full architecture docs
```

---

## Deliverables Checklist

| # | Requirement | Status | Location |
|---|-------------|--------|----------|
| 1 | Working Application (Web App + API) | ✅ | `frontend/` + `demo/` |
| 2 | Source Code Repository (GitHub) | ✅ | [github.com/Saif09inAction/DeepBlue](https://github.com/Saif09inAction/DeepBlue) |
| 3 | Dockerfile and Docker Images | ✅ | `Dockerfiles/`, `docker-compose.yml` |
| 4 | Jenkins CI/CD Pipeline | ✅ | `jenkins/Jenkinsfile` (10 stages) |
| 5 | Terraform Infrastructure Scripts | ✅ | `terraform/` (EKS, VPC, RDS, S3) |
| 6 | Kubernetes Deployment Files | ✅ | `kubernetes/` (deployments, RBAC, HPA, ArgoCD) |
| 7 | Monitoring — Prometheus & Grafana | ✅ | `monitoring/` (alerts, dashboard JSON, provisioning) |
| 8 | Logging — ELK Stack | ✅ | `elk/` (ES, Logstash pipeline, Kibana, Filebeat DaemonSet) |
| 9 | Secret Management — Vault | ✅ | `vault/` (config, 3 policies, init script) |
| 10 | Architecture Diagram | ✅ | `docs/deployment-diagram.md` + `DeepBlue-Complete-Solution.md` |
| 11 | Deployment Diagram | ✅ | `docs/deployment-diagram.md` |
| 12 | Disaster Recovery Plan | ✅ | `docs/disaster-recovery-plan.md` |
| 13 | Demonstration Screenshots | ✅ | `docs/screenshots/` |
| 14 | Project Documentation | ✅ | `DeepBlue-Complete-Solution.md` (2677 lines, 27 sections) |

---

## Quick Start

### 1. Run the Demo Backend

```bash
cd demo
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
# → API at http://localhost:8000
# → Swagger UI at http://localhost:8000/docs
```

### 2. Run the Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
# → Dashboard at http://localhost:5173
```

### 3. Run Full Local Stack (Docker Compose)

```bash
# Start everything: Postgres, Kafka, Redis, Prometheus, Grafana, ELK, Vault
docker-compose up -d

# Access points:
# - Grafana:       http://localhost:3000   (admin / deepblue_grafana_dev)
# - Kibana:        http://localhost:5601
# - Elasticsearch: http://localhost:9200
# - Prometheus:    http://localhost:9090
# - Kafka UI:      http://localhost:8090
# - Vault UI:      http://localhost:8200
```

---

## Dashboard Pages

| # | Page | Description |
|---|------|-------------|
| 1 | **Executive Dashboard** | KPI cards, animated counters, live activity feed, real-time charts |
| 2 | **Live Ocean Map** | Interactive Leaflet map with 51+ real sensor markers across 7 basins |
| 3 | **Climate Analytics** | Temperature, CO₂, sea level, storm activity trends |
| 4 | **Alert Center** | Real-time alert management with search, filter, sort |
| 5 | **Research Data Center** | Dataset explorer with download management |
| 6 | **Infrastructure Monitoring** | Grafana-style K8s/pod/node health dashboard |
| 7 | **System Architecture** | Animated architecture flow diagram |
| 8 | **DevOps Pipeline** | Jenkins + ArgoCD CI/CD visualization |

---

## Author

**Saif Salmani** — B.Tech Final Year  
GitHub: [@Saif09inAction](https://github.com/Saif09inAction)
