const Resume = require('../models/Resume');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * @desc    Upload a resume PDF
 * @route   POST /api/resumes
 * @access  Private
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file',
      });
    }

    // Extract text from PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    let extractedText = '';

    try {
      const pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text || '';
    } catch (pdfError) {
      console.error('PDF extraction error:', pdfError.message);
      // Continue even if extraction fails — user can still store the resume
    }

    // Check if this is the user's first resume (make it primary)
    const existingCount = await Resume.countDocuments({ userId: req.user._id });

    const resume = await Resume.create({
      userId: req.user._id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      extractedText,
      isPrimary: existingCount === 0, // First resume is automatically primary
    });

    res.status(201).json({
      success: true,
      resume: {
        _id: resume._id,
        fileName: resume.fileName,
        isPrimary: resume.isPrimary,
        extractedText: resume.extractedText ? 'Text extracted successfully' : 'No text extracted',
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all resumes for logged-in user
 * @route   GET /api/resumes
 * @access  Private
 */
const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .select('-extractedText') // Don't send full text in list view
      .sort('-createdAt')
      .lean();

    res.json({
      success: true,
      resumes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single resume with extracted text
 * @route   GET /api/resumes/:id
 * @access  Private
 */
const getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    res.json({ success: true, resume });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resume
 * @route   DELETE /api/resumes/:id
 * @access  Private
 */
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    // Delete file from disk
    try {
      if (fs.existsSync(resume.filePath)) {
        fs.unlinkSync(resume.filePath);
      }
    } catch (fsError) {
      console.error('Error deleting file:', fsError.message);
    }

    await Resume.deleteOne({ _id: resume._id });

    // If deleted resume was primary, make the most recent one primary
    if (resume.isPrimary) {
      const nextResume = await Resume.findOne({ userId: req.user._id }).sort('-createdAt');
      if (nextResume) {
        nextResume.isPrimary = true;
        await nextResume.save();
      }
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set a resume as primary
 * @route   PATCH /api/resumes/:id/primary
 * @access  Private
 */
const setPrimary = async (req, res, next) => {
  try {
    // Unset current primary
    await Resume.updateMany(
      { userId: req.user._id },
      { isPrimary: false }
    );

    // Set new primary
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isPrimary: true },
      { new: true }
    );

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    res.json({ success: true, resume });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadResume, getResumes, getResume, deleteResume, setPrimary };
