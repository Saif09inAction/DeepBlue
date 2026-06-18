# ============================================================
# DeepBlue — HashiCorp Vault Configuration
# Role: Secret management for all platform credentials
# ============================================================

# ── Storage Backend ──────────────────────────────────────────
storage "raft" {
  path    = "/vault/data"
  node_id = "vault-node-1"

  retry_join {
    leader_api_addr = "https://vault-0.vault-internal:8200"
  }
  retry_join {
    leader_api_addr = "https://vault-1.vault-internal:8200"
  }
  retry_join {
    leader_api_addr = "https://vault-2.vault-internal:8200"
  }
}

# ── Listener ─────────────────────────────────────────────────
listener "tcp" {
  address            = "0.0.0.0:8200"
  tls_cert_file      = "/vault/tls/vault.crt"
  tls_key_file       = "/vault/tls/vault.key"
  tls_client_ca_file = "/vault/tls/ca.crt"
  tls_min_version    = "tls12"

  # Telemetry endpoint (no auth required)
  telemetry {
    unauthenticated_metrics_access = true
  }
}

# ── AWS Auto-Unseal ───────────────────────────────────────────
seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/deepblue-vault-unseal"
}

# ── API & Cluster ────────────────────────────────────────────
api_addr     = "https://vault.deepblue-security.svc.cluster.local:8200"
cluster_addr = "https://vault.deepblue-security.svc.cluster.local:8201"
cluster_name = "deepblue-vault"

# ── UI ───────────────────────────────────────────────────────
ui = true

# ── Audit Logging ────────────────────────────────────────────
# Enabled after init — see init-vault.sh
# audit log path: /vault/audit/audit.log

# ── Telemetry ────────────────────────────────────────────────
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname          = true
}

# ── Performance ──────────────────────────────────────────────
max_lease_ttl         = "768h"   # 32 days
default_lease_ttl     = "768h"
raw_storage_endpoint  = false
introspection_endpoint = false
