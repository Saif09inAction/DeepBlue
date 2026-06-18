#!/usr/bin/env bash
# ============================================================
# DeepBlue — Vault Initialization & Configuration Script
# Run once after Vault is first deployed to EKS
# ============================================================
set -euo pipefail

VAULT_ADDR="${VAULT_ADDR:-https://vault.deepblue-security.svc.cluster.local:8200}"
export VAULT_ADDR

echo "╔══════════════════════════════════════════════════════╗"
echo "║  DeepBlue Vault Initialization                        ║"
echo "║  Target: ${VAULT_ADDR}                                ║"
echo "╚══════════════════════════════════════════════════════╝"

# ── Wait for Vault to be ready ────────────────────────────────
echo "[1/10] Waiting for Vault to be ready..."
until vault status 2>/dev/null | grep -q "Initialized"; do
  sleep 2
done

# ── Initialize Vault (AWS KMS auto-unseal) ────────────────────
if ! vault status | grep -q "Initialized.*true"; then
  echo "[2/10] Initializing Vault..."
  vault operator init \
    -recovery-shares=5 \
    -recovery-threshold=3 \
    -format=json > /tmp/vault-init.json

  VAULT_TOKEN=$(cat /tmp/vault-init.json | jq -r '.root_token')
  export VAULT_TOKEN
  echo "       Root token saved. Store recovery keys securely!"
  echo "       Recovery keys: $(cat /tmp/vault-init.json | jq '.recovery_keys_b64')"
else
  echo "[2/10] Vault already initialized. Using VAULT_TOKEN from environment."
fi

# ── Enable Audit Logging ──────────────────────────────────────
echo "[3/10] Enabling audit log..."
vault audit enable file path=/vault/audit/audit.log || echo "       Audit log already enabled."

# ── Enable Secret Engines ─────────────────────────────────────
echo "[4/10] Enabling secret engines..."
vault secrets enable -path=secret kv-v2                    || echo "       kv-v2 already enabled"
vault secrets enable database                              || echo "       database already enabled"
vault secrets enable aws                                   || echo "       aws already enabled"
vault secrets enable -path=pki     pki                    || echo "       pki already enabled"
vault secrets enable -path=pki_int pki                    || echo "       pki_int already enabled"

# ── Configure Database Secret Engine ─────────────────────────
echo "[5/10] Configuring dynamic database credentials..."
vault write database/config/deepblue-timescaledb \
  plugin_name="postgresql-database-plugin" \
  allowed_roles="deepblue-api-role,deepblue-ingestion-role" \
  connection_url="postgresql://{{username}}:{{password}}@timescaledb.deepblue-api.svc.cluster.local:5432/deepblue?sslmode=require" \
  username="${DB_ADMIN_USER}" \
  password="${DB_ADMIN_PASSWORD}"

vault write database/roles/deepblue-api-role \
  db_name="deepblue-timescaledb" \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

vault write database/roles/deepblue-ingestion-role \
  db_name="deepblue-timescaledb" \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT INSERT ON sensor_readings, alert_events TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# ── Store Application Secrets ─────────────────────────────────
echo "[6/10] Storing application secrets..."
vault kv put secret/deepblue/app/api \
  jwt_secret="${JWT_SECRET}" \
  api_key_salt="${API_KEY_SALT}" \
  session_secret="${SESSION_SECRET}"

vault kv put secret/deepblue/kafka \
  bootstrap_servers="kafka.deepblue-ingestion.svc.cluster.local:9092" \
  username="${KAFKA_USER}" \
  password="${KAFKA_PASSWORD}" \
  ssl_ca_cert_path="/etc/kafka/certs/ca.crt"

vault kv put secret/deepblue/redis \
  host="redis.deepblue-api.svc.cluster.local" \
  port="6379" \
  password="${REDIS_PASSWORD}"

vault kv put secret/deepblue/admin/grafana \
  admin_user="admin" \
  admin_password="${GRAFANA_ADMIN_PASSWORD}"

# ── Write Vault Policies ──────────────────────────────────────
echo "[7/10] Writing access policies..."
vault policy write deepblue-app      /vault/policies/deepblue-app.hcl
vault policy write deepblue-admin    /vault/policies/deepblue-admin.hcl
vault policy write deepblue-readonly /vault/policies/deepblue-readonly.hcl

# ── Enable Kubernetes Auth ────────────────────────────────────
echo "[8/10] Enabling Kubernetes authentication..."
vault auth enable kubernetes || echo "       kubernetes auth already enabled"

vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token

# Bind service accounts to policies
for ns in deepblue-api deepblue-ingestion deepblue-processing; do
  vault write auth/kubernetes/role/deepblue-app-${ns} \
    bound_service_account_names="deepblue-api-sa,deepblue-ingestion-sa" \
    bound_service_account_namespaces="${ns}" \
    policies="deepblue-app" \
    ttl="1h"
done

vault write auth/kubernetes/role/deepblue-admin \
  bound_service_account_names="vault-admin-sa" \
  bound_service_account_namespaces="deepblue-security" \
  policies="deepblue-admin" \
  ttl="4h"

# ── Configure PKI Certificate Authority ──────────────────────
echo "[9/10] Configuring PKI / mTLS certificates..."
vault write pki/root/generate/internal \
  common_name="deepblue-root-ca" \
  ttl="87600h" \
  key_bits=4096

vault write pki/config/urls \
  issuing_certificates="${VAULT_ADDR}/v1/pki/ca" \
  crl_distribution_points="${VAULT_ADDR}/v1/pki/crl"

vault write pki_int/intermediate/generate/internal \
  common_name="deepblue-intermediate-ca" \
  key_bits=2048 > /tmp/pki_int_csr.json

vault write -format=json pki/root/sign-intermediate \
  csr=$(cat /tmp/pki_int_csr.json | jq -r '.data.csr') \
  format=pem_bundle \
  ttl="43800h" > /tmp/pki_int_cert.json

vault write pki_int/intermediate/set-signed \
  certificate=$(cat /tmp/pki_int_cert.json | jq -r '.data.certificate')

vault write pki_int/roles/deepblue-services \
  allowed_domains="deepblue-api.svc.cluster.local,deepblue-ingestion.svc.cluster.local" \
  allow_subdomains=true \
  max_ttl="72h"

# ── Revoke Root Token ────────────────────────────────────────
echo "[10/10] Revoking root token (use recovery keys for break-glass)..."
vault token revoke -self
echo ""
echo "✅ Vault initialization complete!"
echo "   Access UI at: ${VAULT_ADDR}/ui"
echo "   Recovery keys are stored in: /tmp/vault-init.json"
echo "   ⚠️  Move recovery keys to a secure offline location NOW!"
