module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  region       = var.region
}

module "alb" {
  source        = "./modules/alb"
  vpc_id        = module.vpc.vpc_id
  public_subnets = module.vpc.public_subnets
  project_name  = var.project_name
}

module "waf" {
  source       = "./modules/waf"
  alb_arn      = module.alb.alb_arn
  project_name = var.project_name
}

# Network ACLs - Firewall de red a nivel de subnet
module "nacl" {
  source          = "./modules/nacl"
  vpc_id          = module.vpc.vpc_id
  vpc_cidr        = module.vpc.vpc_cidr
  public_subnets  = module.vpc.public_subnets
  private_subnets = module.vpc.private_subnets
  project_name    = var.project_name
}

module "ec2_app" {
  source          = "./modules/ec2"
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.public_subnets  # Usar subnets públicas para acceso directo
  alb_sg_id       = module.alb.sg_alb
  project_name    = var.project_name
  target_group_arn = module.alb.target_group_arn
}

module "secrets" {
  source          = "./modules/secrets"
  project_name    = var.project_name
  admin_username  = var.admin_username
  admin_password  = var.admin_password
  ec2_role_name   = module.ec2_app.ec2_role_name
}