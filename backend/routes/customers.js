const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const { protect, authorize, verifyTenant } = require("../middleware/auth");

const scoped = (req) => ({ _id: req.params.id, tenant: req.tenantId });

router.get("/", protect, verifyTenant, async (req, res) => {
  try {
    const customers = await Customer.find({ tenant: req.tenantId }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", protect, verifyTenant, async (req, res) => {
  try {
    const customer = await Customer.findOne(scoped(req));
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", protect, verifyTenant, async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "name y phone son requeridos" });
    }
    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      tenant: req.tenantId,
    });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", protect, verifyTenant, async (req, res) => {
  try {
    const { name, phone, email, address, active } = req.body;
    const customer = await Customer.findOneAndUpdate(
      scoped(req),
      { name, phone, email, address, active, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", protect, authorize("admin"), verifyTenant, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete(scoped(req));
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json({ message: "Cliente eliminado" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
