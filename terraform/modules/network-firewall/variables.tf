variable "vpc_id" {
  type = string
}

variable "private_subnets" {
  type = list(string)
}

variable "project_name" {
  type = string
}