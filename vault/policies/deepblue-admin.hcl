# ============================================================
# DeepBlue — Vault Admin Policy
# Assigned to: DevOps team members, CI/CD pipeline
# ============================================================

# Full access to DeepBlue secret paths
path "secret/data/deepblue/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/deepblue/*" {
  capabilities = ["list", "read", "delete"]
}

# Database secret engine management
path "database/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# AWS secret engine management
path "aws/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# PKI management
path "pki/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "pki_int/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Policy management
path "sys/policies/acl/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Auth method management
path "sys/auth/*" {
  capabilities = ["create", "read", "update", "delete", "sudo"]
}

# Kubernetes auth role management
path "auth/kubernetes/role/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Audit logging
path "sys/audit/*" {
  capabilities = ["read", "list"]
}

# Mount management
path "sys/mounts/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Token management
path "auth/token/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
