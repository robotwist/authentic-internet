import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authenticateToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied - No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.userId) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({ message: `Your account is ${user.accountStatus}` });
    }

    req.user = decoded;
    req.userId = decoded.userId;
    req.userRole = decoded.role || "user";
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(403).json({ message: "Invalid Token" });
  }
};

export default authenticateToken;
