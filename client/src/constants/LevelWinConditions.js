/**
 * Explicit win conditions for Levels 1, 2, and 3.
 * Used for UI messaging, reward modals, and achievement tracking.
 *
 * Level 1: Reach Yosemite (explore Overworld, find portal in Overworld 3)
 * Level 2: Complete The Library of Alexandria (defeat The Librarian boss)
 * Level 3: Complete the Terminal experience (exit via "Exit terminal")
 */

export const LEVEL_WIN_CONDITIONS = {
  level1: {
    title: "Level 1 Complete!",
    message: "You've beaten Level 1!",
    subtext: "You explored the Digital Wilderness and reached Yosemite.",
    trigger: "reach_yosemite",
    xpReward: 100,
  },
  level2: {
    title: "Level 2 Complete!",
    message: "You've beaten Level 2!",
    subtext:
      "You conquered The Library of Alexandria and defeated The Librarian.",
    trigger: "boss_defeat_library_alexandria",
    dungeonId: "library_alexandria",
    xpReward: 100,
  },
  level3: {
    title: "Level 3 Complete!",
    message: "You've beaten Level 3!",
    subtext: "You mastered the Terminal and emerged from the digital shadow.",
    trigger: "terminal_complete",
    xpReward: 100,
  },
};

export const getLevelWinConfig = (level) => LEVEL_WIN_CONDITIONS[level] || null;
