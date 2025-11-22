output "waf_arn" {
  description = "ARN del WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}