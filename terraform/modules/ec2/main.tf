# Security Group para EC2
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Security group para instancias EC2"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP desde ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [var.alb_sg_id]
  }

  # SSH eliminado - se usa Session Manager en su lugar

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-ec2-sg"
    Project = var.project_name
  }
}

# Launch Template
resource "aws_launch_template" "web_app" {
  name_prefix   = "${var.project_name}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.micro"
  key_name      = "llave"

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups = [aws_security_group.ec2.id]
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    aws_region  = "us-east-1"
    secret_name = "${var.project_name}-admin-credentials"
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name    = "${var.project_name}-instance"
      Project = var.project_name
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web_app" {
  name_prefix         = "${var.project_name}-asg-"
  desired_capacity    = 2
  max_size           = 4
  min_size           = 1
  vpc_zone_identifier = var.private_subnets

  launch_template {
    id      = aws_launch_template.web_app.id
    version = "$Latest"
  }

  target_group_arns = [var.target_group_arn]

  tag {
    key                 = "Name"
    value               = "${var.project_name}-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Data source para AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}