const Tender = require("../models/tender.model");
const { syncCpppTenders } = require("../services/tender.scraper.service");

// =========================
// GET TENDERS (LIST)
// =========================
const getTenders = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      q,
      state,
      city,
      minValue,
      maxValue,
      closingFrom,
      closingTo,
    } = req.query;

    page = Math.max(1, Number(page));
    limit = Math.min(100, Math.max(1, Number(limit)));

    const filter = {};

    // Text Search
    if (q?.trim()) {
      filter.$text = {
        $search: q.trim(),
      };
    }

    // Location Filters
    if (state) filter.state = state;
    if (city) filter.city = city;

    // Cost Filters
    if (minValue || maxValue) {
      filter.estimatedCost = {};

      if (minValue) {
        filter.estimatedCost.$gte = Number(minValue);
      }

      if (maxValue) {
        filter.estimatedCost.$lte = Number(maxValue);
      }
    }

    // Date Filters
    if (closingFrom || closingTo) {
      filter.submissionDate = {};

      if (closingFrom) {
        filter.submissionDate.$gte = new Date(closingFrom);
      }

      if (closingTo) {
        filter.submissionDate.$lte = new Date(closingTo);
      }
    }

    const skip = (page - 1) * limit;

    const [tenders, total] = await Promise.all([
      Tender.find(filter, {
        _id: 1,
        sourceTenderId: 1,

        title: 1,
        brief: 1,

        category: 1,

        organization: 1,
        department: 1,

        state: 1,
        city: 1,

        estimatedCost: 1,

        publishDate: 1,
        submissionDate: 1,

        status: 1,
      })
        .sort({ submissionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Tender.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      data: tenders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// GET SINGLE TENDER
// =========================
const getTenderById = async (req, res) => {
  try {
    const { id } = req.params;

    const tender = await Tender.findById(id).lean();

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tender,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// GET STATES
// =========================
const getStates = async (req, res) => {
  try {
    const states = await Tender.distinct("state");

    return res.status(200).json({
      success: true,
      data: states.filter(Boolean).sort(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// GET CITIES
// =========================
const getCities = async (req, res) => {
  try {
    const filter = {};

    if (req.query.state) {
      filter.state = req.query.state;
    }

    const cities = await Tender.distinct(
      "city",
      filter
    );

    res.status(200).json({
      success: true,
      data: cities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// DASHBOARD STATS
// =========================
const getStats = async (req, res) => {
  try {
    const [totalTenders, activeTenders, states] = await Promise.all([
      Tender.countDocuments(),

      Tender.countDocuments({
        status: "ACTIVE",
      }),

      Tender.distinct("state"),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTenders,
        activeTenders,
        totalStates: states.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// TRIGGER SCRAPER
// =========================
const triggerTenderSync = async (req, res) => {
  try {
    syncCpppTenders().catch((err) => {
      console.error("Scraper failed:", err.message);
    });

    return res.status(202).json({
      success: true,
      message: "Scraper started in background",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getTenders,
  getTenderById,
  getStates,
  getCities,
  getStats,
  triggerTenderSync,
};
