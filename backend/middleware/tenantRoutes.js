const express = require("express");
const { protect, requireActiveSubscription, verifyTenant } = require("../middleware/auth");

/** Rutas de negocio: requieren suscripción activa (no suspendida). */
module.exports = function mountTenantRoutes(app, path, router) {
  app.use(path, protect, requireActiveSubscription, verifyTenant, router);
};
