variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "public_subnets" {
  description = "IDs de las subnets públicas"
  type        = list(string)
}

variable "private_subnets" {
  description = "IDs de las subnets privadas"
  type        = list(string)
}

variable "vpc_cidr" {
  description = "CIDR block de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
}
