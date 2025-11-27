# Network ACL para subnets públicas
resource "aws_network_acl" "public" {
  vpc_id     = var.vpc_id
  subnet_ids = var.public_subnets

  # Regla de entrada para bloquear otros accesos desde rangos IP sospechosas
  ingress {
    protocol   = -1
    rule_no    = 90
    action     = "deny"
    cidr_block = "186.65.53.193/32"
    from_port  = 0
    to_port    = 0
  }

  # Regla de entrada para permitir HTTP
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Regla de entrada para permitir HTTPS
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Regla de entrada para permitir respuestas ephemeral ports
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Regla de salida: Permitir todo el tráfico saliente
  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name    = "${var.project_name}-public-nacl"
    Project = var.project_name
  }
}

# Network ACL para subnets privadas
resource "aws_network_acl" "private" {
  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnets

  # Regla de entrada: Permitir tráfico desde VPC
  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  # Regla de entrada: Permitir respuestas de internet (ephemeral ports)
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Regla de entrada: Bloquear SSH desde internet
  ingress {
    protocol   = "tcp"
    rule_no    = 90
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }

  # Regla de salida: Permitir tráfico hacia la VPC
  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  # Regla de salida: Permitir DNS (UDP 53)
  egress {
    protocol   = "udp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 53
    to_port    = 53
  }

  # Regla de salida: Permitir HTTPS (443) para actualizaciones
  egress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Regla de salida: Permitir HTTP (80) para repositorios
  egress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Regla de salida: Permitir ephemeral ports para respuestas
  egress {
    protocol   = "tcp"
    rule_no    = 140
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  tags = {
    Name    = "${var.project_name}-private-nacl"
    Project = var.project_name
  }
}
