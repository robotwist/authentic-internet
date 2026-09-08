/**
 * Helpers for public character trending queries.
 *
 * Aggregation $lookup returns raw user documents and bypasses Mongoose
 * toJSON transforms, so creator fields must be explicitly whitelisted.
 */

export const TRENDING_DEFAULT_LIMIT = 10;
export const TRENDING_MAX_LIMIT = 50;

export const PUBLIC_CREATOR_PROJECTION = {
  username: 1,
  avatar: 1,
};

export const SENSITIVE_CREATOR_FIELDS = [
  "password",
  "email",
  "refreshTokens",
  "resetPasswordToken",
  "resetPasswordExpires",
  "emailVerificationToken",
  "isAdmin",
  "role",
  "gameState",
  "inventory",
  "characterSprite",
];

export function clampTrendingLimit(
  limit,
  defaultLimit = TRENDING_DEFAULT_LIMIT,
  maxLimit = TRENDING_MAX_LIMIT,
) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return defaultLimit;
  }
  return Math.min(parsed, maxLimit);
}

export function publicCreatorLookup() {
  return {
    from: "users",
    let: { creatorId: "$creator" },
    pipeline: [
      { $match: { $expr: { $eq: ["$_id", "$$creatorId"] } } },
      { $project: PUBLIC_CREATOR_PROJECTION },
    ],
    as: "creator",
  };
}

export function selectPublicCreator(user) {
  if (!user || typeof user !== "object") {
    return user;
  }
  return {
    _id: user._id,
    username: user.username,
    avatar: user.avatar,
  };
}
