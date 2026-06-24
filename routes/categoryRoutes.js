const express = require("express")
const Tender = require("../models/tender.model")
const router = express.Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await Tender.aggregate([
      {
        $group: {
          _id: "$authority",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { count: -1 }, // optional: biggest first
      },
    ]);

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;