const mongoose = require("mongoose");

const TenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nombre del tenant es requerido"],
      trim: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    settings: {
      currency: { type: String, default: "PEN" },
      timezone: { type: String, default: "America/Lima" },
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      features: { type: Map, of: Boolean, default: {} },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tenant", TenantSchema);
