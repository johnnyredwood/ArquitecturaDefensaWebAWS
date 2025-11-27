resource "aws_secretsmanager_secret" "admin_credentials" {
  name                    = "${var.project_name}-admin-credentials"
  description             = "Admin credentials for web application"
  recovery_window_in_days = 0

  lifecycle {
    ignore_changes = [name]
  }
}

resource "aws_secretsmanager_secret_version" "admin_credentials" {
  secret_id = aws_secretsmanager_secret.admin_credentials.id
  secret_string = jsonencode({
    username = var.admin_username
    password = var.admin_password
  })
}

# IAM policy for EC2 to read secrets
resource "aws_iam_policy" "secrets_read" {
  name        = "${var.project_name}-secrets-read-policy"
  description = "Allow EC2 instances to read admin credentials from Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.admin_credentials.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_secrets_read" {
  role       = var.ec2_role_name
  policy_arn = aws_iam_policy.secrets_read.arn
}
