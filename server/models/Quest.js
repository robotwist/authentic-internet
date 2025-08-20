import mongoose from 'mongoose';

const QuestProgressSchema = new mongoose.Schema({
  questId: {
    type: String,
    required: true
  },
  npcId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NPC',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  stages: [{
    task: String,
    dialogue: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    reward: {
      exp: Number,
      item: String,
      ability: String
    }
  }],
  currentStage: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  totalRewards: {
    exp: {
      type: Number,
      default: 0
    },
    items: [String],
    abilities: [String]
  }
}, {
  timestamps: true
});

const QuestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activeQuests: [QuestProgressSchema],
  completedQuests: [{
    questId: String,
    npcId: mongoose.Schema.Types.ObjectId,
    title: String,
    completedAt: Date,
    totalExp: Number,
    totalItems: [String],
    totalAbilities: [String]
  }],
  questStats: {
    totalQuestsStarted: {
      type: Number,
      default: 0
    },
    totalQuestsCompleted: {
      type: Number,
      default: 0
    },
    totalExpEarned: {
      type: Number,
      default: 0
    },
    totalItemsEarned: {
      type: Number,
      default: 0
    },
    totalAbilitiesEarned: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Method to start a new quest
QuestSchema.methods.startQuest = async function(npcId, questData) {
  const questProgress = {
    questId: questData.id,
    npcId: npcId,
    title: questData.title,
    description: questData.description,
    stages: questData.stages.map(stage => ({
      task: stage.task,
      dialogue: stage.dialogue,
      completed: false,
      reward: stage.reward
    })),
    currentStage: 0,
    isActive: true,
    isCompleted: false,
    startedAt: new Date(),
    totalRewards: {
      exp: 0,
      items: [],
      abilities: []
    }
  };

  this.activeQuests.push(questProgress);
  this.questStats.totalQuestsStarted += 1;
  
  await this.save();
  return questProgress;
};

// Method to complete a quest stage
QuestSchema.methods.completeStage = async function(questId, stageIndex) {
  const quest = this.activeQuests.find(q => q.questId === questId);
  if (!quest || stageIndex >= quest.stages.length) {
    throw new Error('Quest or stage not found');
  }

  const stage = quest.stages[stageIndex];
  if (stage.completed) {
    throw new Error('Stage already completed');
  }

  // Mark stage as completed
  stage.completed = true;
  stage.completedAt = new Date();

  // Add rewards to quest total
  if (stage.reward) {
    if (stage.reward.exp) {
      quest.totalRewards.exp += stage.reward.exp;
    }
    if (stage.reward.item) {
      quest.totalRewards.items.push(stage.reward.item);
    }
    if (stage.reward.ability) {
      quest.totalRewards.abilities.push(stage.reward.ability);
    }
  }

  // Check if all stages are completed
  const allStagesCompleted = quest.stages.every(s => s.completed);
  if (allStagesCompleted) {
    await this.completeQuest(questId);
  } else {
    quest.currentStage = stageIndex + 1;
  }

  await this.save();
  return {
    stage: stage,
    questCompleted: allStagesCompleted,
    rewards: stage.reward
  };
};

// Method to complete an entire quest
QuestSchema.methods.completeQuest = async function(questId) {
  const questIndex = this.activeQuests.findIndex(q => q.questId === questId);
  if (questIndex === -1) {
    throw new Error('Quest not found');
  }

  const quest = this.activeQuests[questIndex];
  quest.isCompleted = true;
  quest.completedAt = new Date();

  // Move to completed quests
  this.completedQuests.push({
    questId: quest.questId,
    npcId: quest.npcId,
    title: quest.title,
    completedAt: quest.completedAt,
    totalExp: quest.totalRewards.exp,
    totalItems: quest.totalRewards.items,
    totalAbilities: quest.totalRewards.abilities
  });

  // Update stats
  this.questStats.totalQuestsCompleted += 1;
  this.questStats.totalExpEarned += quest.totalRewards.exp;
  this.questStats.totalItemsEarned += quest.totalRewards.items.length;
  this.questStats.totalAbilitiesEarned += quest.totalRewards.abilities.length;

  // Update streak
  this.questStats.currentStreak += 1;
  if (this.questStats.currentStreak > this.questStats.longestStreak) {
    this.questStats.longestStreak = this.questStats.currentStreak;
  }

  // Remove from active quests
  this.activeQuests.splice(questIndex, 1);

  await this.save();
  return quest;
};

// Method to get quest progress
QuestSchema.methods.getQuestProgress = function(questId) {
  return this.activeQuests.find(q => q.questId === questId);
};

// Method to get all active quests
QuestSchema.methods.getActiveQuests = function() {
  return this.activeQuests;
};

// Method to get completed quests
QuestSchema.methods.getCompletedQuests = function() {
  return this.completedQuests;
};

// Static method to find or create quest document for user
QuestSchema.statics.findOrCreateForUser = async function(userId) {
  let questDoc = await this.findOne({ userId });
  if (!questDoc) {
    questDoc = new this({
      userId,
      activeQuests: [],
      completedQuests: [],
      questStats: {
        totalQuestsStarted: 0,
        totalQuestsCompleted: 0,
        totalExpEarned: 0,
        totalItemsEarned: 0,
        totalAbilitiesEarned: 0,
        currentStreak: 0,
        longestStreak: 0
      }
    });
    await questDoc.save();
  }
  return questDoc;
};

export default mongoose.model('Quest', QuestSchema);
