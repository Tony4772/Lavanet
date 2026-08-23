// Inicio del servidor LAVANET Backend
// Maneja dependencias y variables de entorno correctamente

const { createServer } = require("./server");
const app = createServer();

// Obtener el objeto app exportado
const expressApp = app;

// Configurar puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
const server = expressApp.listen(PORT, () => {
  console.log(`🚀 LAVANET Backend corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Modo: ${process.env.NODE_ENV || "development"}`);
});

// Manejo graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Recibido señal SIGTERM. Cerrando servidor...");
  server.close(() => {
    console.log("💅 Servidor cerrado");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 Recibido señal SIGINT. Cerrando servidor...");
  server.close(() => {
    console.log("💅 Servidor cerrado");
    process.exit(0);
  });
});

// Exportar para Vercel/Netlify serverless
module.exports = app;
module.exports.app = expressApp;
module.exports.server = server;