// NPCs and World Map
export const NPCs = {
  "Ernest Hemingway": {
    name: "Ernest Hemingway",
    sprite: "/assets/npcs/hemingway.png",
    apiType: "quotes",
    dialogueStyle: "direct",
    themes: ["writing", "courage", "life"],
  },
  // ... rest of NPCs ...
};

// All NPCs from maps (extracted from individual map definitions)
// This contains all the detailed NPC instances that appear on specific maps
export const MAP_NPCS = {
  // NPCs from Overworld maps
  overworld: [
    {
      id: "shakespeare-overworld",
      name: "William Shakespeare",
      type: "SHAKESPEARE",
      position: { x: 256, y: 512 },
      sprite: "/assets/npcs/shakespeare.webp",
      patrolArea: {
        startX: 64,
        startY: 384,
        width: 448,
        height: 384,
      },
      dialogue: [
        "All the world's a stage, and all the men and women merely players. (As You Like It, Act II, Scene VII)",
        "To be, or not to be: that is the question. (Hamlet, Act III, Scene I)",
        "The course of true love never did run smooth. (A Midsummer Night's Dream, Act I, Scene I)",
        "We know what we are, but know not what we may be. (Hamlet, Act IV, Scene V)",
        "Though this be madness, yet there is method in't. (Hamlet, Act II, Scene II)",
      ],
      quest: {
        id: "shakespeare_overworld_quest",
        title: "The Tempest's Trial",
        description:
          "Clear the Overworld of all threats to prove your valor, then witness the tragic finale of Hamlet",
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
    },
    {
      id: "john_muir1",
      name: "John Muir",
      area: "Overworld",
      position: { x: 384, y: 832 },
      sprite: "/assets/npcs/john_muir.webp",
      patrolArea: {
        startX: 192,
        startY: 832,
        width: 640,
        height: 256,
      },
      dialogue: [
        "The mountains are calling and I must go. (Letter to his sister Sarah Muir, 1873)",
        "In every walk with nature one receives far more than he seeks. (Unpublished journals, circa 1877)",
        "The clearest way into the Universe is through a forest wilderness. (John of the Mountains, 1938)",
        "When one tugs at a single thing in nature, he finds it attached to the rest of the world. (My First Summer in the Sierra, 1911)",
        "The world is big and I want to have a good look at it before it gets dark. (Letter to his sister, 1873)",
      ],
    },
  ],

  // NPCs from Desert maps
  desert1: [
    {
      id: "alexander_pope",
      name: "Alexander Pope",
      type: "ALEXANDER_POPE",
      position: { x: 256, y: 192 },
      sprite: "/assets/npcs/alexander_pope.svg",
      patrolArea: {
        startX: 128,
        startY: 128,
        width: 256,
        height: 256,
      },
      dialogue: [
        "To err is human, to forgive divine. (An Essay on Criticism, 1711)",
        "Know then thyself, presume not God to scan; The proper study of mankind is man. (An Essay on Man, 1733)",
        "Hope springs eternal in the human breast; Man never is, but always to be blessed. (An Essay on Man, 1734)",
        "A little learning is a dangerous thing; Drink deep, or taste not the Pierian spring. (An Essay on Criticism, 1711)",
        "Fools rush in where angels fear to tread. (An Essay on Criticism, 1711)",
      ],
      quest: {
        id: "desert_poet_quest",
        title: "Desert Poet's Insight",
        description: "Alexander Pope seeks wisdom in the desert sands",
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
    },
  ],

  desert2: [
    {
      id: "oscar_wilde",
      name: "Oscar Wilde",
      type: "OSCAR_WILDE",
      position: { x: 320, y: 320 },
      sprite: "/assets/npcs/oscar_wilde.svg",
      patrolArea: {
        startX: 192,
        startY: 256,
        width: 320,
        height: 192,
      },
      dialogue: [
        "I can resist everything except temptation. (Lady Windermere's Fan, 1892)",
        "We are all in the gutter, but some of us are looking at the stars. (Lady Windermere's Fan, 1892)",
        "The truth is rarely pure and never simple. (The Importance of Being Earnest, 1895)",
        "To love oneself is the beginning of a lifelong romance. (An Ideal Husband, 1895)",
        "Experience is simply the name we give our mistakes. (Lady Windermere's Fan, 1892)",
      ],
      quest: {
        id: "desert_wit_quest",
        title: "The Wit of the Desert",
        description: "Oscar Wilde seeks beauty in the harshest landscape",
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
    },
  ],

  desert3: [
    {
      id: "ada_lovelace",
      name: "Ada Lovelace",
      type: "ADA_LOVELACE",
      position: { x: 256, y: 256 },
      sprite: "/assets/npcs/ada_lovelace.webp",
      patrolArea: {
        startX: 128,
        startY: 192,
        width: 384,
        height: 256,
      },
      dialogue: [
        "That brain of mine is something more than merely mortal; as time will show. (Letter to her mother, 1843)",
        "The Analytical Engine weaves algebraic patterns, just as the Jacquard loom weaves flowers and leaves. (Notes on the Analytical Engine, 1843)",
        "We may say most aptly, that the Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves. (Notes, 1843)",
        "I do not believe that my father was such a poet as I shall be an Analyst. (Letter, 1844)",
        "Mathematical science shows what is. It is the language of unseen relations between things. (Letter, 1844)",
      ],
      quest: {
        id: "algorithm_quest",
        title: "The First Algorithm",
        description: "Ada Lovelace seeks patterns in the ancient hieroglyphs",
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
    },
  ],

  // NPCs from Overworld 2
  overworld2: [
    {
      id: "zeus_weatherman",
      name: "Zeus the Weatherman",
      type: "ZEUS",
      apiType: "zeus",
      position: { x: 3, y: 3 },
      dialogue: [
        "By my thunderbolts! Today's forecast calls for partly cloudy with a chance of divine intervention!",
        "Expect high-pressure systems over Mount Olympus, with occasional lightning strikes... those are mine, by the way.",
        "Warning: Areas of dense fog in the Underworld region. Cerberus visibility down to three heads.",
        "I am the Thunderer! Here in my cloud-girded hall, what mortal dares challenge the might of Zeus?",
        "Even the gods cannot alter the past, but the future is yet in my power.",
      ],
    },
  ],

  // NPCs from Yosemite
  yosemite: [
    {
      id: "john_muir_yosemite",
      name: "John Muir",
      type: "JOHN_MUIR",
      position: { x: 320, y: 1344 },
      sprite: "/assets/npcs/john_muir.png",
      patrolArea: {
        startX: 256,
        startY: 1024,
        width: 768,
        height: 768,
      },
      dialogue: [
        "Welcome to Yosemite Valley! The grandeur of these peaks never ceases to amaze me.",
        "Have you noticed how the valley seems to tell its own story through its formations?",
        "Every rock, every waterfall has a tale to share with those who listen carefully.",
        "I've discovered three mystical portals in this valley - one leads to a digital realm, another to Hemingway's battleground, and the third to a world of pure narrative.",
        "Each portal offers a unique challenge and wisdom to those who dare to enter.",
      ],
      quest: {
        id: "valley_secrets_quest",
        title: "Valley's Secrets",
        description:
          "Help John Muir document the unique features of Yosemite Valley",
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
    },
  ],

  // NPCs from dungeon/special maps
  hemingway_battleground: [
    {
      id: "hemingway1",
      name: "Ernest Hemingway",
      type: "WRITER",
      position: { x: 2, y: 2 },
      sprite: "/assets/npcs/hemingway.png",
      dialogue: [
        "Write hard and clear about what hurts.",
        "All you have to do is write one true sentence.",
        "The world breaks everyone, and afterward, some are strong at the broken places.",
        "We know what we are, but know not what we may be.",
      ],
    },
  ],
};