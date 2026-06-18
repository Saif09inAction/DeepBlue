# DeepBlue — Disaster Recovery Plan

**Document Version:** 2.0  
**Author:** Saif Salmani  
**Last Updated:** June 2026  
**Classification:** Internal — DevOps Team

---

## 1. Overview

This document defines the Disaster Recovery (DR) strategy for the DeepBlue Oceanographic Research & Climate Intelligence Platform. It covers failure scenarios, recovery objectives, runbook procedures, and testing schedules.

### Recovery Objectives

| Metric | Target | Current Baseline |
|--------|--------|-----------------|
| **RTO** (Recovery Time Objective)  | < 4 hours  | 2.5 hours avg |
| **RPO** (Recovery Point Objective) | < 1 hour   | 15 minutes avg |
| **MTTR** (Mean Time to Restore)    | < 30 min   | 18 minutes avg |
| **SLA Availability**               | 99.95%     | 99.97% achieved |

---

## 2. Architecture Overview (DR Perspective)

```
PRIMARY REGION (us-east-1)                SECONDARY REGION (eu-west-1)
┌─────────────────────────────────┐       ┌──────────────────────────────┐
│  EKS Cluster (3 AZs)            │       │  EKS Cluster (standby)       │
│  ├── deepblue-api (5 pods)       │  ──▶  │  ├── deepblue-api (2 pods)   │
│  ├── deepblue-ingestion (5 pods) │       │  └── deepblue-ingestion (2)  │
│  └── deepblue-processing (3)     │       │                              │
│                                  │       │  RDS Multi-AZ (replica)      │
│  RDS TimescaleDB (Multi-AZ)      │  ══▶  │  ├── Sync replication        │
│  ├── Primary (us-east-1a)        │       │  └── RPO: ~15 seconds        │
│  └── Standby (us-east-1b)        │       │                              │
│                                  │       │  S3 Cross-Region Replication │
│  S3 (raw-data, models, backups)  │  ──▶  │  └── deepblue-dr-eu-west-1   │
│  MSK Kafka (3 brokers, 3 AZs)   │       │                              │
│  ElastiCache Redis (3 shards)    │       │  Route 53 Health Checks      │
│                                  │       │  └── Failover in < 60s       │
└─────────────────────────────────┘       └──────────────────────────────┘
```

---

## 3. Disaster Scenarios & Response Matrix

| Scenario | Severity | Auto-Recover | RTO | RPO | Owner |
|----------|----------|-------------|-----|-----|-------|
| Single Pod Failure | Low | ✅ Yes (K8s restarts) | < 30 sec | 0 | Kubernetes |
| Node Failure | Low | ✅ Yes (Karpenter replaces) | < 5 min | 0 | Karpenter |
| AZ Outage | Medium | ✅ Yes (Multi-AZ failover) | < 10 min | < 1 min | AWS / EKS |
| RDS Primary Failure | Medium | ✅ Yes (Multi-AZ standby) | < 2 min | < 30 sec | AWS RDS |
| EKS Cluster Failure | High | ❌ Manual | < 2 hrs | < 15 min | DevOps |
| Full Region Failure | Critical | ❌ Manual | < 4 hrs | < 1 hr | DevOps |
| Data Corruption | Critical | ❌ Manual | < 6 hrs | Backup age | DevOps |
| Ransomware / Security | Critical | ❌ Manual | < 8 hrs | Backup age | Security |
| Kafka Cluster Failure | High | ⚠️ Semi-auto | < 30 min | < 5 min | DevOps |

---

## 4. Backup Strategy

### 4.1 Database (RDS TimescaleDB)

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Automated snapshots | Daily | 35 days | AWS RDS → S3 |
| Manual snapshots | Before major releases | 90 days | S3 `deepblue-db-backups` |
| Point-in-time recovery | Continuous (WAL logs) | 35 days | RDS managed |
| Cross-region copy | Daily | 30 days | S3 eu-west-1 |

**Restore test:** Monthly — restore to a new RDS instance and verify row counts.

### 4.2 Object Storage (S3)

| Bucket | Versioning | Cross-Region | Glacier Transition |
|--------|-----------|-------------|-------------------|
| `deepblue-raw-data` | ✅ Enabled | ✅ → eu-west-1 | After 90 days |
| `deepblue-processed` | ✅ Enabled | ✅ → eu-west-1 | After 60 days |
| `deepblue-ml-models` | ✅ Enabled | ✅ → eu-west-1 | After 365 days |
| `deepblue-tf-state` | ✅ Enabled | ✅ → eu-west-1 | Never |

### 4.3 Kafka (MSK)

- **Replication Factor:** 3 (across 3 AZs)
- **Min In-Sync Replicas:** 2
- **Retention:** 7 days (raw topics), 30 days (processed topics)
- **Backup:** Kafka MirrorMaker 2 to secondary MSK cluster in eu-west-1

### 4.4 Configuration & Secrets

- All Terraform state: S3 with versioning + DynamoDB locking
- Vault data: Raft storage with automated snapshots every 6 hours → S3
- Kubernetes manifests: GitOps via ArgoCD (GitHub as source of truth)
- All secrets in Vault — NOT in Git

---

## 5. Runbooks

### 5.1 Single Service Recovery

```bash
# Check pod status
kubectl get pods -n deepblue-api

# Force restart a deployment
kubectl rollout restart deployment/api-service -n deepblue-api

# Roll back to previous image
kubectl rollout undo deployment/api-service -n deepblue-api

# Verify rollback
kubectl rollout status deployment/api-service -n deepblue-api
```

### 5.2 RDS Failover (Manual)

```bash
# Trigger a manual Multi-AZ failover
aws rds reboot-db-instance \
  --db-instance-identifier deepblue-timescaledb-prod \
  --force-failover \
  --region us-east-1

# Monitor failover progress
aws rds describe-events \
  --source-type db-instance \
  --source-identifier deepblue-timescaledb-prod \
  --duration 60

# Verify new endpoint
aws rds describe-db-instances \
  --db-instance-identifier deepblue-timescaledb-prod \
  --query 'DBInstances[0].Endpoint.Address'
```

### 5.3 EKS Cluster Recovery

```bash
# Step 1: Restore Terraform state and rebuild cluster
cd terraform/environments/prod
terraform init
terraform apply -target=module.eks -auto-approve

# Step 2: Update kubeconfig
aws eks update-kubeconfig \
  --name deepblue-prod-eks \
  --region us-east-1

# Step 3: Restore namespaces and RBAC
kubectl apply -f kubernetes/namespaces/all-namespaces.yaml
kubectl apply -f kubernetes/rbac/rbac.yaml
kubectl apply -f kubernetes/network-policies/

# Step 4: Deploy ArgoCD (GitOps will recover all applications)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Step 5: Apply ArgoCD application manifests
kubectl apply -f kubernetes/argocd/argocd-app-prod.yaml

# Step 6: ArgoCD syncs everything from Git automatically
# Monitor at: https://argocd.deepblue.oceanresearch.io
```

### 5.4 Full Region Failover to eu-west-1

```bash
# Step 1: Promote RDS read replica in eu-west-1
aws rds promote-read-replica \
  --db-instance-identifier deepblue-timescaledb-prod-eu-replica \
  --region eu-west-1

# Step 2: Update Route 53 to point to eu-west-1
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://dns-failover-eu.json

# Step 3: Scale up EKS in eu-west-1
cd terraform/environments/dr-eu-west-1
terraform apply -auto-approve

# Step 4: Restore Vault from snapshot
vault operator raft snapshot restore /backup/vault-latest.snap

# Step 5: Update application config to point to eu-west-1 resources
kubectl set env deployment/api-service \
  DB_HOST=deepblue-timescaledb-prod-eu-replica.eu-west-1.rds.amazonaws.com \
  -n deepblue-api

# Step 6: Verify all services healthy
kubectl get pods --all-namespaces | grep -v Running
```

### 5.5 Data Corruption Recovery

```bash
# Step 1: Stop ingestion to prevent further corruption
kubectl scale deployment/ingestion-service --replicas=0 -n deepblue-ingestion

# Step 2: Restore from last known-good RDS snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier deepblue-restored \
  --db-snapshot-identifier deepblue-snapshot-$(date -d "yesterday" +%Y-%m-%d) \
  --region us-east-1

# Step 3: Verify data integrity
psql -h $NEW_DB_HOST -U deepblue_admin -d deepblue -c "
  SELECT COUNT(*) FROM sensor_readings WHERE created_at > NOW() - INTERVAL '24 hours';
  SELECT COUNT(*) FROM alert_events;
"

# Step 4: Rename and promote restored instance
aws rds modify-db-instance \
  --db-instance-identifier deepblue-restored \
  --new-db-instance-identifier deepblue-timescaledb-prod \
  --apply-immediately

# Step 5: Resume ingestion
kubectl scale deployment/ingestion-service --replicas=5 -n deepblue-ingestion
```

---

## 6. Monitoring & Alerts for DR Triggers

The following Prometheus/Alertmanager alerts automatically page on-call engineers:

| Alert | Threshold | Action |
|-------|-----------|--------|
| `DeepBluePodCrashLooping` | > 5 restarts/5m | Auto-scale + notify |
| `DeepBlueAPIHighErrorRate` | > 5% errors/5m | Page P1 |
| `DeepBlueRDSReplicationLag` | > 60 seconds | Page P1 |
| `DeepBlueKafkaConsumerLagHigh` | > 100K messages | Page P2 |
| `DeepBlueS3ReplicationFailed` | Any failure | Page P2 |
| `DeepBlueNodeNotReady` | > 2 nodes | Page P1 |

---

## 7. DR Testing Schedule

| Test | Frequency | Method | Owner |
|------|-----------|--------|-------|
| Pod failure simulation | Weekly | `kubectl delete pod` | Platform Team |
| Node drain test | Monthly | `kubectl drain` | DevOps |
| RDS failover drill | Quarterly | `reboot --force-failover` | DevOps |
| Full region failover | Semi-annually | Full runbook 5.4 | DevOps + Management |
| Backup restore validation | Monthly | Restore to test env | DevOps |
| Vault unseal test | Quarterly | Simulate restart | Security |

---

## 8. Communication Plan

| Phase | Action | Who | Channel |
|-------|--------|-----|---------|
| Incident detected | Page on-call | PagerDuty | Auto |
| P1 declared | War room started | Incident Commander | Slack `#deepblue-incidents` |
| Stakeholders informed | Status page updated | DevOps Lead | status.deepblue.io |
| During incident | Updates every 30 min | Incident Commander | Email + Slack |
| Post-recovery | Incident report within 48h | DevOps Lead | Confluence |

**On-Call Rotation:** 24/7 via PagerDuty  
**Escalation Path:** L1 (On-call Dev) → L2 (DevOps Lead) → L3 (CTO)

---

## 9. Contact Directory

| Role | Name | Email | PagerDuty |
|------|------|-------|-----------|
| DevOps Lead | Saif Salmani | saif@deepblue.oceanresearch.io | @saif-salmani |
| Platform Oncall | Rotating | oncall@deepblue.oceanresearch.io | deepblue-oncall |
| AWS TAM | — | aws-support@deepblue.io | — |
| Database Admin | DBA Team | dba@deepblue.oceanresearch.io | deepblue-dba |

---

*This document is reviewed quarterly and updated after every DR drill or major incident.*
