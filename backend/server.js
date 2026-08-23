const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

// Detrás de Caddy / reverse proxy
app.set("trust proxy", 1);

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/services", require("./routes/services"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/products", require("./routes/products"));
app.use("/api/config", require("./routes/config"));
app.use("/api/cash", require("./routes/cash"));
app.use("/api/coupons", require("./routes/coupons"));

if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "..", "frontend", "build");
  app.use(express.static(buildPath));
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.sendFile(path.resolve(buildPath, "index.html"));
  });
}

async function start() {
  if (!process.env.MONGO_URL) {
    console.error("MONGO_URL no configurado");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-me-to-a-long-random-string") {
    console.warn("⚠️  JWT_SECRET débil o por defecto — cámbialo en producción");
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log("MongoDB conectado");

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`LAVANET Backend en http://localhost:${PORT}`);
  });
}

module.exports = app;

if (require.main === module) {
  start().catch((err) => {
    console.error("Error al iniciar:", err.message);
    process.exit(1);
  });
}
