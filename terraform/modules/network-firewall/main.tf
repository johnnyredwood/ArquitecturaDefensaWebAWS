# Firewall Policy MÍNIMA
resource "aws_networkfirewall_firewall_policy" "main" {
  name = "${var.project_name}-firewall-policy"

  firewall_policy {
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]
  }

  tags = {
    Name    = "${var.project_name}-firewall-policy"
    Project = var.project_name
  }
}

# Network Firewall BÁSICO
resource "aws_networkfirewall_firewall" "main" {
  name                = "${var.project_name}-firewall"
  firewall_policy_arn = aws_networkfirewall_firewall_policy.main.arn
  vpc_id              = var.vpc_id

  subnet_mapping {
    subnet_id = var.private_subnets[0]
  }

  tags = {
    Name    = "${var.project_name}-firewall"
    Project = var.project_name
  }
}