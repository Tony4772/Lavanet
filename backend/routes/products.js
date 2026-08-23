const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect, authorize, verifyTenant } = require("../middleware/auth");

const scoped = (req) => ({ _id: req.params.id, tenant: req.tenantId });

router.get("/", protect, verifyTenant, async (req, res) => {
  try {
    const products = await Product.find({ tenant: req.tenantId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", protect, verifyTenant, authorize("admin", "cajero"), async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, tenant: req.tenantId });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", protect, verifyTenant, authorize("admin", "cajero"), async (req, res) => {
  try {
    const { name, sku, category, price, stock, minStock, active } = req.body;
    const product = await Product.findOneAndUpdate(
      scoped(req),
      { name, sku, category, price, stock, minStock, active },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", protect, verifyTenant, authorize("admin"), async (req, res) => {
  try {
    const product = await Product.findOneAndDelete(scoped(req));
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
