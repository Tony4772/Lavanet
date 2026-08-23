const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nombre es requerido"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username es requerido"],
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Email es requerido"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password es requerido"],
      minlength: [8, "Password debe tener mínimo 8 caracteres"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "cajero", "recepcion", "operador"],
      default: "operador",
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  { timestamps: true }
);

UserSchema.index({ tenant: 1, email: 1 }, { unique: true });
UserSchema.index({ tenant: 1, username: 1 }, { unique: true });

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
