# Proyecto  
**Tema:** Diseño e Implementación de una Arquitectura de Defensa Web de Múltiples Capas en AWS utilizando Balanceador de Carga, WAF y Firewall de Red

### Descripción detallada de lo que se pretende realizar
Este proyecto consiste en el diseño e implementación de una arquitectura de seguridad web en capas utilizando servicios de AWS y contenedores Docker. Para el presente proyecto, construiremos un sistema completo que demuestre cómo proteger aplicaciones web mediante múltiples niveles de defensa en distintas capas, integrando tecnologías modernas de infraestructura como código con Terraform para el despliegue de la infraestructura.

La implementación se combinará con: un balanceador de carga application layer de tipo ALB, servicio AWS WAF (Web Application Firewall) y servicio de Network Firewall. El objetivo principal es crear un ambiente seguro que pueda resistir ataques comunes en internet mientras mantiene alta disponibilidad y rendimiento. La aplicación estará desplegada en contenedores Docker dentro de una arquitectura protegida paso a paso.

---

### ● Capa básica de Infraestructura en AWS
Crearemos una red virtual en AWS (VPC) con subredes públicas y privadas.  
En la subred pública instalaremos un balanceador de carga (ALB).  
En las subredes privadas ejecutaremos nuestra aplicación.  
Además, configuraremos grupos de seguridad para controlar el tráfico.

---

### ● Capa de Protección a nivel de red con Firewall básico
Implementaremos un firewall básico de red.  
Permitirá solo tráfico hacia el balanceador y bloqueará todos los demás puertos.  
También configuraremos reglas de salida restringidas desde las subredes privadas.

---

### ● Capa de protección a nivel de aplicación WAF
Usaremos AWS WAF para proteger la aplicación en capa 7.  
Se configurarán reglas para bloquear SQL injection, scripts maliciosos y limitar peticiones por minuto.

---

### ● Aplicación Web con Node.js
Desarrollaremos una aplicación web simple en Node.js con una página principal y un formulario de búsqueda para probar las protecciones del WAF.

---

### ● Contenerización con Docker
Empaquetaremos la app Node.js en un contenedor Docker.  
Crearemos un Dockerfile que copie el código, instale dependencias y levante el servidor.

---

### ● Automatización con Terraform
Toda la arquitectura será automatizada con Terraform:  
red, balanceador, WAF, firewall, EC2 y módulos.

---

### ● Pruebas
Accederemos a la aplicación a través del ALB y probaremos:  
- distribución de carga  
- reglas del WAF contra SQLi y scripts  
- firewall de red bloqueando puertos no autorizados  

---

# ✔️ Objetivos
- Diseñar e implementar una arquitectura de seguridad web en capas.  
- Proteger aplicaciones contra amenazas comunes a nivel de red y aplicación.  
- Integrar IaC con Terraform y contenedores Docker.  
- Configurar un balanceador de carga profesional.  
- Implementar AWS WAF con reglas básicas.  
- Implementar un firewall de red como primera línea de defensa.

---

# ✔️ Alcance del Proyecto
Se construirá una arquitectura completa con VPC, subredes, ALB, aplicación en contenedores, WAF y firewall básico.  
La aplicación será sencilla y su propósito principal será validar las protecciones.  
Toda la infraestructura será creada con Terraform utilizando módulos.

---

# ✔️ Referencias
- Amazon Web Services. (2024). *Amazon VPC User Guide*.  
- Amazon Web Services. (2024). *AWS WAF Developer Guide*.  
- HashiCorp. (2023). *Terraform: Infrastructure as Code*.  
