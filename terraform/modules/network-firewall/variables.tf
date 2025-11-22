variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "private_subnets" {
  description = "Lista de subredes privadas"
  type        = list(string)
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
}