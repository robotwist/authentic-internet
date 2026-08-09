/**
 * Atomically reserve one creation token for 2nd+ artifact creates.
 * Returns the updated user doc, or null when no token was available.
 */
export function creationTokenSpendFilter(userId) {
  return { _id: userId, creationTokens: { $gte: 1 } };
}

export function creationTokenSpendUpdate() {
  return { $inc: { creationTokens: -1 } };
}

export function creationTokenRefundUpdate() {
  return { $inc: { creationTokens: 1 } };
}

export async function reserveCreationToken(User, userId) {
  return User.findOneAndUpdate(
    creationTokenSpendFilter(userId),
    creationTokenSpendUpdate(),
    { new: true },
  );
}

export async function refundCreationToken(User, userId) {
  return User.findByIdAndUpdate(userId, creationTokenRefundUpdate());
}
