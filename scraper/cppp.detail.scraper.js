async function scrapeTenderDetail(page) {
  try {
    if (!page || page.isClosed()) {
      throw new Error("Page already closed");
    }

    await page.waitForLoadState("networkidle");
    await page.waitForSelector("body", { timeout: 30000 });

    // =========================
    // EXTRACT ALL LABEL/VALUE FIELDS
    // =========================
    const fields = await page.evaluate(() => {
      const result = {};

      document.querySelectorAll("td.td_caption").forEach((labelTd) => {
        const label = labelTd.innerText?.replace(/\s+/g, " ").trim();

        const valueTd = labelTd.nextElementSibling;

        if (label && valueTd && valueTd.classList.contains("td_field")) {
          result[label] = valueTd.innerText?.replace(/\s+/g, " ").trim();
        }
      });

      return result;
    });

    // =========================
    // TENDER ID CHECK
    // =========================
    const tenderId = fields["Tender ID"];

    if (!tenderId) {
      console.log("⚠️ Tender ID not found");
      return null;
    }

    // =========================
    // DOCUMENTS
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
          lowerName.includes(".xlsx") ||
          lowerName.includes("boq") ||
          lowerName.includes("tendernotice") ||
          lowerName.includes("zip");

        if (!isTenderDoc) continue;

        documents.push({
          name,
          url: href.startsWith("http")
            ? href
            : `https://eprocure.gov.in${href}`,
          type:
            lowerName.includes("boq") ||
            lowerName.includes(".xls") ||
            lowerName.includes(".xlsx")
              ? "BOQ"
              : "TENDER_DOC",
        });
      }
    } catch (err) {
      console.log("⚠️ Documents extraction failed:", err.message);
    }

    // =========================
    // LOCATION
    // =========================
    const location = fields["Location"] || fields["Bid Opening Place"] || null;

    // =========================
    // RETURN
    // =========================
    return {
      // SOURCE
      tenderId,
      tenderReferenceNumber: fields["Tender Reference Number"],

      sourceUrl: page.url(),

      // BASIC
      title: fields["Title"],
      description: fields["Work Description"],
      workDescription: fields["Work Description"],

      organization: fields["Organisation Chain"],
      department:
  fields["Tender Inviting Authority"] ||
  fields["Organisation Chain"]?.split("||")?.slice(-1)[0] ||
  null,

      category: fields["Product Category"] || fields["Tender Category"],

      subCategory: fields["Sub category"],
      tenderCategory: fields["Tender Category"],

      // FINANCIAL
      estimatedCost: fields["Tender Value in ₹"] || fields["Tender Value"],

      emdAmount: fields["EMD Amount in ₹"] || fields["EMD Amount"],

      tenderFee: fields["Tender Fee in ₹"] || fields["Tender Fee"],

      currency: "INR",

      // LOCATION
      location,
      city: location,
      state: null,
      pincode: fields["Pincode"],

      // DATES
      publishDate: fields["Published Date"],

      submissionDate: fields["Bid Submission End Date"],

      openingDate: fields["Bid Opening Date"],

      closingDate: fields["Bid Submission End Date"],

      bidSubmissionStartDate: fields["Bid Submission Start Date"],

      documentDownloadStartDate: fields["Document Download / Sale Start Date"],

      documentDownloadEndDate: fields["Document Download / Sale End Date"],

      clarificationStartDate: fields["Clarification Start Date"],

      clarificationEndDate: fields["Clarification End Date"],

      preBidMeetingDate: fields["Pre Bid Meeting Date"],

      // CONTRACT
      tenderType: fields["Tender Type"],

      contractType: fields["Contract Type"],

      formOfContract: fields["Form Of Contract"] || fields["Form of Contract"],

      noOfCovers: fields["No. of Covers"],

      bidValidity: fields["Bid Validity(Days)"],

      periodOfWork: fields["Period Of Work(Days)"],

      ndaPreQualification: fields["NDA/Pre Qualification"],

      // AUTHORITY
      authorityName: fields["Name"],

      address: fields["Address"],

      paymentMode: fields["Payment Mode"],

      emdPayableTo: fields["EMD Payable To"],

      emdPayableAt: fields["EMD Payable At"],

      // PLACES
      bidOpeningPlace: fields["Bid Opening Place"],

      preBidMeetingPlace: fields["Pre Bid Meeting Place"],

      preBidMeetingAddress: fields["Pre Bid Meeting Address"],

      // DOCUMENT INFO
      nitDocument: fields["NIT Document"],

      workItemDocuments: fields["Work Item Documents"],

      // FILES
      documents,
      boqItems: [],

      // RAW
      rawData: fields,

      _meta: {
        extractedAt: new Date(),
        fieldsFound: Object.keys(fields).length,
        documentsFound: documents.length,
      },
    };
  } catch (error) {
    console.error("❌ scrapeTenderDetail error:", error.message);

    return null;
  }
}

module.exports = scrapeTenderDetail;
