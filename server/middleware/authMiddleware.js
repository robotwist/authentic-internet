import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access Denied. Invalid token format." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error("JWT Verification Error:", err);
        return res.status(403).json({ message: "Invalid or expired token." });
      }

      req.user = user; // Attach user info to request
      next(); // Proceed to next middleware
    });
  } catch (error) {
    console.error("Token Authentication Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default authenticateToken;
