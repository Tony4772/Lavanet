const express = require("express");
const router = express.Router();
const Cash = require("../models/Cash");
const { protect, authorize, verifyTenant } = require("../middleware/auth");

const getOrCreate = async (tenantId) => {
  let cash = await Cash.findOne({ tenant: tenantId });
  if (!cash) cash = await Cash.create({ tenant: tenantId });
  return cash;
};

router.get("/", protect, verifyTenant, async (req, res) => {
  try {
    const cash = await getOrCreate(req.tenantId);
    res.json(cash);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/open", protect, verifyTenant, authorize("admin", "cajero"), async (req, res) => {
  try {
    const cash = await getOrCreate(req.tenantId);
    if (cash.isOpen) return res.status(400).json({ message: "La caja ya está abierta" });
    cash.isOpen = true;
    cash.openedAt = new Date();
    cash.openingBalance = Number(req.body.openingBalance || 0);
    cash.closedAt = null;
    cash.closingBalance = 0;
    cash.movements = [];
    await cash.save();
    res.json(cash);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/movement", protect, verifyTenant, authorize("admin", "cajero"), async (req, res) => {
  try {
    const cash = await getOrCreate(req.tenantId);
    if (!cash.isOpen) return res.status(400).json({ message: "La caja está cerrada" });
    const { type, amount, note, method } = req.body;
    if (!["ingreso", "gasto"].includes(type) || amount == null) {
      return res.status(400).json({ message: "type y amount son requeridos" });
    }
    cash.movements.unshift({ type, amount: Number(amount), note, method });
    await cash.save();
    res.json(cash);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/close", protect, verifyTenant, authorize("admin", "cajero"), async (req, res) => {
  try {
    const cash = await getOrCreate(req.tenantId);
    if (!cash.isOpen) return res.status(400).json({ message: "La caja ya está cerrada" });
    const closing =
      cash.openingBalance +
      cash.movements.filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0) -
      cash.movements.filter((m) => m.type === "gasto").reduce((s, m) => s + m.amount, 0);
    cash.isOpen = false;
    cash.closedAt = new Date();
    cash.closingBalance = closing;
    await cash.save();
    res.json(cash);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
