const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, "Nombre es requerido"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email es requerido"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password es requerido"],
    minlength: [8, "Password debe tener mínimo 8 caracteres"],
  },
  role: {
    type: String,
    enum: ["admin", "cajero", "recepcion", "operador"],
    default: "operador",
  },
  tenant: {
    type: Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
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
UserSchema.index({ tenant: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);