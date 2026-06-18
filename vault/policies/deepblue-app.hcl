# ============================================================
# DeepBlue — Vault Application Policy
# Assigned to: API service, Ingestion service, Processing service
# ============================================================

# Database credentials (read-only — dynamic secrets)
path "database/creds/deepblue-api-role" {
  capabilities = ["read"]
}

path "database/creds/deepblue-ingestion-role" {
  capabilities = ["read"]
}

# AWS credentials for S3 access
path "aws/creds/deepblue-s3-role" {
  capabilities = ["read"]
}

# Application secrets (API keys, JWT secrets, etc.)
path "secret/data/deepblue/app/*" {
  capabilities = ["read"]
}

# Kafka credentials
path "secret/data/deepblue/kafka/*" {
  capabilities = ["read"]
}

# Redis credentials
path "secret/data/deepblue/redis" {
  capabilities = ["read"]
}

# PKI — Issue certificates for mTLS
path "pki_int/issue/deepblue-services" {
  capabilities = ["create", "update"]
}

# Renew own token
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Lookup own token
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# ── DENY sensitive paths ─────────────────────────────────────
path "secret/data/deepblue/admin/*" {
  capabilities = ["deny"]
}

path "sys/*" {
  capabilities = ["deny"]
}

path "auth/*" {
  capabilities = ["deny"]
}
