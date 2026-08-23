const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS || "http://localhost:3000" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(compression());
app.use(express.json({ limit: "10kb" }));

// Conectar a MongoDB con Mongoose
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ MongoDB conectado con Mongoose");
    
    // Routes - registradas después de DB connection
    app.use("/api/auth", require("./routes/auth"));
    app.use("/api/users", require("./routes/users"));
    app.use("/api/customers", require("./routes/customers"));
    app.use("/api/services", require("./routes/services"));
    app.use("/api/orders", require("./routes/orders"));
    app.use("/api/products", require("./routes/products"));
    app.use("/api/config", require("./routes/config"));
    app.use("/api/cash", require("./routes/cash"));
    app.use("/api/coupons", require("./routes/coupons"));
    
    // Health check
    app.get("/api/health", (req, res) => res.json({ status: "ok" }));
    
    // Servir archivos estáticos en producción
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "..", "frontend", "build")));
      app.get("*", (req, res) =>
        res.sendFile(path.resolve(__dirname, "..", "frontend", "build", "index.html"))
      );
    }
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 LAVANET Backend corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error de MongoDB:", err.message);
    process.exit(1);
  });

// Exportar app para serverless platforms
module.exports = app;

// Start standalone if run directly
if (require.main === module) {
  console.log("Iniciando servidor LAVANET...");
}