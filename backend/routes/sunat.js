const express = require("express");
const router = express.Router();
const Tenant = require("../models/Tenant");
const Invoice = require("../models/Invoice");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const { protect, authorize, verifyTenant } = require("../middleware/auth");
const sunat = require("../lib/sunat");
const { buildInvoicePayload, tenantToCompany } = require("../lib/sunat/buildPayload");

router.get("/status", protect, verifyTenant, authorize("admin"), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId).select("+sunat.solPass +sunat.certificatePassword +sunat.certificateP12");
    if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
    const s = tenant.sunat || {};
    const configured = sunat.isConfigured({
      sol_user: s.solUser,
      sol_pass: s.solPass,
      certificado_p12: s.certificateP12,
    });
    let test = null;
    if (configured && s.enabled) {
      try {
        test = await sunat.testConnection(tenantToCompany(tenant));
      } catch (err) {
        test = { ok: false, message: err.message };
      }
    }
    res.json({
      status: "success",
      data: {
        enabled: !!s.enabled,
        configured,
        ruc: s.ruc,
        businessName: s.businessName,
        environment: s.environment || "beta",
        seriesInvoice: s.seriesInvoice,
        seriesBoleta: s.seriesBoleta,
        nextInvoice: s.nextInvoice,
        nextBoleta: s.nextBoleta,
        hasCertificate: !!s.certificateP12,
        hasSol: !!(s.solUser && s.solPass),
        test,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.put("/config", protect, verifyTenant, authorize("admin"), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId).select("+sunat.solPass +sunat.certificatePassword +sunat.certificateP12");
    if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });

    const body = req.body || {};
    const sunatCfg = tenant.sunat || {};
    sunatCfg.enabled = body.enabled !== undefined ? !!body.enabled : sunatCfg.enabled;
    if (body.ruc !== undefined) sunatCfg.ruc = String(body.ruc).replace(/\D/g, "");
    if (body.businessName !== undefined) sunatCfg.businessName = body.businessName;
    if (body.address !== undefined) sunatCfg.address = body.address;
    if (body.ubigeo !== undefined) sunatCfg.ubigeo = body.ubigeo;
    if (body.solUser !== undefined) sunatCfg.solUser = body.solUser;
    if (body.solPass) sunatCfg.solPass = body.solPass;
    if (body.certificatePassword !== undefined) sunatCfg.certificatePassword = body.certificatePassword;
    if (body.certificateP12) sunatCfg.certificateP12 = body.certificateP12;
    if (body.environment) sunatCfg.environment = body.environment === "produccion" ? "produccion" : "beta";
    if (body.seriesInvoice) sunatCfg.seriesInvoice = body.seriesInvoice.toUpperCase();
    if (body.seriesBoleta) sunatCfg.seriesBoleta = body.seriesBoleta.toUpperCase();

    tenant.sunat = sunatCfg;
    tenant.markModified("sunat");
    await tenant.save();

    res.json({
      status: "success",
      data: {
        enabled: sunatCfg.enabled,
        ruc: sunatCfg.ruc,
        environment: sunatCfg.environment,
        hasCertificate: !!sunatCfg.certificateP12,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/test", protect, verifyTenant, authorize("admin"), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId).select("+sunat.solPass +sunat.certificatePassword +sunat.certificateP12");
    if (!tenant?.sunat?.enabled) {
      return res.status(400).json({ status: "fail", message: "Activa SUNAT en configuración primero" });
    }
    const result = await sunat.testConnection(tenantToCompany(tenant));
    res.json({ status: "success", data: result });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
});

router.get("/", protect, verifyTenant, async (req, res) => {
  try {
    const invoices = await Invoice.find({ tenant: req.tenantId }).sort({ createdAt: -1 }).limit(100);
    res.json({ status: "success", data: { invoices } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/emit", protect, verifyTenant, authorize("admin", "cajero"), async (req, res) => {
  try {
    const { orderId, tipoDoc = "03", clientDocType, clientDocNumber, clientName } = req.body;
    if (!orderId) return res.status(400).json({ status: "fail", message: "orderId requerido" });

    const tenant = await Tenant.findById(req.tenantId).select("+sunat.solPass +sunat.certificatePassword +sunat.certificateP12");
    if (!tenant?.sunat?.enabled) {
      return res.status(400).json({ status: "fail", message: "SUNAT no activado para este negocio" });
    }

    let order = null;
    let items = req.body.items;
    let discount = Number(req.body.discount || 0);
    let orderNumber = req.body.orderNumber;

    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findOne({ _id: orderId, tenant: req.tenantId });
      if (order) {
        items = order.items || items;
        discount = Number(order.discount || 0);
        orderNumber = order.number || orderNumber;
      }
    }

    if (!items?.length) {
      return res.status(400).json({ status: "fail", message: "Sin ítems para facturar" });
    }

    const isFactura = String(tipoDoc) === "01";
    const serie = isFactura ? tenant.sunat.seriesInvoice || "F001" : tenant.sunat.seriesBoleta || "B001";
    const correlativo = isFactura ? tenant.sunat.nextInvoice || 1 : tenant.sunat.nextBoleta || 1;

    let customer = null;
    if (order?.customer) {
      customer = await Customer.findById(order.customer);
    }

    const client = {
      tipoDoc: clientDocType || customer?.docType || (isFactura ? "6" : "1"),
      numDoc: clientDocNumber || customer?.docNumber || (isFactura ? "" : "00000000"),
      name: clientName || customer?.name || order?.customerName || "CLIENTE VARIOS",
      rznSocial: clientName || customer?.name || order?.customerName || "CLIENTE VARIOS",
    };

    if (isFactura && String(client.numDoc).replace(/\D/g, "").length !== 11) {
      return res.status(400).json({ status: "fail", message: "Factura requiere RUC del cliente (11 dígitos)" });
    }

    const payload = buildInvoicePayload({
      company: tenantToCompany(tenant),
      client,
      items,
      tipoDoc,
      serie,
      correlativo,
      discount,
    });

    const company = tenantToCompany(tenant);
    let result;
    try {
      result = await sunat.sendInvoice(company, payload);
    } catch (err) {
      await Invoice.create({
        tenant: tenant._id,
        order: order?._id,
        orderNumber,
        tipoDoc,
        serie,
        correlativo,
        label: `${serie}-${correlativo}`,
        clientName: client.rznSocial,
        clientDocType: client.tipoDoc,
        clientDocNumber: client.numDoc,
        mtoOperGravadas: payload.mtoOperGravadas,
        mtoIGV: payload.mtoIGV,
        mtoImpVenta: payload.mtoImpVenta,
        status: "error",
        errorMessage: err.message,
        sunatEnv: company.sunat_env,
      });
      return res.status(400).json({ status: "fail", message: err.message });
    }

    const accepted = result.dryRun || String(result.code) === "0" || String(result.cdr?.cdrCode) === "0";
    if (isFactura) tenant.sunat.nextInvoice = correlativo + 1;
    else tenant.sunat.nextBoleta = correlativo + 1;
    tenant.markModified("sunat");
    await tenant.save();

    const invoice = await Invoice.create({
      tenant: tenant._id,
      order: order?._id,
      orderNumber,
      tipoDoc,
      serie,
      correlativo,
      label: `${serie}-${String(correlativo).padStart(8, "0")}`,
      clientName: client.rznSocial,
      clientDocType: client.tipoDoc,
      clientDocNumber: client.numDoc,
      mtoOperGravadas: payload.mtoOperGravadas,
      mtoIGV: payload.mtoIGV,
      mtoImpVenta: payload.mtoImpVenta,
      status: accepted ? (result.dryRun ? "dry_run" : "accepted") : "rejected",
      cdrCode: String(result.code || result.cdr?.cdrCode || ""),
      cdrDescription: result.cdr?.cdrDescription || result.cdrStatus || "",
      digestValue: result.digestValue,
      xml: result.xml,
      cdrXml: result.cdr?.xml,
      sunatEnv: company.sunat_env,
    });

    res.status(accepted ? 201 : 400).json({
      status: accepted ? "success" : "fail",
      message: accepted ? "Comprobante emitido" : result.cdr?.cdrDescription || "Rechazado por SUNAT",
      data: { invoice, cdr: result.cdr },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
