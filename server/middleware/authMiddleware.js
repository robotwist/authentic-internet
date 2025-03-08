import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access Denied - No token provided" });
  }

  const token = authHeader.split(" ")[1];

  console.log("Token received:", token);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    console.log("User authenticated:", user);
    req.user = { _id: user.userId }; // Attach userId as _id
    next();
  });
};

export default authenticateToken;
