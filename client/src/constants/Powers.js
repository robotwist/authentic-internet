// Power definitions and constants
export const POWER_DEFINITIONS = {
  speed_boost: {
    id: "speed_boost",
    name: "Speed Boost",
    description: "Move faster through the world",
    icon: "⚡",
    category: "movement",
    maxLevel: 5,
  },
  double_jump: {
    id: "double_jump",
    name: "Double Jump",
    description: "Jump twice in mid-air to reach higher areas",
    icon: "🦘",
    category: "movement",
    maxLevel: 3,
  },
  flight: {
    id: "flight",
    name: "Flight",
    description: "Soar above obstacles and explore from above",
    icon: "🕊️",
    category: "movement",
    maxLevel: 5,
  },
  invisibility: {
    id: "invisibility",
    name: "Invisibility",
    description: "Become invisible to sneak past enemies",
    icon: "👻",
    category: "stealth",
    maxLevel: 3,
  },
  teleportation: {
    id: "teleportation",
    name: "Teleportation",
    description: "Instant travel between discovered locations",
    icon: "🌀",
    category: "movement",
    maxLevel: 5,
  },
  time_manipulation: {
    id: "time_manipulation",
    name: "Time Manipulation",
    description: "Slow down time for precise challenges",
    icon: "⏱️",
    category: "utility",
    maxLevel: 3,
  },
  super_strength: {
    id: "super_strength",
    name: "Super Strength",
    description: "Break through barriers and lift heavy objects",
    icon: "💪",
    category: "combat",
    maxLevel: 5,
  },
  elemental_fire: {
    id: "elemental_fire",
    name: "Fire Control",
    description: "Control fire to light paths and melt obstacles",
    icon: "🔥",
    category: "elemental",
    maxLevel: 5,
  },
  elemental_water: {
    id: "elemental_water",
    name: "Water Control",
    description: "Manipulate water to create bridges and extinguish fires",
    icon: "💧",
    category: "elemental",
    maxLevel: 5,
  },
  elemental_earth: {
    id: "elemental_earth",
    name: "Earth Control",
    description: "Shape the earth to create platforms and barriers",
    icon: "🌍",
    category: "elemental",
    maxLevel: 5,
  },
  elemental_air: {
    id: "elemental_air",
    name: "Air Control",
    description: "Command the winds to push objects and create gusts",
    icon: "💨",
    category: "elemental",
    maxLevel: 5,
  },
  mind_reading: {
    id: "mind_reading",
    name: "Mind Reading",
    description: "Understand NPC thoughts and hidden secrets",
    icon: "🧠",
    category: "utility",
    maxLevel: 3,
  },
  metamorphosis: {
    id: "metamorphosis",
    name: "Metamorphosis",
    description: "Transform into different creatures and objects",
    icon: "🦋",
    category: "utility",
    maxLevel: 3,
  },
};

export const POWER_CATEGORIES = {
  movement: { name: "Movement", color: "#3498db" },
  stealth: { name: "Stealth", color: "#9b59b6" },
  utility: { name: "Utility", color: "#f39c12" },
  combat: { name: "Combat", color: "#e74c3c" },
  elemental: { name: "Elemental", color: "#27ae60" },
};

// Get power definition by ID
export const getPowerDefinition = (powerId) => {
  return (
    POWER_DEFINITIONS[powerId] || {
      id: powerId,
      name: powerId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      description: "A mysterious power",
      icon: "✨",
      category: "utility",
      maxLevel: 1,
    }
  );
};

// Get all powers by category
export const getPowersByCategory = () => {
  const categorized = {};
  Object.values(POWER_DEFINITIONS).forEach((power) => {
    if (!categorized[power.category]) {
      categorized[power.category] = [];
    }
    categorized[power.category].push(power);
  });
  return categorized;
};
