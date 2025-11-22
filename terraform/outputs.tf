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

output "firewall_arn" {
  value = module.network_firewall.firewall_arn
}

output "ec2_ids" {
  value = module.ec2_app.instance_ids
}