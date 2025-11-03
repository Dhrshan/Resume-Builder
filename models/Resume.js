const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  role: { type: String },
  summary: { type: String },
  skills: [{ type: String }],
  education: [{ type: String }],
  projects: [{ type: String }],           // ✅ Added
  experience: [{ type: String }],
  additional: [{ type: String }]          // ✅ Added
});

module.exports = mongoose.model("Resume", ResumeSchema);
