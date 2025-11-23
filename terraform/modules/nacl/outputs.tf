output "public_nacl_id" {
  description = "ID del Network ACL público"
  value       = aws_network_acl.public.id
}

output "private_nacl_id" {
  description = "ID del Network ACL privado"
  value       = aws_network_acl.private.id
}
