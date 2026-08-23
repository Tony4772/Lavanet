const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServiceSchema = new Schema({
  name: {
    type: String,
    required: [true, "Nombre es requerido"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Categoría es requerida"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Precio es requerido"],
    min: [0, "Precio debe ser positivo"],
  },
  unit: {
    type: String,
    enum: ["kg", "und", "m", "hr"],
    default: "kg",
  },
  eta: {
    type: String,
    default: "24h",
  },
  active: {
    type: Boolean,
    default: true,
  },
  tenant: {
    type: Schema.Types.ObjectId,
    ref: "Tenant",
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

// Index for tenant lookup
ServiceSchema.index({ tenant: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Service", ServiceSchema);