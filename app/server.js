const express = require("express");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Datos simulados para pruebas estilo SQL Injection
const database = JSON.parse(fs.readFileSync("./data.json", "utf8"));

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

// Endpoint vulnerable a SQL Injection
app.post("/search", (req, res) => {
  const query = req.body.query || "";

  // Simulación: filtrar "base de datos" sin protección
  const results = database.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  res.send(`
    <h2>Resultados</h2>
    <p>Búsqueda: <b>${query}</b></p>
    <pre>${JSON.stringify(results, null, 2)}</pre>
    <a href="/search">Volver</a>
  `);
});

// Endpoint vulnerable a XSS
app.post("/comment", (req, res) => {
  const { comment } = req.body;

  res.send(`
    <h2>Comentario recibido</h2>
    <p>${comment}</p>
    <p><i>(Si escribiste un script, revisa si el WAF lo bloqueó)</i></p>
    <a href="/">Volver</a>
  `);
});

// 🔥 Endpoint vulnerable a Path Traversal
app.get("/read-file", (req, res) => {
  const file = req.query.file;

  try {
    const content = fs.readFileSync(file, "utf8");
    res.send(`<pre>${content}</pre>`);
  } catch (err) {
    res.send("Archivo no encontrado o acceso denegado.");
  }
});

// 🔥 Endpoint vulnerable a command injection
app.post("/ping", (req, res) => {
  const { host } = req.body;

  res.send(`
    <h3>Simulación de PING</h3>
    <p>Comando recibido: <b>ping ${host}</b></p>
    <i>(El WAF debería bloquear comandos peligrosos)</i>
    <br><a href="/api-test">Volver</a>
  `);
});

// 🔥 Endpoint vulnerable a brute force
let loginAttempts = {};

app.post("/login", (req, res) => {
  const ip = req.ip;
  loginAttempts[ip] = (loginAttempts[ip] || 0) + 1;

  res.send(`
    <h3>Intento ${loginAttempts[ip]} desde IP ${ip}</h3>
    <p>Usuario recibido: ${req.body.user}</p>
    <p>Contraseña: ${req.body.pass}</p>
    <i>(El WAF debería bloquear intentos múltiples por IP)</i>
    <br><a href="/login">Volver</a>
  `);
});

app.get("/api/item/:id", (req, res) => {
  res.json({ id: req.params.id, status: "GET OK" });
});

app.post("/api/item", (req, res) => {
  res.json({ id: uuidv4(), received: req.body });
});

app.put("/api/item/:id", (req, res) => {
  res.json({ updated: req.params.id, newData: req.body });
});

app.delete("/api/item/:id", (req, res) => {
  res.json({ deleted: req.params.id });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
