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

# CLONA AQUÍ TU REPOSITORIO GIT
# git clone https://github.com/tu-usuario/tu-repo.git .

# Si no tienes repo, creamos una app básica de prueba
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
EOF

cat > package.json << 'EOF'
{
  "name": "web-app",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOF

cat > server.js << 'EOF'
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Aplicación Web Segura</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          form { margin: 20px 0; }
          input { padding: 8px; margin-right: 10px; }
          button { padding: 8px 15px; background: #007bff; color: white; border: none; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>✅ Aplicación Web Segura en AWS</h1>
        <p>Esta aplicación está protegida por:</p>
        <ul>
          <li>Application Load Balancer</li>
          <li>AWS WAF</li>
          <li>Network Firewall</li>
          <li>Security Groups</li>
          <li>Docker Containers</li>
        </ul>
        <form action="/search" method="get">
          <input type="text" name="q" placeholder="Buscar... (prueba SQL injection)">
          <button type="submit">Buscar</button>
        </form>
        <p><strong>Instancia:</strong> ${process.env.HOSTNAME || 'N/A'}</p>
      </body>
    </html>
  `);
});

app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`
    <html>
      <body>
        <h1>Resultados de búsqueda</h1>
        <p>Buscaste: <strong>${query}</strong></p>
        <a href="/">Volver</a>
        <p><em>Nota: Si pruebas SQL injection, el WAF debería bloquearlo.</em></p>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    instance: process.env.HOSTNAME || 'unknown'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log('Aplicación ejecutándose en puerto ' + port);
});
EOF

# Construir imagen Docker
docker build -t web-app .

# Ejecutar contenedor
docker run -d -p 3000:3000 --name web-app-container web-app

# Verificar que está corriendo
docker ps
echo "Aplicación desplegada correctamente"