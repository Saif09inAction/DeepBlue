################################################################################
# DeepBlue – EKS Cluster Module
# Provisions a production-grade Amazon EKS cluster with managed node groups,
# cluster add-ons, IRSA roles, and Karpenter for node autoscaling.
################################################################################

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
  }
}

locals {
  cluster_name = "${var.project_name}-${var.environment}-eks"

  common_tags = merge(var.tags, {
    "kubernetes.io/cluster/${local.cluster_name}" = "owned"
    "karpenter.sh/discovery"                      = local.cluster_name
  })
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# ─────────────────────────────────────────────────────────────────────────────
# EKS Cluster
# ─────────────────────────────────────────────────────────────────────────────
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.8"

  cluster_name    = local.cluster_name
  cluster_version = var.kubernetes_version

  # API server endpoint access – private only in production
  cluster_endpoint_public_access       = var.environment != "prod"
  cluster_endpoint_private_access      = true
  cluster_endpoint_public_access_cidrs = var.management_cidrs

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids

  # Enable envelope encryption for Kubernetes secrets
  cluster_encryption_config = {
    provider_key_arn = aws_kms_key.eks_secrets.arn
    resources        = ["secrets"]
  }

  # Cluster log types sent to CloudWatch
  cluster_enabled_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  cluster_addons = {
    coredns = {
      most_recent                 = true
      resolve_conflicts_on_update = "OVERWRITE"
    }
    kube-proxy = {
      most_recent                 = true
      resolve_conflicts_on_update = "OVERWRITE"
    }
    vpc-cni = {
      most_recent                 = true
      resolve_conflicts_on_update = "OVERWRITE"
      service_account_role_arn    = module.vpc_cni_irsa.iam_role_arn
      configuration_values = jsonencode({
        env = {
          ENABLE_PREFIX_DELEGATION = "true"
          WARM_PREFIX_TARGET       = "1"
        }
      })
    }
    aws-ebs-csi-driver = {
      most_recent              = true
      service_account_role_arn = module.ebs_csi_irsa.iam_role_arn
    }
    aws-efs-csi-driver = {
      most_recent              = true
      service_account_role_arn = module.efs_csi_irsa.iam_role_arn
    }
    aws-guardduty-agent = {
      most_recent = true
    }
  }

  # ── Managed Node Groups ────────────────────────────────────────────────────
  eks_managed_node_groups = {

    # System – core cluster components (monitoring, ArgoCD, cert-manager)
    system = {
      name            = "system"
      use_name_prefix = true

      instance_types = ["m6i.large", "m6a.large", "m7i.large"]
      capacity_type  = "ON_DEMAND"

      min_size     = 3
      max_size     = 6
      desired_size = 3

      disk_size = 50
      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = 50
            volume_type           = "gp3"
            encrypted             = true
            kms_key_id            = aws_kms_key.eks_ebs.arn
            delete_on_termination = true
          }
        }
      }

      labels = {
        "node-group"                    = "system"
        "node.kubernetes.io/node-group" = "system"
      }

      taints = [
        {
          key    = "CriticalAddonsOnly"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]

      iam_role_additional_policies = {
        AmazonSSMManagedInstanceCore = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
      }
    }

    # Ingestion – Kafka consumer pods (Spot for cost efficiency)
    ingestion = {
      name           = "ingestion"
      instance_types = ["c6i.2xlarge", "c6a.2xlarge", "c7i.2xlarge", "c7a.2xlarge"]
      capacity_type  = "SPOT"

      min_size     = 3
      max_size     = 20
      desired_size = 3

      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = 100
            volume_type           = "gp3"
            iops                  = 3000
            throughput            = 125
            encrypted             = true
            kms_key_id            = aws_kms_key.eks_ebs.arn
            delete_on_termination = true
          }
        }
      }

      labels = {
        "node-group"    = "ingestion"
        "workload-type" = "ingestion"
      }
    }

    # Processing – memory-heavy ETL and Flink workloads
    processing = {
      name           = "processing"
      instance_types = ["r6i.4xlarge", "r6a.4xlarge", "r7i.4xlarge"]
      capacity_type  = "SPOT"

      min_size     = 2
      max_size     = 15
      desired_size = 3

      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = 200
            volume_type           = "gp3"
            iops                  = 6000
            throughput            = 250
            encrypted             = true
            kms_key_id            = aws_kms_key.eks_ebs.arn
            delete_on_termination = true
          }
        }
      }

      labels = {
        "node-group"    = "processing"
        "workload-type" = "data-processing"
      }
    }

    # API – stateless API pods (On-Demand for stable latency)
    api = {
      name           = "api"
      instance_types = ["c6i.xlarge", "c6a.xlarge", "c7i.xlarge"]
      capacity_type  = "ON_DEMAND"

      min_size     = 3
      max_size     = 30
      desired_size = 5

      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = 50
            volume_type           = "gp3"
            encrypted             = true
            kms_key_id            = aws_kms_key.eks_ebs.arn
            delete_on_termination = true
          }
        }
      }

      labels = {
        "node-group"    = "api"
        "workload-type" = "api-serving"
      }
    }

    # GPU – ML anomaly detection (scale-to-zero when idle)
    gpu = {
      name           = "gpu"
      instance_types = ["g4dn.xlarge", "g5.xlarge"]
      capacity_type  = "SPOT"
      ami_type       = "AL2_x86_64_GPU"

      min_size     = 0
      max_size     = 5
      desired_size = 0

      labels = {
        "node-group"                = "gpu"
        "nvidia.com/gpu.present"    = "true"
        "workload-type"             = "ml-inference"
      }

      taints = [
        {
          key    = "nvidia.com/gpu"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]
    }

    # Research – JupyterHub persistent notebook kernels
    research = {
      name           = "research"
      instance_types = ["r6i.2xlarge", "r6a.2xlarge"]
      capacity_type  = "ON_DEMAND"

      min_size     = 2
      max_size     = 10
      desired_size = 2

      labels = {
        "node-group"    = "research"
        "workload-type" = "interactive-research"
      }
    }
  }

  # ── aws-auth ConfigMap ─────────────────────────────────────────────────────
  manage_aws_auth_configmap = true

  aws_auth_roles = [
    {
      rolearn  = module.karpenter.role_arn
      username = "system:node:{{EC2PrivateDNSName}}"
      groups   = ["system:bootstrappers", "system:nodes"]
    },
    {
      rolearn  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.project_name}-cicd-role"
      username = "${var.project_name}-cicd"
      groups   = ["deepblue-deployers"]
    },
  ]

  tags = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# KMS Keys
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_kms_key" "eks_secrets" {
  description             = "EKS secrets encryption key for ${local.cluster_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = var.tags
}

resource "aws_kms_alias" "eks_secrets" {
  name          = "alias/${local.cluster_name}-secrets"
  target_key_id = aws_kms_key.eks_secrets.key_id
}

resource "aws_kms_key" "eks_ebs" {
  description             = "EKS EBS volume encryption for ${local.cluster_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = var.tags
}

resource "aws_kms_alias" "eks_ebs" {
  name          = "alias/${local.cluster_name}-ebs"
  target_key_id = aws_kms_key.eks_ebs.key_id
}

# ─────────────────────────────────────────────────────────────────────────────
# IRSA – IAM Roles for Service Accounts
# ─────────────────────────────────────────────────────────────────────────────
module "vpc_cni_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.39"

  role_name             = "${local.cluster_name}-vpc-cni"
  attach_vpc_cni_policy = true
  vpc_cni_enable_ipv4   = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-node"]
    }
  }
  tags = var.tags
}

module "ebs_csi_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.39"

  role_name             = "${local.cluster_name}-ebs-csi"
  attach_ebs_csi_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:ebs-csi-controller-sa"]
    }
  }
  tags = var.tags
}

module "efs_csi_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.39"

  role_name             = "${local.cluster_name}-efs-csi"
  attach_efs_csi_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:efs-csi-controller-sa"]
    }
  }
  tags = var.tags
}

# ─────────────────────────────────────────────────────────────────────────────
# Karpenter – Node Autoscaler
# ─────────────────────────────────────────────────────────────────────────────
module "karpenter" {
  source  = "terraform-aws-modules/eks/aws//modules/karpenter"
  version = "~> 20.8"

  cluster_name          = module.eks.cluster_name
  irsa_oidc_provider_arn = module.eks.oidc_provider_arn

  node_iam_role_additional_policies = {
    AmazonSSMManagedInstanceCore = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  }

  tags = var.tags
}

resource "helm_release" "karpenter" {
  namespace        = "kube-system"
  name             = "karpenter"
  repository       = "oci://public.ecr.aws/karpenter"
  chart            = "karpenter"
  version          = var.karpenter_version
  create_namespace = false
  wait             = true
  timeout          = 300

  set {
    name  = "settings.clusterName"
    value = module.eks.cluster_name
  }
  set {
    name  = "settings.clusterEndpoint"
    value = module.eks.cluster_endpoint
  }
  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.karpenter.iam_role_arn
  }

  depends_on = [module.eks]
}
