output "instance_ids" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.web_app.name
}

output "ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_ssm.name
}