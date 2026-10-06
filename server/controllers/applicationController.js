const JobApplication = require('../models/JobApplication');

/**
 * @desc    Get all applications for the logged-in user
 * @route   GET /api/applications
 * @access  Private
 *
 * Supports: ?status=applied&search=google&sort=-createdAt&page=1&limit=10
 */
const getApplications = async (req, res, next) => {
  try {
    const { status, search, sort, page = 1, limit = 10 } = req.query;

    // Build query — always filter by userId for authorization
    const query = { userId: req.user._id };

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sort (default: newest first)
    const sortOption = sort || '-createdAt';

    const [applications, total] = await Promise.all([
      JobApplication.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      JobApplication.countDocuments(query),
    ]);

    res.json({
      success: true,
      applications,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single application
 * @route   GET /api/applications/:id
 * @access  Private
 */
const getApplication = async (req, res, next) => {
  try {
    const application = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user._id, // Authorization: only own applications
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new application
 * @route   POST /api/applications
 * @access  Private
 */
const createApplication = async (req, res, next) => {
  try {
    const {
      company,
      title,
      jobUrl,
      jobDescription,
      location,
      salary,
      status,
      applicationDate,
      deadline,
      interviewDate,
      notes,
    } = req.body;

    if (!company || !title) {
      return res.status(400).json({
        success: false,
        message: 'Company and job title are required',
      });
    }

    const application = await JobApplication.create({
      userId: req.user._id,
      company,
      title,
      jobUrl,
      jobDescription,
      location,
      salary,
      status,
      applicationDate,
      deadline,
      interviewDate,
      notes,
    });

    res.status(201).json({
      success: true,
      application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an application
 * @route   PATCH /api/applications/:id
 * @access  Private
 */
const updateApplication = async (req, res, next) => {
  try {
    const application = await JobApplication.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id, // Authorization: only own applications
      },
      req.body,
      {
        new: true,            // Return updated document
        runValidators: true,  // Run schema validators on update
      }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an application
 * @route   DELETE /api/applications/:id
 * @access  Private
 */
const deleteApplication = async (req, res, next) => {
  try {
    const application = await JobApplication.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id, // Authorization: only own applications
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard stats for logged-in user
 * @route   GET /api/applications/stats
 * @access  Private
 */
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get counts by status using aggregation
    const statusCounts = await JobApplication.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Convert to a friendly object
    const stats = {
      total: 0,
      saved: 0,
      applied: 0,
      oa: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    statusCounts.forEach((item) => {
      stats[item._id] = item.count;
      stats.total += item.count;
    });

    // Applications this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonth = await JobApplication.countDocuments({
      userId,
      createdAt: { $gte: startOfMonth },
    });

    // Recent applications (last 5)
    const recent = await JobApplication.find({ userId })
      .sort('-createdAt')
      .limit(5)
      .select('company title status applicationDate createdAt')
      .lean();

    res.json({
      success: true,
      stats: {
        ...stats,
        thisMonth,
      },
      recent,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getStats,
};
