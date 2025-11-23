variable "project_name" {
  default = "web-sec-aws"
}

variable "region" {
  default = "us-east-1"
}

variable "instance_type" {
  description = "Tipo de instancia EC2"
  default     = "t3.micro"
}