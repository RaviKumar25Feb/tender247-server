const Tender = require("../models/tender.model");

const saveTender = async (tenderData) => {
  try {
    if (!tenderData?.sourcePortal) {
      throw new Error("Missing sourcePortal");
    }

    if (!tenderData?.sourceTenderId) {
      throw new Error("Missing sourceTenderId");
    }

    const filter = {
      sourcePortal: tenderData.sourcePortal,
      sourceTenderId: tenderData.sourceTenderId,
    };

    const update = {
      $set: {
        ...tenderData,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };

    const options = {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
      runValidators: true,
    };

    const tender = await Tender.findOneAndUpdate(filter, update, options);

    return tender;
  } catch (error) {
    console.error(
      `❌ saveTender failed [${tenderData?.sourcePortal}:${tenderData?.sourceTenderId}]`,
      error.message,
    );

    throw error;
  }
};

module.exports = {
  saveTender,
};
