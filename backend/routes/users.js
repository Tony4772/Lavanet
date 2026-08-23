const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, authorize, verifyTenant } = require("../middleware/auth");

const scoped = (req) => ({ _id: req.params.id, tenant: req.tenantId });

router.get("/", protect, verifyTenant, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({ tenant: req.tenantId }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", protect, verifyTenant, authorize("admin"), async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "Campos requeridos faltantes" });
    }
    const user = await User.create({
      name,
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      role: role || "operador",
      tenant: req.tenantId,
    });
    const safe = user.toObject();
    delete safe.password;
    res.status(201).json(safe);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Usuario o email duplicado" });
    }
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", protect, verifyTenant, authorize("admin"), async (req, res) => {
  try {
    const { name, email, role, isActive, password } = req.body;
    const user = await User.findOne(scoped(req)).select("+password");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;
    await user.save();

    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", protect, verifyTenant, authorize("admin"), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "No puedes eliminarte a ti mismo" });
    }
    const user = await User.findOneAndDelete(scoped(req));
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
