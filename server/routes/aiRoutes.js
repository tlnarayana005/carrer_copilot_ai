const express = require('express');
const router = express.Router();
const {
  embedResume,
  analyzeMatch,
  skillGap,
  interviewQuestions,
  askResume,
  resumeImprovement,
  getAnalysis,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.post('/embed', embedResume);
router.post('/analyze-match', analyzeMatch);
router.post('/skill-gap', skillGap);
router.post('/interview-questions', interviewQuestions);
router.post('/ask-resume', askResume);
router.post('/resume-improvement', resumeImprovement);
router.get('/analysis/:applicationId', getAnalysis);

module.exports = router;
