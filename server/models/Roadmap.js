const mongoose = require("mongoose");
const roadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  careerTitle: { type: String, required: true },
  completedMilestones: { type: [Number], default: [] },
}, { timestamps: true });
roadmapSchema.index({ userId: 1, careerTitle: 1 }, { unique: true });
module.exports = mongoose.model("Roadmap", roadmapSchema);
