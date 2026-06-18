# ============================================================
# DeepBlue — Vault Read-Only Policy
# Assigned to: Monitoring agents, Read-only pipeline stages
# ============================================================

# Read application secrets only
path "secret/data/deepblue/app/*" {
  capabilities = ["read"]
}

# Read Kafka config
path "secret/data/deepblue/kafka/*" {
  capabilities = ["read"]
}

# List available secrets (but not read values)
path "secret/metadata/deepblue/*" {
  capabilities = ["list"]
}

# Renew own token
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}
