const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    isEmbedded: {
      type: Boolean,
      default: false,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: quickly find a user's primary resume
resumeSchema.index({ userId: 1, isPrimary: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
