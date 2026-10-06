const express = require('express');
const router = express.Router();
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getStats,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Stats route must come before /:id to avoid "stats" being parsed as an ID
router.get('/stats', getStats);

router.route('/')
  .get(getApplications)
  .post(createApplication);

router.route('/:id')
  .get(getApplication)
  .patch(updateApplication)
  .delete(deleteApplication);

module.exports = router;
