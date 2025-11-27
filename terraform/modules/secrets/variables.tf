variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "admin_username" {
  description = "Admin username for application"
  type        = string
  sensitive   = true
}

variable "admin_password" {
  description = "Admin password for application"
  type        = string
  sensitive   = true
}

variable "ec2_role_name" {
  description = "Name of the EC2 IAM role to attach the secrets policy"
  type        = string
}
