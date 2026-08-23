const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const mountTenantRoutes = require("./middleware/tenantRoutes");
const { ensurePlatformSeed, resetDemoTenant } = require("./lib/seedPlatform");
const billing = require("./lib/billing");

const app = express();

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
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/superadmin", require("./routes/superadmin"));
app.use("/api/billing", require("./routes/billing"));

mountTenantRoutes(app, "/api/users", require("./routes/users"));
mountTenantRoutes(app, "/api/customers", require("./routes/customers"));
mountTenantRoutes(app, "/api/services", require("./routes/services"));
mountTenantRoutes(app, "/api/orders", require("./routes/orders"));
mountTenantRoutes(app, "/api/products", require("./routes/products"));
mountTenantRoutes(app, "/api/config", require("./routes/config"));
mountTenantRoutes(app, "/api/cash", require("./routes/cash"));
mountTenantRoutes(app, "/api/coupons", require("./routes/coupons"));
mountTenantRoutes(app, "/api/sunat", require("./routes/sunat"));

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

function scheduleJobs() {
  const run = () => {
    billing.processDueBilling().catch((err) => console.error("Billing job:", err.message));
  };
  run();
  setInterval(run, 6 * 60 * 60 * 1000);

  const scheduleDemoReset = () => {
    const now = new Date();
    const lima = new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }));
    const next = new Date(lima);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    const ms = next - lima;
    setTimeout(() => {
      resetDemoTenant().catch(console.error);
      setInterval(() => resetDemoTenant().catch(console.error), 24 * 60 * 60 * 1000);
    }, Math.max(ms, 60000));
  };
  scheduleDemoReset();
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

  await ensurePlatformSeed();
  scheduleJobs();

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
