output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnets" {
  value = module.vpc.public_subnets
}

output "private_subnets" {
  value = module.vpc.private_subnets
}

output "alb_dns" {
  description = "URL DNS del Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "waf_arn" {
  value = module.waf.waf_arn
}

output "nacl_public_id" {
  description = "ID del Network ACL público (Firewall de red)"
  value       = module.nacl.public_nacl_id
}

output "nacl_private_id" {
  description = "ID del Network ACL privado (Firewall de red)"
  value       = module.nacl.private_nacl_id
}

output "ec2_ids" {
  value = module.ec2_app.instance_ids
}

output "secret_arn" {
  description = "ARN del secret de AWS Secrets Manager"
  value       = module.secrets.secret_arn
  sensitive   = true
}

output "admin_login_url" {
  description = "URL para acceder al login administrativo"
  value       = "http://${module.alb.alb_dns_name}/admin-login"
}