#!/bin/bash
# Script para instalar Docker y desplegar aplicación

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

# Ejecutar contenedor
docker run -d -p 3000:3000 --name web-app-container web-app

# Verificar que está corriendo nuestra app
docker ps
echo "Aplicación desplegada correctamente"