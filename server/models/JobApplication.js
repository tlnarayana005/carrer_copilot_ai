const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Job title cannot exceed 200 characters'],
    },
    jobUrl: {
      type: String,
      trim: true,
    },
    jobDescription: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      trim: true,
    },
    salary: {
      type: String, // String because formats vary: "₹10 LPA", "$120k", etc.
      trim: true,
    },
    status: {
      type: String,
      enum: ['saved', 'applied', 'oa', 'interview', 'offer', 'rejected'],
      default: 'saved',
      index: true,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
    },
    interviewDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: quickly get a user's applications sorted by date
applicationSchema.index({ userId: 1, createdAt: -1 });

// Text index for search functionality
applicationSchema.index({ company: 'text', title: 'text' });

module.exports = mongoose.model('JobApplication', applicationSchema);
