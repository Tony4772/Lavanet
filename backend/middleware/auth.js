const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) =>
  jwt.sign(
    { id: user._id, tenant: user.tenant, role: user.role },
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

/** Sets req.tenantId from the authenticated user (never from client body). */
exports.verifyTenant = (req, res, next) => {
  if (!req.user?.tenant) {
    return res.status(403).json({
      status: "fail",
      message: "Usuario sin tenant asignado",
    });
  }
  req.tenantId = req.user.tenant.toString();
  next();
};
