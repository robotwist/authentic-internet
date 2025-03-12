const mongoose = require("mongoose");

const WorldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  mapData: [[Number]], // Grid-based map representation
  artifacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artifact" }], // Items in this world
  quests: [
    {
      title: { type: String, required: true },
      description: String,
      rewardExp: { type: Number, default: 0 },
      isCompleted: { type: Boolean, default: false }
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("World", WorldSchema);
