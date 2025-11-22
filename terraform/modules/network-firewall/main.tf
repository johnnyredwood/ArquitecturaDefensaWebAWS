# Firewall Policy
resource "aws_networkfirewall_firewall_policy" "main" {
  name = "${var.project_name}-firewall-policy"

  firewall_policy {
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]

    # Regla stateless básica - permitir tráfico HTTP/HTTPS
    stateless_rule_group_reference {
      priority     = 100
      resource_arn = aws_networkfirewall_rule_group.stateless.arn
    }
  }

  tags = {
    Name    = "${var.project_name}-firewall-policy"
    Project = var.project_name
  }
}

# Rule Group Stateless
resource "aws_networkfirewall_rule_group" "stateless" {
  capacity = 100
  name     = "${var.project_name}-stateless-rules"
  type     = "STATELESS"

  rule_group {
    rules_source {
      stateless_rules_and_custom_actions {
        stateless_rule {
          priority = 1
          rule_definition {
            actions = ["aws:pass"]
            match_attributes {
              source {
                address_definition = "0.0.0.0/0"
              }
              destination {
                address_definition = "0.0.0.0/0"
              }
              protocols = [6] # TCP
              source_port {
                from_port = 0
                to_port   = 65535
              }
              destination_port {
                from_port = 80
                to_port   = 80
              }
              tcp_flag {
                flags = ["SYN"]
                masks = ["SYN", "ACK"]
              }
            }
          }
        }
      }
    }
  }

  tags = {
    Name    = "${var.project_name}-stateless-rules"
    Project = var.project_name
  }
}

# Network Firewall
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