const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('views'));

// Datos simulados para pruebas estilo SQL Injection
const database = JSON.parse(fs.readFileSync("./data.json", "utf8"));

// Simple ID generator (replaces uuid)
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Simple rate limiting for brute force protection
const loginAttempts = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Rate limiting middleware
const rateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, []);
  }
  
  const attempts = loginAttempts.get(ip).filter(time => time > windowStart);
  loginAttempts.set(ip, attempts);
  
  if (attempts.length >= MAX_ATTEMPTS) {
    return res.status(429).send(`
      <h2>Too Many Requests</h2>
      <p>Demasiados intentos de login. Por favor espere 15 minutos.</p>
      <a href="/login">Volver</a>
    `);
  }
  
  next();
};

// Página de inicio
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Página de búsqueda
app.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "search.html"));
});

// Página de login vulnerable
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// Página de pruebas API
app.get("/api-test", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "api-test.html"));
});

// Simulación de pantalla admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    instance: process.env.INSTANCE_ID || "primary"
  });
});

// Endpoint vulnerable a SQL Injection
app.post("/search", (req, res) => {
  const query = req.body.query || "";

  console.log(`[SQL Injection Test] Query received: ${query}`);

  // Simulación: filtrar "base de datos" sin protección
  const results = database.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Resultados de Búsqueda</title>
    </head>
    <body>
      <h2>Resultados</h2>
      <p>Búsqueda: <b>${query}</b></p>
      <pre>${JSON.stringify(results, null, 2)}</pre>
      <a href="/search">Volver a buscar</a> | 
      <a href="/">Inicio</a>
    </body>
    </html>
  `);
});

// Endpoint vulnerable a XSS
app.post("/comment", (req, res) => {
  const { comment } = req.body;

  console.log(`[XSS Test] Comment received: ${comment}`);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comentario Recibido</title>
    </head>
    <body>
      <h2>Comentario recibido</h2>
      <div>${comment}</div>
      <p><i>(Si escribiste un script, revisa si el WAF lo bloqueó)</i></p>
      <a href="/">Volver al inicio</a>
    </body>
    </html>
  `);
});

app.get("/read-file", (req, res) => {
  const file = req.query.file || "data.json";

  console.log(`[Path Traversal Test] File requested: ${file}`);

  try {
    // Limit file access to current directory for safety in container
    const safePath = path.join(__dirname, path.basename(file));
    const content = fs.readFileSync(safePath, "utf8");
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contenido del Archivo</title>
      </head>
      <body>
        <h3>Contenido de: ${file}</h3>
        <pre>${content}</pre>
        <a href="/">Volver al inicio</a>
      </body>
      </html>
    `);
  } catch (err) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <body>
        <h3>Error</h3>
        <p>Archivo no encontrado o acceso denegado: ${file}</p>
        <a href="/">Volver al inicio</a>
      </body>
      </html>
    `);
  }
});

app.post("/ping", (req, res) => {
  const { host } = req.body;

  console.log(`[Command Injection Test] Ping requested to: ${host}`);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Resultado Ping</title>
    </head>
    <body>
      <h3>Simulación de PING</h3>
      <p>Comando recibido: <b>ping ${host}</b></p>
      <i>(El WAF debería bloquear comandos peligrosos como: ; cat /etc/passwd, | ls, etc.)</i>
      <br><br>
      <a href="/api-test">Volver a pruebas API</a>
    </body>
    </html>
  `);
});

app.post("/login", rateLimit, (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, []);
  }
  
  loginAttempts.get(ip).push(now);
  
  const attempts = loginAttempts.get(ip).length;

  console.log(`[Brute Force Test] Login attempt ${attempts} from IP: ${ip}`);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Resultado Login</title>
    </head>
    <body>
      <h3>Intento ${attempts} desde IP ${ip}</h3>
      <p>Usuario recibido: ${req.body.user}</p>
      <p>Contraseña: ${req.body.pass}</p>
      <i>(El WAF debería bloquear intentos múltiples por IP)</i>
      <br><br>
      <a href="/login">Volver a login</a>
    </body>
    </html>
  `);
});

// API endpoints
app.get("/api/item/:id", (req, res) => {
  res.json({ 
    id: req.params.id, 
    status: "GET OK",
    instance: process.env.INSTANCE_ID || "primary"
  });
});

app.post("/api/item", (req, res) => {
  res.json({ 
    id: generateId(), 
    received: req.body,
    instance: process.env.INSTANCE_ID || "primary"
  });
});

app.put("/api/item/:id", (req, res) => {
  res.json({ 
    updated: req.params.id, 
    newData: req.body,
    instance: process.env.INSTANCE_ID || "primary"
  });
});

app.delete("/api/item/:id", (req, res) => {
  res.json({ 
    deleted: req.params.id,
    instance: process.env.INSTANCE_ID || "primary"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de pruebas WAF corriendo en puerto ${PORT}`);
  console.log(`Instancia: ${process.env.INSTANCE_ID || 'primary'}`);
  console.log(`Accesible en: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});