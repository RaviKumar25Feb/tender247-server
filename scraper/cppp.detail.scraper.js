const { getBetween, getLastBetween } = require("../utils/cppp.parser");

async function scrapeTenderDetail(page) {
  try {
    if (!page || page.isClosed()) {
      throw new Error("Page already closed");
    }

    await page.waitForSelector("body", {
      timeout: 30000,
    });

    const text = await page.textContent("body");

    if (!text || !text.trim()) {
      throw new Error("Empty page content");
    }

    const cleanText = text.replace(/\s+/g, " ");

    const safeGet = (start, end) =>
      getBetween(cleanText, start, end)?.trim() || null;

    const safeLastGet = (start, end) =>
      getLastBetween(cleanText, start, end)?.trim() || null;

    // =========================
    // CORE IDENTIFIER
    // =========================
    const tenderId = safeGet("Tender ID", "Withdrawal Allowed");

    if (!tenderId) {
      console.log("⚠️ Tender ID not found");
      return null;
    }

    // =========================
    // DOCUMENTS SCRAPING
    // =========================
    const documents = [];

    try {
      const links = await page.locator("a").all();

      for (const link of links) {
        const name = (await link.textContent())?.trim();
        const href = await link.getAttribute("href");

        if (!name || !href) continue;

        const lowerName = name.toLowerCase();

        const isTenderDoc =
          lowerName.includes(".pdf") ||
          lowerName.includes(".xls") ||
          lowerName.includes("boq") ||
          lowerName.includes("download as zip") ||
          lowerName.includes("tendernotice");

        if (!isTenderDoc) continue;

        documents.push({
          name,
          url: href.startsWith("http")
            ? href
            : `https://etenders.gov.in${href}`,
          type:
            lowerName.includes("boq") || lowerName.includes(".xls")
              ? "BOQ"
              : "TENDER_DOC",
        });
      }
    } catch (err) {
      console.log("⚠️ Documents extraction failed");
    }

    // =========================
    // RETURN DATA
    // =========================
    return {
      // BASIC
      organization: safeGet("Organisation Chain", "Tender Reference Number"),

      tenderReferenceNumber: safeGet("Tender Reference Number", "Tender ID"),

      tenderId,

      title: safeGet("Title", "Work Description"),

      workDescription: safeGet("Work Description", "NDA/Pre Qualification"),

      category:
        safeGet("Product Category", "Sub category") ||
        safeGet("Tender Category", "No. of Covers"),

      // FINANCIAL
      estimatedCost: safeGet("Tender Value in ₹", "Product Category"),

      emdAmount: safeGet("EMD Amount in ₹", "EMD Exemption Allowed"),

      tenderFee: safeGet("Tender Fee in ₹", "Fee Payable To"),

      // LOCATION
      location: safeLastGet("Location", "Pincode"),

      pincode: safeGet("Pincode", "Pre Bid Meeting Place"),

      // DATES
      publishDate: safeGet("Published Date", "Bid Opening Date"),

      openingDate: safeGet(
        "Bid Opening Date",
        "Document Download / Sale Start Date",
      ),

      submissionDate: safeGet("Bid Submission End Date", "Tenders Documents"),

      closingDate: safeGet("Bid Submission End Date", "Tenders Documents"),

      // OPTIONAL
      department: safeGet("Tender Inviting Authority", "Name"),

      // DOCUMENTS
      documents,

      // FUTURE
      boqItems: [],

      // DEBUG
      _meta: {
        extractedAt: new Date(),
        pageLength: cleanText.length,
        documentsFound: documents.length,
      },
    };
  } catch (error) {
    console.error("❌ scrapeTenderDetail error:", error.message);

    return null;
  }
}

module.exports = scrapeTenderDetail;
