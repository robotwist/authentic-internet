// Quest data extracted from NPC objects
export const QUESTS = [
  {
    id: "shakespeare_overworld_quest",
    title: "The Tempest's Trial",
    description:
      "Clear the Overworld of all threats to prove your valor, then witness the tragic finale of Hamlet",
    npc: "William Shakespeare",
    map: "Overworld",
    objectives: [
      "Defeat all enemies in the Overworld",
      "Return to Shakespeare",
      "Complete the Hamlet Finale challenge",
    ],
    requirement: {
      type: "defeat_all_enemies",
      map: "Overworld",
      count: 0,
      completed: false,
    },
    reward: {
      exp: 100,
      item: "Wand of Prospero",
      itemData: {
        name: "Wand of Prospero",
        description:
          "A mystical staff from The Tempest, capable of conjuring storms and bending reality itself",
        type: "MAGIC_WEAPON",
        power: 50,
        special: "conjure_storm",
        sprite: "/assets/items/wand_prospero.png",
      },
    },
    stages: [
      "not_started",
      "enemies_defeated",
      "hamlet_complete",
      "complete",
    ],
  },
  {
    id: "desert_poet_quest",
    title: "Desert Poet's Insight",
    description: "Alexander Pope seeks wisdom in the desert sands",
    npc: "Alexander Pope",
    map: "Desert 1",
    objectives: [
      "Find the Golden Idol",
      "Share your interpretation",
      "Return to Pope",
    ],
    reward: {
      exp: 35,
      item: "Poetic License",
    },
  },
  {
    id: "desert_wit_quest",
    title: "The Wit of the Desert",
    description: "Oscar Wilde seeks beauty in the harshest landscape",
    npc: "Oscar Wilde",
    map: "Desert 2",
    objectives: [
      "Find the Desert Compass",
      "Share a witty observation",
      "Return to Wilde",
    ],
    reward: {
      exp: 40,
      item: "Wit's Compass",
    },
  },
  {
    id: "algorithm_quest",
    title: "The First Algorithm",
    description: "Ada Lovelace seeks patterns in the ancient hieroglyphs",
    npc: "Ada Lovelace",
    map: "Desert 3",
    objectives: [
      "Find the Sandstone Tablet",
      "Decode its patterns",
      "Return to Ada",
    ],
    reward: {
      exp: 50,
      item: "Algorithm Codex",
    },
  },
  {
    id: "valley_secrets_quest",
    title: "Valley's Secrets",
    description:
      "Help John Muir document the unique features of Yosemite Valley",
    npc: "John Muir",
    map: "Yosemite",
    objectives: [
      "Find Nature's Journal",
      "Document three unique valley features",
      "Return to John Muir",
    ],
    reward: {
      exp: 50,
      item: "Conservationist's Badge",
    },
  },
];