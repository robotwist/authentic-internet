/**
 * Token for 2nd artifact: first artifact is free; 2nd+ require 1 creation token each.
 * Earn tokens by completing artifacts you didn't create.
 */
import Artifact from "../models/Artifact.js";
import User from "../models/User.js";

export const requireCreationToken = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.user?.id ?? req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to create artifacts.",
      });
    }

    const uid = userId.toString();
    const count = await Artifact.countDocuments({ createdBy: uid });

    if (count === 0) {
      return next(); // First artifact is free
    }

    const user = await User.findById(userId).select("creationTokens").lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const tokens = Number(user.creationTokens) || 0;
    if (tokens < 1) {
      return res.status(403).json({
        success: false,
        code: "CREATION_TOKEN_REQUIRED",
        message:
          "You need a creation token to create another artifact. Complete an artifact you didn't create to earn one.",
        artifactsCreated: count,
      });
    }

    next();
  } catch (err) {
    console.error("requireCreationToken error:", err);
    res.status(500).json({
      success: false,
      message: "Could not check creation eligibility.",
      error: err.message,
    });
  }
};
