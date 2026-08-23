const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Tenant = require("../models/Tenant");

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      tenant: user.tenant,
      role: user.role,
      isSuperadmin: user.role === "superadmin",
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user);
  const days = Number(process.env.JWT_COOKIE_EXPIRES_IN || 1);
  res.cookie("jwt", token, {
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user: safeUser },
  });
};

exports.signToken = signToken;
exports.createSendToken = createSendToken;

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "No has iniciado sesión",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id).select("+password");
    if (!currentUser || !currentUser.isActive) {
      return res.status(401).json({
        status: "fail",
        message: "El usuario de este token ya no existe o está inactivo",
      });
    }

    req.user = currentUser;
    req.tenantId = currentUser.tenant?.toString();
    next();
  } catch (err) {
    return res.status(401).json({
      status: "fail",
      message: "Token no válido o ha expirado",
    });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      status: "fail",
      message: "No tienes permiso para realizar esta acción",
    });
  }
  next();
};

exports.verifyTenant = (req, res, next) => {
  if (req.user?.role === "superadmin") return next();
  if (!req.user?.tenant) {
    return res.status(403).json({
      status: "fail",
      message: "Usuario sin tenant asignado",
    });
  }
  req.tenantId = req.user.tenant.toString();
  next();
};

exports.superadminOnly = (req, res, next) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ status: "fail", message: "Solo superadmin" });
  }
  next();
};

/** Bloquea tenants suspendidos (no demo, no superadmin). */
exports.requireActiveSubscription = async (req, res, next) => {
  try {
    if (req.user?.role === "superadmin") return next();
    if (!req.user?.tenant) return next();

    const tenant = await Tenant.findById(req.user.tenant);
    if (!tenant) {
      return res.status(403).json({ status: "fail", message: "Negocio no encontrado" });
    }
    if (tenant.isDemo || tenant.billingStatus === "demo") {
      req.tenantDoc = tenant;
      return next();
    }
    if (tenant.billingStatus === "suspended" || tenant.status === "suspended") {
      return res.status(402).json({
        status: "fail",
        code: "SUBSCRIPTION_SUSPENDED",
        message: "Suscripción suspendida. Contacta WhatsApp 906 591 037",
      });
    }
    req.tenantDoc = tenant;
    next();
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};
