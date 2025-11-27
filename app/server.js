const express = require("express");
const path = require("path");
const fs = require("fs");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const app = express();

// AWS Secrets Manager client
const secretsClient = new SecretsManagerClient({ 
  region: process.env.AWS_REGION || "us-east-1" 
});

// Store admin credentials loaded from Secrets Manager
const ADMIN_CREDENTIALS = {
  username: null,
  password: null
};

// Load admin credentials from Secrets Manager
async function loadAdminCredentials() {
  try {
    const secretName = process.env.SECRET_NAME || "proyecto-redes-admin-credentials";
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);
    
    if (response.SecretString) {
      const secret = JSON.parse(response.SecretString);
      ADMIN_CREDENTIALS.username = secret.username;
      ADMIN_CREDENTIALS.password = secret.password;
      console.log("[Secrets Manager] Admin credentials loaded successfully");
    } else {
      throw new Error("SecretString is empty");
    }
  } catch (error) {
    console.error("[Secrets Manager] Error loading credentials:", error.message);
    // Use fallback credentials for local development
    ADMIN_CREDENTIALS.username = "admin";
    ADMIN_CREDENTIALS.password = "local123";
    console.log("[Secrets Manager] Using fallback credentials for development");
  }
}

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

// Admin session management
const adminSessions = new Map();
const ADMIN_SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Admin rate limiting (stricter than regular login)
const adminLoginAttempts = new Map();
const ADMIN_MAX_ATTEMPTS = 3;
const ADMIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Admin rate limit middleware
const adminRateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowStart = now - ADMIN_WINDOW_MS;
  
  if (!adminLoginAttempts.has(ip)) {
    adminLoginAttempts.set(ip, []);
  }
  
  const attempts = adminLoginAttempts.get(ip).filter(time => time > windowStart);
  adminLoginAttempts.set(ip, attempts);
  
  if (attempts.length >= ADMIN_MAX_ATTEMPTS) {
    return res.status(429).send("Demasiados intentos de login. Espere 15 minutos.");
  }
  
  next();
};

// Middleware to require admin authentication
const requireAdminAuth = (req, res, next) => {
  const sessionId = req.headers.cookie?.split('adminSession=')[1]?.split(';')[0];
  
  if (!sessionId || !adminSessions.has(sessionId)) {
    return res.redirect('/admin-login');
  }
  
  const session = adminSessions.get(sessionId);
  const now = Date.now();
  
  if (now - session.lastAccess > ADMIN_SESSION_TIMEOUT) {
    adminSessions.delete(sessionId);
    return res.redirect('/admin-login');
  }
  
  session.lastAccess = now;
  next();
};

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

// Página de code injection
app.get("/code-injection", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "code-injection.html"));
});

// Admin login page
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-login.html"));
});

// Admin login POST handler
app.post("/admin-login", adminRateLimit, (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;
  
  // Record login attempt
  if (!adminLoginAttempts.has(ip)) {
    adminLoginAttempts.set(ip, []);
  }
  adminLoginAttempts.get(ip).push(Date.now());
  
  console.log(`[Admin Login] Attempt from IP: ${ip}, Username: ${username}`);
  
  // Validate credentials against Secrets Manager values
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    // Create session
    const sessionId = generateId();
    adminSessions.set(sessionId, {
      username,
      loginTime: Date.now(),
      lastAccess: Date.now(),
      ip
    });
    
    // Clear failed attempts on successful login
    adminLoginAttempts.delete(ip);
    
    // Set session cookie
    res.setHeader('Set-Cookie', `adminSession=${sessionId}; HttpOnly; Path=/; Max-Age=900`);
    
    console.log(`[Admin Login] Success for user: ${username}`);
    return res.redirect('/admin');
  }
  
  console.log(`[Admin Login] Failed for user: ${username}`);
  res.status(401).send("Credenciales inválidas");
});

// Admin logout
app.get("/admin-logout", (req, res) => {
  const sessionId = req.headers.cookie?.split('adminSession=')[1]?.split(';')[0];
  if (sessionId) {
    adminSessions.delete(sessionId);
  }
  res.setHeader('Set-Cookie', 'adminSession=; HttpOnly; Path=/; Max-Age=0');
  res.redirect('/admin-login');
});

// Simulación de pantalla admin (now protected)
app.get("/admin", requireAdminAuth, (req, res) => {
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

app.post("/eval", (req, res) => {
  const { expression } = req.body;

  console.log(`[Code Injection Test] Expression received: ${expression}`);

  let result;
  let error = null;
  
  try {
    result = eval(expression);
  } catch (err) {
    error = err.message;
    result = null;
  }
    
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Resultado de Evaluación</title>
      <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        .output { background: #000; color: #0f0; padding: 15px; border-radius: 5px; }
        .warning { color: red; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h3>Resultado de la Expresión</h3>
      <p>Expresión evaluada: <b>${expression}</b></p>
      <div class="output">
        <pre>${error ? 'ERROR: ' + error : 'Resultado: ' + JSON.stringify(result)}</pre>
      </div>
      ${error ? '<p class="warning">La expresión causó un error o fue maliciosa</p>' : ''}
      <i>(El WAF debería bloquear expresiones peligrosas como: process.exit(), require('fs'), etc.)</i>
      <br><br>
      <a href="/code-injection">Volver a Code Injection</a> | <a href="/">Inicio</a>
    </body>
    </html>
  `);
});

app.post("/shell", (req, res) => {
  const { command } = req.body;

  console.log(`[Command Injection Test] Command received: ${command}`);

  let output;
  let error = null;
  
  try {
    const { execSync } = require('child_process');
    output = execSync(command, { timeout: 5000 }).toString();
  } catch (err) {
    error = err.message;
    output = null;
  }
    
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Resultado de Comando Shell</title>
      <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        .output { background: #000; color: #0f0; padding: 15px; border-radius: 5px; }
        .warning { color: red; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h3>Resultado del Comando</h3>
      <p>Comando ejecutado: <b>${command}</b></p>
      <div class="output">
        <pre>${error ? 'ERROR: ' + error : output}</pre>
      </div>
      ${error ? '<p class="warning">El comando causó un error o fue bloqueado</p>' : ''}
      <i>(El WAF debería bloquear comandos shell peligrosos como: cat, ls, whoami, etc.)</i>
      <br><br>
      <a href="/code-injection">Volver a Code Injection</a> | <a href="/">Inicio</a>
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

// Load credentials before starting server
loadAdminCredentials().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de pruebas WAF corriendo en puerto ${PORT}`);
    console.log(`Instancia: ${process.env.INSTANCE_ID || 'primary'}`);
    console.log(`Accesible en: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Admin login: http://localhost:${PORT}/admin-login`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});