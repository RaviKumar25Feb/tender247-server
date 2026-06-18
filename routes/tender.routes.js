const express = require("express");
const router = express.Router();

const {
  getTenders,
  getTenderById,
  getStates,
  getCities,
  getStats,
  triggerTenderSync,
} = require("../controllers/tender.controller");

router.get("/", getTenders);

router.get("/stats", getStats);

router.get("/states", getStates);

router.get("/cities", getCities);

router.get("/sync-tenders", triggerTenderSync);

// ALWAYS KEEP THIS LAST
router.get("/:id", getTenderById);

module.exports = router;