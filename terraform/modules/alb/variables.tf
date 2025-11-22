variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "public_subnets" {
  description = "Lista de subredes públicas"
  type        = list(string)
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
}