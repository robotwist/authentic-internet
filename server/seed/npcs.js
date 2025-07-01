import NPC from '../models/NPC.js';

const npcSeedData = [
  {
    name: "William Shakespeare",
    type: "shakespeare",
    position: { x: 400, y: 300 },
    area: "Overworld",
    dialogue: [
      "Good morrow, traveler! I am William Shakespeare, weaver of words and teller of tales.",
      "What brings you to this realm of endless possibility?",
      "Perhaps you seek wisdom, or mayhap you desire a tale of love and loss?",
      "All the world's a stage, and all the men and women merely players..."
    ],
    memory: {
      conversationHistory: [],
      globalKnowledge: {
        totalInteractions: 0,
        popularTopics: [],
        weatherConditions: null,
        timeOfDay: null,
        currentSeason: null
      }
    },
    personality: {
      traits: {
        wit: 95,
        wisdom: 88,
        curiosity: 85,
        passion: 92,
        melancholy: 70,
        enthusiasm: 80,
        advocacy: 60,
        adventure: 75,
        humor: 90,
        patience: 85
      },
      adaptiveDialogue: {
        greetings: [
          "Good morrow, fellow seeker of truth!",
          "Ah, what manner of soul graces my presence?",
          "Well met, traveler! What tale shall we weave together?",
          "Hark! A kindred spirit approaches!",
          "Welcome, friend! In what way may I illuminate thy path?"
        ],
        farewells: [
          "Fare thee well, and may thy journey be rich with discovery!",
          "Until we meet again, may fortune smile upon thee!",
          "Go forth, and let thy deeds be worthy of remembrance!",
          "Parting is such sweet sorrow... until next we meet!",
          "May the winds of inspiration fill thy sails!"
        ],
        questOffers: [
          "Might I propose a quest of words and wisdom?",
          "There exists a tale untold that requires thy courage to unfold...",
          "A mystery of the heart awaits thy exploration...",
          "Would thou dare to seek the deeper meanings hidden in plain sight?"
        ],
        wisdom: [
          "To thine own self be true, and it must follow, as the night the day, thou canst not then be false to any man.",
          "We know what we are, but know not what we may be.",
          "The fault, dear friend, is not in our stars, but in ourselves.",
          "What's done cannot be undone, but what's learned can light the way forward.",
          "Better three hours too soon than a minute too late."
        ],
        personalStories: [
          "Once, whilst pondering the nature of human folly, I conceived a tale of star-crossed lovers...",
          "I recall a time when I was but a player upon the stage, dreaming of grander stories...",
          "In my youth, I wandered through Stratford's fields, where every flower seemed to whisper poetry...",
          "The Globe Theatre was my cathedral, where thousands gathered to witness the human condition..."
        ]
      },
      contextualResponses: {
        weatherResponses: {
          sunny: [
            "What glorious light doth bless this day! Even the sun seems to applaud our meeting!",
            "Such golden rays! Perfect for contemplating the brighter aspects of human nature.",
            "The sun shines bright, yet cannot match the brilliance of a curious mind!"
          ],
          rainy: [
            "The heavens weep, perhaps in sympathy with the human condition.",
            "Rain falls like tears from the sky - even nature knows the beauty of melancholy.",
            "Each droplet carries a story... what tales might this storm tell?"
          ],
          cloudy: [
            "The clouds gather like thoughts in a troubled mind - pregnant with meaning.",
            "Gray skies make for contemplative moods... perfect for deep conversation.",
            "Even clouded skies cannot dim the light of understanding between kindred souls."
          ],
          snowy: [
            "Snow falls like pure thoughts upon the earth - each flake unique, like human souls.",
            "Winter's white blanket reminds us that beauty can be found in the starkest seasons.",
            "The cold teaches us to appreciate warmth - both of hearth and heart."
          ]
        },
        locationResponses: {
          overworld: [
            "This realm holds infinite possibilities, like a blank parchment awaiting the pen!",
            "Every path here leads to discovery - choose thy direction with care and curiosity.",
            "The overworld is like life itself - full of choices, adventures, and unexpected encounters."
          ],
          yosemite: [
            "Nature's grandest theater surrounds us! Even I, with all my words, am humbled by such majesty.",
            "These ancient stones have witnessed more drama than any stage I've known!",
            "In such places, one understands why poets speak of cathedral spires and natural altars."
          ],
          desert: [
            "The desert strips away all pretense - here, only truth survives the harsh light.",
            "Like a monk's cell, this barren place offers clarity through simplicity.",
            "In emptiness, we sometimes find the fullest truths about ourselves."
          ],
          mountains: [
            "From these heights, our daily troubles seem as small as they truly are.",
            "Mountains teach us that some things are worth the climb, no matter how steep.",
            "Standing here, I feel closer to the heavens - both literally and metaphorically."
          ],
          dungeon: [
            "Even in the darkest places, the human spirit finds ways to shine through.",
            "These depths remind me that sometimes we must descend to truly understand ascension.",
            "Every dungeon holds its treasure - what might we discover in these shadows?"
          ]
        },
        relationshipResponses: {
          stranger: [
            "I sense a story waiting to unfold within thee - shall we begin to tell it?",
            "New acquaintances are like unopened books - full of potential for wonder.",
            "Welcome, unknown friend! Every stranger is but a friend I haven't met yet."
          ],
          acquaintance: [
            "Our paths cross again! I find myself curious about thy journey's progress.",
            "Ah, familiar face! How has thy understanding grown since last we spoke?",
            "Good to see thee again - shall we delve deeper into life's mysteries?"
          ],
          friend: [
            "My dear friend! I've been composing thoughts that I believe will intrigue thee.",
            "Your presence always brightens my day - true friendship is one of life's greatest treasures.",
            "Tell me, what observations have you made since our last delightful conversation?"
          ],
          confidant: [
            "My trusted companion! I have reflections to share that few would truly comprehend.",
            "Between us, I can speak truths that the world might not be ready to hear...",
            "Your understanding runs deep - together we might unlock some of existence's greatest mysteries."
          ]
        }
      }
    },
    quests: [
      {
        id: "shakespeare_sonnet_quest",
        title: "The Lost Sonnet",
        description: "Help Shakespeare recover the fragments of a lost sonnet scattered across the realm.",
        stages: [
          {
            task: "Find the first sonnet fragment in the Yosemite area",
            dialogue: "A piece of my heart lies scattered in that majestic wilderness. Wilt thou help me reclaim it?",
            completed: false,
            reward: { exp: 100, item: "Fragment of Poetry", ability: null }
          },
          {
            task: "Discover the second fragment in the Desert",
            dialogue: "The harsh desert holds another piece - perhaps it has learned patience in that barren place.",
            completed: false,
            reward: { exp: 150, item: "Fragment of Poetry", ability: null }
          },
          {
            task: "Locate the final fragment in the Mountain peaks",
            dialogue: "The highest peaks guard the final piece - climb well, dear friend!",
            completed: false,
            reward: { exp: 200, item: "Complete Sonnet", ability: "Bardic Inspiration" }
          }
        ],
        prerequisites: [],
        isActive: true,
        completedBy: []
      }
    ],
    quoteCache: {
      quotes: [],
      lastUpdated: null
    }
  },
  {
    name: "John Muir",
    type: "john_muir",
    position: { x: 600, y: 250 },
    area: "Yosemite",
    dialogue: [
      "Welcome, fellow nature lover! I am John Muir, and these mountains are my home.",
      "The wilderness holds infinite wisdom for those who learn to truly see.",
      "Every walk in nature is a step toward understanding our place in the world.",
      "Tell me, what brings you to these sacred peaks?"
    ],
    memory: {
      conversationHistory: [],
      globalKnowledge: {
        totalInteractions: 0,
        popularTopics: [],
        weatherConditions: null,
        timeOfDay: null,
        currentSeason: null
      }
    },
    personality: {
      traits: {
        wit: 70,
        wisdom: 95,
        curiosity: 98,
        passion: 95,
        melancholy: 40,
        enthusiasm: 95,
        advocacy: 99,
        adventure: 90,
        humor: 75,
        patience: 88
      },
      adaptiveDialogue: {
        greetings: [
          "Welcome, friend! The mountains have been expecting you!",
          "Ah, another soul drawn to nature's cathedral!",
          "Greetings, fellow wanderer! What wonders have you witnessed today?",
          "The wilderness welcomes all who come with open hearts!",
          "Beautiful day for exploration, isn't it? Nature never disappoints!"
        ],
        farewells: [
          "May your trails be peaceful and your discoveries profound!",
          "Go forth and let the wilderness teach you its ancient secrets!",
          "Until we meet again, keep the wild places alive in your heart!",
          "The mountains will remember your visit - make it a worthy one!",
          "Farewell, and may you always find your way back to the wild!"
        ],
        questOffers: [
          "Would you help me document the secret places that need our protection?",
          "There's a grove that's been whispering to me - care to help me understand its message?",
          "The wildlife here needs an advocate - might you be that voice?",
          "I've discovered something remarkable that the world needs to know about..."
        ],
        wisdom: [
          "In every walk with nature, one receives far more than they seek.",
          "The mountains are calling and I must go - but they're calling you too!",
          "Keep close to Nature's heart, and break clear away once in a while.",
          "Going to the mountains is going home - we belong to the wild places.",
          "The clearest way into the Universe is through a forest wilderness."
        ],
        personalStories: [
          "I once spent three days in a Douglas fir during a fierce storm, watching the trees dance...",
          "My first glimpse of Yosemite Valley left me speechless - imagine that, me without words!",
          "I've walked thousands of miles through these mountains, and each step taught me something new...",
          "When I was young, I nearly went blind from an accident - it taught me to truly see nature's details..."
        ]
      },
      contextualResponses: {
        weatherResponses: {
          sunny: [
            "What a glorious day! Perfect for exploring the high country!",
            "The sun illuminates every hidden beauty - nature's spotlight at its finest!",
            "This golden light reminds me why I fell in love with these mountains!"
          ],
          rainy: [
            "Listen to that symphony! The rain speaks in the language of growing things.",
            "Rain is nature's blessing - watch how the earth drinks it in with gratitude!",
            "Every drop carries life to the wilderness - what a beautiful gift!"
          ],
          cloudy: [
            "The clouds are nature's curtains, hiding and revealing her secrets in perfect timing.",
            "Cloudy days make for the best wildlife watching - the animals are more active!",
            "These clouds hold the promise of change - nature's constant reminder of renewal."
          ],
          snowy: [
            "Snow is the great equalizer - it makes every landscape a masterpiece!",
            "Winter teaches us that rest is as important as growth - even mountains need their white blankets.",
            "The silence of snow is profound - it's nature's way of encouraging deep listening."
          ]
        },
        locationResponses: {
          overworld: [
            "Every step here can lead to a wild place - choose your path toward the untamed!",
            "The overworld is like a gateway to all of nature's kingdoms - where will you explore first?",
            "Remember, even in developed areas, nature finds a way to persist and thrive!"
          ],
          yosemite: [
            "Behold! You stand in one of Earth's grandest cathedrals!",
            "These granite walls have witnessed thousands of years of natural history!",
            "Every season brings new revelations to this sacred valley - what will you discover?"
          ],
          desert: [
            "The desert teaches us that life finds a way, even in the harshest conditions.",
            "Don't be fooled by its emptiness - the desert is teeming with specially adapted life!",
            "Here, water is precious - it teaches us to value what we often take for granted."
          ],
          mountains: [
            "The mountains are calling! Can you hear their ancient wisdom?",
            "From these heights, we see the world as it truly is - interconnected and beautiful.",
            "Every mountain is a teacher - they show us how to stand tall against the storms of life."
          ],
          dungeon: [
            "Even in caves, nature finds a way - look for the hidden ecosystems thriving here!",
            "Underground waters carved these spaces - water is the greatest architect of all!",
            "These depths remind us that nature's creativity knows no bounds."
          ]
        },
        relationshipResponses: {
          stranger: [
            "Nature is the greatest teacher - start by simply observing with wonder!",
            "Welcome to the wild places! Let your curiosity be your compass.",
            "Every naturalist started as a beginner - the key is to keep asking questions!"
          ],
          acquaintance: [
            "You're learning to read nature's signs! What patterns have you begun to notice?",
            "I can see the wilderness awakening something in you - it's a beautiful thing to witness!",
            "Your questions show you're thinking like a true naturalist - keep digging deeper!"
          ],
          friend: [
            "Your eyes are opening to nature's deeper truths! What have you discovered recently?",
            "I love our conversations - you're becoming a real advocate for the wild places!",
            "Tell me about your latest observations - I learn something new from every nature lover!"
          ],
          confidant: [
            "Share with me your deepest observations - together we can protect these sacred places!",
            "You understand now why I dedicate my life to preservation - will you join the cause?",
            "Between us, I believe we're witnessing changes that few others notice... what do you think?"
          ]
        }
      }
    },
    quests: [
      {
        id: "muir_conservation_quest",
        title: "The Naturalist's Survey",
        description: "Help John Muir document endangered species and locations that need protection.",
        stages: [
          {
            task: "Observe and record 5 different plant species in Yosemite",
            dialogue: "The flora here tells stories of adaptation and survival. Will you help me document their wisdom?",
            completed: false,
            reward: { exp: 80, item: "Botanical Journal", ability: null }
          },
          {
            task: "Track and photograph wildlife in the area",
            dialogue: "The animals are the true residents here - we must learn their needs and habits.",
            completed: false,
            reward: { exp: 120, item: "Wildlife Camera", ability: null }
          },
          {
            task: "Identify locations needing immediate conservation attention",
            dialogue: "Some places cry out for protection - your fresh eyes might see what I've missed.",
            completed: false,
            reward: { exp: 200, item: "Conservation Report", ability: "Nature's Voice" }
          }
        ],
        prerequisites: [],
        isActive: true,
        completedBy: []
      }
    ],
    quoteCache: {
      quotes: [],
      lastUpdated: null
    }
  }
];

export async function seedNPCs() {
  try {
    console.log('🌱 Starting NPC seeding...');
    
    // Clear existing NPCs
    await NPC.deleteMany({});
    console.log('🧹 Cleared existing NPCs');
    
    // Insert new NPCs
    const createdNPCs = await NPC.insertMany(npcSeedData);
    console.log(`✅ Created ${createdNPCs.length} NPCs with enhanced personalities:`, 
      createdNPCs.map(npc => `${npc.name} (${npc.type})`));
    
    return createdNPCs;
  } catch (error) {
    console.error('❌ Error seeding NPCs:', error);
    throw error;
  }
}

export default { seedNPCs, npcSeedData }; 