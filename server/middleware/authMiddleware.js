import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  console.log("Received Token:", token); // ✅ DEBUG
  if (!token) return res.status(401).json({ message: "Access Denied - No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log("Decoded User:", req.user); // ✅ DEBUG
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.error("JWT Verification Failed: Token Expired");
      return res.status(401).json({ message: "Token expired" });
    }
    console.error("JWT Verification Failed:", error);
    res.status(403).json({ message: "Invalid Token" });
  }
};

export default authenticateToken;
