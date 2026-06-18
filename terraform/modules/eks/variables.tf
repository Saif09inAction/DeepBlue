variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
  default     = "deepblue"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "kubernetes_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.29"
}

variable "vpc_id" {
  description = "VPC ID where the EKS cluster will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for EKS worker nodes"
  type        = list(string)
}

variable "management_cidrs" {
  description = "CIDR blocks allowed to access the public API endpoint"
  type        = list(string)
  default     = []
}

variable "karpenter_version" {
  description = "Helm chart version for Karpenter"
  type        = string
  default     = "0.36.2"
}

variable "tags" {
  description = "Map of tags to apply to all resources"
  type        = map(string)
  default     = {}
}
