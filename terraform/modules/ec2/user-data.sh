#!/bin/bash
# Script para instalar Docker y desplegar aplicación

# Obtener el ID de la instancia
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)

# Actualizar sistema
yum update -y

# Instalar Docker
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user

# Instalar Git
yum install -y git

# Crear directorio de la aplicación
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

git clone https://github.com/johnnyredwood/ArquitecturaDefensaWebAWS.git proyecto
cd proyecto/app

# Construir imagen Docker
docker build -t web-app .

# Ejecutar contenedor con variables de entorno para AWS Secrets Manager
docker run -d -p 3000:3000 \
  --network host \
  -e AWS_REGION=${aws_region} \
  -e SECRET_NAME=${secret_name} \
  -e INSTANCE_ID=$INSTANCE_ID \
  --name web-app-container \
  web-app

# Verificar que está corriendo nuestra app
docker ps
echo "Aplicación desplegada correctamente"