import mongoose from "mongoose";

const QuestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  rewardExp: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false }
});

const WorldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  mapData: [[Number]], // Grid-based map representation
  artifacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artifact" }], // Items in this world
  quests: [QuestSchema], // Quests in this world
}, { timestamps: true });

const World = mongoose.model("World", WorldSchema);
export default World;
