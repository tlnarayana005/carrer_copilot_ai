const express = require('express');
const router = express.Router();
const {
  uploadResume,
  getResumes,
  getResume,
  deleteResume,
  setPrimary,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getResumes)
  .post(upload.single('resume'), uploadResume);

router.route('/:id')
  .get(getResume)
  .delete(deleteResume);

router.patch('/:id/primary', setPrimary);

module.exports = router;
