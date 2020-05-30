const jwt = require("jsonwebtoken");

const getTokenFromRequest = req => {
  const auth = req.get("Authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.substring(7);
  }
  return null;
};

const validateToken = (req, res, next) => {
  const token = getTokenFromRequest(req);
  const decodedToken = jwt.decode(token, process.env.TOKEN_SECRET);
  if (!token || !decodedToken.id) {
    return next({ status: 403, message: "Token missing or invalid" });
  }
  req.decodedToken = decodedToken;
  next();
};

module.exports = { validateToken };
