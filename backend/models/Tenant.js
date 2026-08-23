const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TenantSchema = new Schema({
  name: {
    type: String,
    required: [true, "Nombre del tenant es requerido"],
    trim: true,
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
    currency: {
      type: String,
      default: "PEN",
    },
    timezone: {
      type: String,
      default: "America/Lima",
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    features: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for tenant lookup by name
TenantSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Tenant", TenantSchema);