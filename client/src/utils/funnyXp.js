/**
 * "Funny" XP category (bigidea.txt): random triggers, silly amounts, optional flavor text.
 * Small chance on certain actions to award odd XP with a bizarre message.
 */

const FUNNY_XP_AMOUNTS = [3, 7, 13, 17, 23, 42, 99, 111, 333];
const FUNNY_XP_MESSAGES = [
  "Found a neat rock.",
  "The universe smiled upon you.",
  "A passing bard approved.",
  "You stood in a beam of sunlight.",
  "Someone, somewhere, believes in you.",
  "The wind whispered secrets. (+XP)",
  "You didn't trip. Reward!",
  "A cow muttered something nice.",
  "You remembered to breathe. Bonus.",
  "Random act of kindness (from the void).",
  "The devs left this here.",
  "Congratulations?",
  "Nobody knows why.",
  "A tiny dragon nodded.",
  "Your socks matched today.",
];

/**
 * Roll for funny XP. If success, award amount + flavor and return true.
 * @param {Function} awardXP - (amount, reason) => void
 * @param {number} [chance=0.02] - Probability 0..1
 * @returns {{ awarded: boolean, amount?: number, message?: string }}
 */
export function maybeAwardFunnyXp(awardXP, chance = 0.02) {
  if (typeof awardXP !== "function" || Math.random() >= chance) {
    return { awarded: false };
  }
  const amount =
    FUNNY_XP_AMOUNTS[Math.floor(Math.random() * FUNNY_XP_AMOUNTS.length)];
  const message =
    FUNNY_XP_MESSAGES[Math.floor(Math.random() * FUNNY_XP_MESSAGES.length)];
  awardXP(amount, message);
  return { awarded: true, amount, message };
}

export { FUNNY_XP_AMOUNTS, FUNNY_XP_MESSAGES };
