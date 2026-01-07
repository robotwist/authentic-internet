// Skill Tree System for Authentic Internet
// Provides meaningful character progression with different specializations

export const SKILL_TREES = {
  EXPLORER: {
    id: "explorer",
    name: "Explorer",
    description: "Master of discovery and world navigation",
    icon: "🗺️",
    color: "#4CAF50",
    skills: {
      PATHFINDER: {
        id: "pathfinder",
        name: "Pathfinder",
        description: "Discover hidden areas and secret passages",
        maxLevel: 5,
        cost: [1, 2, 3, 4, 5],
        effects: [
          "10% chance to find hidden areas",
          "20% chance to find hidden areas",
          "30% chance to find hidden areas + secret passages",
          "40% chance to find hidden areas + treasure maps",
          "50% chance to find hidden areas + legendary locations",
        ],
        requirements: [],
      },
      TREASURE_HUNTER: {
        id: "treasure_hunter",
        name: "Treasure Hunter",
        description: "Enhanced artifact discovery and collection",
        maxLevel: 5,
        cost: [1, 2, 3, 4, 5],
        effects: [
          "15% bonus experience from artifacts",
          "25% bonus experience + rare artifact chance",
          "35% bonus experience + legendary artifact chance",
          "45% bonus experience + artifact quality boost",
          "50% bonus experience + exclusive artifacts",
        ],
        requirements: ["pathfinder"],
      },
      WORLD_KNOWLEDGE: {
        id: "world_knowledge",
        name: "World Knowledge",
        description: "Deep understanding of game world lore",
        maxLevel: 3,
        cost: [2, 3, 4],
        effects: [
          "Access to historical artifact information",
          "NPCs share more detailed stories",
          "Unlock ancient world secrets",
        ],
        requirements: ["treasure_hunter"],
      },
    },
  },

  CREATOR: {
    id: "creator",
    name: "Creator",
    description: "Master of artifact creation and innovation",
    icon: "🎨",
    color: "#FF9800",
    skills: {
      ARTISAN: {
        id: "artisan",
        name: "Artisan",
        description: "Enhanced artifact creation abilities",
        maxLevel: 5,
        cost: [1, 2, 3, 4, 5],
        effects: [
          "10% bonus experience from creating artifacts",
          "20% bonus + unlock advanced creation tools",
          "30% bonus + unlock collaborative creation",
          "40% bonus + unlock AI-assisted creation",
          "50% bonus + unlock legendary creation mode",
        ],
        requirements: [],
      },
      INNOVATOR: {
        id: "innovator",
        name: "Innovator",
        description: "Create unique and innovative artifacts",
        maxLevel: 5,
        cost: [1, 2, 3, 4, 5],
        effects: [
          "Unlock new artifact types",
          "Unlock advanced artifact features",
          "Unlock interactive artifact elements",
          "Unlock multiplayer artifact creation",
          "Unlock legendary artifact templates",
        ],
        requirements: ["artisan"],
      },
      MENTOR: {
        id: "mentor",
        name: "Mentor",
        description: "Guide other creators and share knowledge",
        maxLevel: 3,
        cost: [2, 3, 4],
        effects: [
          "Can mentor new creators",
          "Earn experience from mentoring",
          "Unlock exclusive mentor rewards",
        ],
        requirements: ["innovator"],
      },
    },
  },

  SOCIAL: {
    id: "social",
    name: "Social",
    description: "Master of community and collaboration",
    icon: "🤝",
    color: "#2196F3",
    skills: {
      NETWORKER: {
        id: "networker",
        name: "Networker",
        description: "Build connections and expand your network",
        maxLevel: 5,
        cost: [1, 2, 3, 4, 5],
        effects: [
          "10% bonus experience from social interactions",
          "20% bonus + increased friend limit",
          "30% bonus + unlock group activities",
          "40% bonus + unlock community events",
          "50% bonus + unlock exclusive social features",
        ],
        requirements: [],
      },
      COLLABORATOR: {
        id: "collaborator",
        name: "Collaborator",
        description: "Work together with other players",
        maxLevel: 5,
        cost: [1, 2, 3, 4, 5],
        effects: [
          "Unlock collaborative artifact creation",
          "Unlock shared world building",
          "Unlock team challenges",
          "Unlock guild creation",
          "Unlock legendary collaborations",
        ],
        requirements: ["networker"],
      },
      LEADER: {
        id: "leader",
        name: "Leader",
        description: "Lead communities and organize events",
        maxLevel: 3,
        cost: [2, 3, 4],
        effects: [
          "Can create and lead guilds",
          "Organize community events",
          "Unlock exclusive leadership rewards",
        ],
        requirements: ["collaborator"],
      },
    },
  },

  COMBAT: {
    id: "combat",
    name: "Combat",
    description: "Master of strategic battles and challenges",
    icon: "⚔️",
    color: "#F44336",
    skills: {
      WARRIOR: {
        id: "warrior",
        name: "Warrior",
        description: "Enhanced combat abilities and strategy",
        maxLevel: 5,
        cost: [1, 2, 3, 4, 5],
        effects: [
          "10% bonus experience from combat",
          "20% bonus + unlock advanced combat moves",
          "30% bonus + unlock special abilities",
          "40% bonus + unlock legendary weapons",
          "50% bonus + unlock ultimate abilities",
        ],
        requirements: [],
      },
      TACTICIAN: {
        id: "tactician",
        name: "Tactician",
        description: "Strategic thinking and battle planning",
        maxLevel: 5,
        cost: [1, 2, 3, 4, 5],
        effects: [
          "Unlock tactical advantages",
          "Unlock team coordination bonuses",
          "Unlock battlefield control",
          "Unlock strategic planning tools",
          "Unlock legendary tactics",
        ],
        requirements: ["warrior"],
      },
      CHAMPION: {
        id: "champion",
        name: "Champion",
        description: "Elite warrior and tournament master",
        maxLevel: 3,
        cost: [2, 3, 4],
        effects: [
          "Can participate in tournaments",
          "Unlock exclusive combat rewards",
          "Become a legendary champion",
        ],
        requirements: ["tactician"],
      },
    },
  },
};

// Skill point calculation
export const calculateSkillPoints = (level) => {
  return Math.floor(level * 1.5) + Math.floor(level / 5) * 2;
};

// Get available skills for a user
export const getAvailableSkills = (userSkills, userLevel) => {
  const available = [];
  const totalSkillPoints = calculateSkillPoints(userLevel);
  const usedSkillPoints = Object.values(userSkills).reduce(
    (sum, skill) => sum + skill.level,
    0,
  );
  const remainingPoints = totalSkillPoints - usedSkillPoints;

  Object.values(SKILL_TREES).forEach((tree) => {
    Object.values(tree.skills).forEach((skill) => {
      const currentLevel = userSkills[skill.id]?.level || 0;
      const canUpgrade =
        currentLevel < skill.maxLevel &&
        remainingPoints >= skill.cost[currentLevel];

      // Check requirements
      const requirementsMet = skill.requirements.every((req) => {
        const reqSkill = userSkills[req];
        return reqSkill && reqSkill.level > 0;
      });

      if (canUpgrade && requirementsMet) {
        available.push({
          ...skill,
          treeId: tree.id,
          treeName: tree.name,
          treeIcon: tree.icon,
          treeColor: tree.color,
          currentLevel,
          cost: skill.cost[currentLevel],
        });
      }
    });
  });

  return available;
};

// Get skill effects for current level
export const getSkillEffect = (skillId, level) => {
  for (const tree of Object.values(SKILL_TREES)) {
    for (const skill of Object.values(tree.skills)) {
      if (skill.id === skillId && level > 0 && level <= skill.effects.length) {
        return skill.effects[level - 1];
      }
    }
  }
  return null;
};

// Calculate total bonuses from skills
export const calculateSkillBonuses = (userSkills) => {
  const bonuses = {
    exploration: 0,
    creation: 0,
    social: 0,
    combat: 0,
    experience: 0,
  };

  Object.entries(userSkills).forEach(([skillId, skillData]) => {
    const level = skillData.level;
    if (level === 0) return;

    // Explorer bonuses
    if (skillId === "pathfinder") {
      bonuses.exploration += level * 10;
    }
    if (skillId === "treasure_hunter") {
      bonuses.experience += level * 10;
    }

    // Creator bonuses
    if (skillId === "artisan") {
      bonuses.creation += level * 10;
      bonuses.experience += level * 10;
    }

    // Social bonuses
    if (skillId === "networker") {
      bonuses.social += level * 10;
      bonuses.experience += level * 10;
    }

    // Combat bonuses
    if (skillId === "warrior") {
      bonuses.combat += level * 10;
      bonuses.experience += level * 10;
    }
  });

  return bonuses;
};
