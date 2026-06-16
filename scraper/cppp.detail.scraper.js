const { getBetween, getLastBetween } = require("../utils/cppp.parser");

async function scrapeTenderDetail(page) {
  try {
    if (!page || page.isClosed()) {
      throw new Error("Page already closed");
    }

    // safer wait (avoid strict dependency on loadState)
    await page.waitForSelector("body", { timeout: 30000 });

    const text = await page.textContent("body");

    if (!text || !text.trim()) {
      throw new Error("Empty page content");
    }

    // normalize whitespace once (VERY IMPORTANT IMPROVEMENT)
    const cleanText = text.replace(/\s+/g, " ");

    // =========================
    // CORE IDENTIFIER
    // =========================
    const tenderId = getBetween(cleanText, "Tender ID", "Withdrawal Allowed");

    if (!tenderId) {
      console.log("⚠️ Tender ID not found");
      return null;
    }

    // =========================
    // SAFE EXTRACTION HELPERS
    // =========================
    const safeGet = (start, end) => getBetween(cleanText, start, end) || null;

    const safeLastGet = (start, end) =>
      getLastBetween(cleanText, start, end) || null;

    // =========================
    // RETURN STRUCTURED DATA
    // =========================
    return {
      organisation: safeGet("Organisation Chain", "Tender Reference Number"),

      tenderReferenceNumber: safeGet("Tender Reference Number", "Tender ID"),

      tenderId,

      title: safeGet("Title", "Work Description"),

      workDescription: safeGet("Work Description", "NDA/Pre Qualification"),

      tenderValue: safeGet("Tender Value in ₹", "Product Category"),

      location: safeLastGet("Location", "Pincode"),

      emdAmount: safeGet("EMD Amount in ₹", "EMD Exemption Allowed"),

      tenderFee: safeGet("Tender Fee in ₹", "Fee Payable To"),

      // optional debugging meta (VERY USEFUL IN PRODUCTION)
      _meta: {
        extractedAt: new Date(),
        length: cleanText.length,
      },
    };
  } catch (error) {
    console.error("❌ scrapeTenderDetail error:", error.message);
    return null;
  }
}

module.exports = scrapeTenderDetail;
