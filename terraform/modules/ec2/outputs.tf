output "instance_ids" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.web_app.name
}