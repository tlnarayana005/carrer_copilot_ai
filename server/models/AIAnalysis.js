const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobApplication',
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
    },
    analysisType: {
      type: String,
      enum: ['match', 'skill-gap', 'interview-prep', 'resume-improvement'],
      required: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    matchedSkills: [String],
    missingSkills: [String],
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    skillGap: {
      highPriority: [{ skill: String, reason: String }],
      mediumPriority: [{ skill: String, reason: String }],
      lowPriority: [{ skill: String, reason: String }],
    },
    interviewQuestions: [
      {
        category: String,
        question: String,
        reason: String,
        difficulty: String,
      },
    ],
    rawResponse: {
      type: String, // Store full LLM response for debugging
    },
  },
  {
    timestamps: true,
  }
);

analysisSchema.index({ applicationId: 1, analysisType: 1 });

module.exports = mongoose.model('AIAnalysis', analysisSchema);
