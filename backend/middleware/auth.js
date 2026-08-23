const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generar y asignar token JWT
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || "90d",
});

// Crear y enviar token de respuesta
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined; // No enviar password en la respuesta
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// Middleware de protección de rutas
exports.protect = async (req, res, next) => {
  try {
    // 1) Obtener token y verificar si existe
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "No has iniciado sesión, inicia sesión para obtener acceso",
      });
    }

    // 2) Verificación del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Verificar si el usuario sigue existiendo
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "El usuario de este token ya no existe",
      });
    }

    // 4) Verificar si el usuario cambió la contraseña después de emitir el token
    // (Aquí podríamos añadir lógica adicional)

    // Añadir usuario actual a req objeto para uso en rutas posteriores
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: "fail",
      message: "Token no válido o ha expirado",
    });
  }
};

// Middleware de autorización (solo roles específicos)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "No tienes permiso para realizar esta acción",
      });
    }
    next();
  };
};

// Middleware para verificar tenant del usuario
exports.verifyTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) {
      return res.status(400).json({
        status: "fail",
        message: "ID de tenant es requerido",
      });
    }

    // Verificar que el usuario pertenece a este tenant
    if (req.user.tenant.toString() !== tenantId) {
      return res.status(403).json({
        status: "fail",
        message: "No tienes acceso a este tenant",
      });
    }

    req.tenantId = tenantId;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Encriptar contraseña antes de guardar
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Comparar contraseña login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);