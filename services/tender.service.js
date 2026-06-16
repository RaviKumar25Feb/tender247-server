const Tender = require("../models/tender.model");

const saveTender = async (tenderData) => {
  try {
    if (!tenderData?.sourcePortal || !tenderData?.sourceTenderId) {
      throw new Error("Missing required identifiers");
    }

    const result = await Tender.findOneAndUpdate(
      {
        sourcePortal: tenderData.sourcePortal,
        sourceTenderId: tenderData.sourceTenderId,
      },
      {
        $set: {
          ...tenderData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after", // ✅ FIXED HERE
      },
    );

    return result;
  } catch (error) {
    console.error("❌ saveTender failed:", error.message);
    throw error;
  }
};

module.exports = {
  saveTender,
};
