################################################################################
# DeepBlue – Production Environment
# Root Terraform configuration orchestrating all infrastructure modules
################################################################################

terraform {
  required_version = ">= 1.8.0"

  backend "s3" {
    bucket         = "deepblue-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    kms_key_id     = "alias/deepblue-terraform-state"
    dynamodb_table = "deepblue-terraform-lock"
  }

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
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "dr_region"
  region = var.dr_region

  default_tags {
    tags = merge(local.common_tags, { Region = "dr" })
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  common_tags = {
    Project     = "deepblue"
    Environment = "prod"
    ManagedBy   = "terraform"
    CostCenter  = var.cost_center
    Owner       = "platform-team"
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# VPC
# ─────────────────────────────────────────────────────────────────────────────
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.8"

  name = "deepblue-prod-vpc"
  cidr = "10.0.0.0/16"

  azs              = slice(data.aws_availability_zones.available.names, 0, 3)
  public_subnets   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets  = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  enable_nat_gateway     = true
  one_nat_gateway_per_az = true
  enable_dns_hostnames   = true
  enable_dns_support     = true

  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true
  flow_log_retention_in_days           = 90

  public_subnet_tags = {
    "kubernetes.io/role/elb"                                                    = "1"
    "kubernetes.io/cluster/deepblue-prod-eks"                                   = "owned"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"                                           = "1"
    "kubernetes.io/cluster/deepblue-prod-eks"                                   = "owned"
    "karpenter.sh/discovery"                                                    = "deepblue-prod-eks"
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# EKS
# ─────────────────────────────────────────────────────────────────────────────
module "eks" {
  source = "../../modules/eks"

  project_name       = "deepblue"
  environment        = "prod"
  kubernetes_version = "1.29"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnets
  management_cidrs   = var.vpn_cidrs
  tags               = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# RDS – TimescaleDB
# ─────────────────────────────────────────────────────────────────────────────
module "rds" {
  source = "../../modules/rds"

  identifier        = "deepblue-prod-tsdb"
  environment       = "prod"
  vpc_id            = module.vpc.vpc_id
  subnet_group_name = module.vpc.database_subnet_group_name
  instance_class    = "db.r6g.4xlarge"
  tags              = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# MSK – Kafka
# ─────────────────────────────────────────────────────────────────────────────
module "msk" {
  source = "../../modules/msk"

  cluster_name       = "deepblue-prod"
  environment        = "prod"
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnets
  broker_instance    = "kafka.m5.4xlarge"
  broker_count       = 3
  kafka_version      = "3.6.0"
  storage_per_broker = 2000
  tags               = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# ElastiCache – Redis
# ─────────────────────────────────────────────────────────────────────────────
module "elasticache" {
  source = "../../modules/elasticache"

  cluster_id         = "deepblue-prod"
  environment        = "prod"
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnets
  node_type          = "cache.r7g.xlarge"
  num_cache_clusters = 3
  tags               = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# S3 Buckets
# ─────────────────────────────────────────────────────────────────────────────
module "s3" {
  source = "../../modules/s3"

  project_name = "deepblue"
  environment  = "prod"
  dr_region    = var.dr_region
  tags         = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# Route 53 + ACM
# ─────────────────────────────────────────────────────────────────────────────
module "dns" {
  source = "../../global/route53"

  domain_name          = var.domain_name
  eks_alb_dns_name     = module.eks.alb_dns_name
  eks_dr_alb_dns_name  = var.dr_alb_dns_name
  tags                 = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# CloudFront
# ─────────────────────────────────────────────────────────────────────────────
module "cloudfront" {
  source = "../../global/cloudfront"

  domain_name      = var.domain_name
  alb_dns_name     = module.dns.alb_alias
  acm_cert_arn     = module.dns.acm_certificate_arn
  s3_static_bucket = module.s3.portal_bucket_regional_domain
  tags             = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# AWS WAF
# ─────────────────────────────────────────────────────────────────────────────
module "waf" {
  source = "../../modules/waf"

  name         = "deepblue-prod-waf"
  alb_arn      = module.eks.alb_arn
  environment  = "prod"
  tags         = local.common_tags
}
