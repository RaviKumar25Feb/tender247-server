const scrapeTenderDetail = require("../scraper/cppp.detail.scraper");
const { chromium } = require("playwright");
const normalizeTender = require("../utils/normalizeTender");
const { saveTender } = require("./tender.service");

const createPage = async (browser) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  return { page, context };
};

const syncCpppTenders = async () => {
  console.log("🚀 CPPP SCRAPER STARTED");

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
    ],
  });

  let listPage = null;
  let listContext = null;

  try {
    // =========================
    // LIST PAGE
    // =========================
    const list = await createPage(browser);
    listPage = list.page;
    listContext = list.context;

    await listPage.goto("https://eprocure.gov.in/eprocure/app", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await listPage.waitForSelector("#activeTenders tbody tr", {
      timeout: 60000,
    });

    const rowCount = await listPage.locator("#activeTenders tbody tr").count();

    console.log(`📌 Found ${rowCount} tenders`);

    // =========================
    // PROCESS TENDERS
    // =========================
    for (let i = 0; i < rowCount; i++) {
      let page = null;
      let context = null;

      try {
        console.log(`\n👉 Processing ${i + 1}/${rowCount}`);

        const session = await createPage(browser);
        page = session.page;
        context = session.context;

        if (!browser.isConnected()) {
          throw new Error("Browser disconnected");
        }

        await page.goto("https://eprocure.gov.in/eprocure/app", {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        await page.waitForSelector("#activeTenders tbody tr", {
          timeout: 60000,
        });

        const row = page.locator("#activeTenders tbody tr").nth(i);

        await row.scrollIntoViewIfNeeded();

        await row.locator("a").click({ timeout: 60000 });

        await page.waitForLoadState("networkidle");

        const detailData = await scrapeTenderDetail(page);

        if (!detailData?.tenderId) {
          console.log(`⚠️ Skipping ${i + 1} (no tenderId)`);
          continue;
        }

        // =========================
        // RAW INPUT
        // =========================
        const rawInput = {
          sourcePortal: "CPPP",
          sourceTenderId: detailData.tenderId,
sourceUrl: detailData.sourceUrl,
          tenderReferenceNumber: detailData.tenderReferenceNumber,
          subCategory: detailData.subCategory,
          tenderCategory: detailData.tenderCategory,
          tenderType: detailData.tenderType,
          contractType: detailData.contractType,
          formOfContract: detailData.formOfContract,
          noOfCovers: detailData.noOfCovers,
          bidValidity: detailData.bidValidity,
          periodOfWork: detailData.periodOfWork,
          ndaPreQualification: detailData.ndaPreQualification,
          authorityName: detailData.authorityName,
          address: detailData.address,
          paymentMode: detailData.paymentMode,
          emdPayableTo: detailData.emdPayableTo,
          emdPayableAt: detailData.emdPayableAt,
          bidOpeningPlace: detailData.bidOpeningPlace,
          preBidMeetingPlace: detailData.preBidMeetingPlace,
          preBidMeetingAddress: detailData.preBidMeetingAddress,
          preBidMeetingDate: detailData.preBidMeetingDate,
          bidSubmissionStartDate: detailData.bidSubmissionStartDate,
          documentDownloadStartDate: detailData.documentDownloadStartDate,
          documentDownloadEndDate: detailData.documentDownloadEndDate,
          clarificationStartDate: detailData.clarificationStartDate,
          clarificationEndDate: detailData.clarificationEndDate,
          nitDocument: detailData.nitDocument,
          workItemDocuments: detailData.workItemDocuments,
          title: detailData.title,
          brief: detailData.brief,
          description: detailData.description || detailData.workDescription,

          workDescription: detailData.workDescription,

          organization: detailData.organization,

          department: detailData.department,

          category: detailData.category,

          pincode: detailData.pincode,

          location: detailData.location,

          city: detailData.city,

          state: detailData.state,
          estimatedCost: detailData.estimatedCost || detailData.tenderValue,

          emdAmount: detailData.emdAmount,

          tenderFee: detailData.tenderFee,

          publishDate: detailData.publishDate,

          submissionDate:
            detailData.submissionDate || detailData.rawData?.submissionDate,

          openingDate:
            detailData.openingDate || detailData.rawData?.openingDate,

          closingDate:
            detailData.closingDate || detailData.rawData?.closingDate,

          documents: detailData.documents || [],

          boqItems: detailData.boqItems || [],

          rawData: detailData.rawData || {},
        };
        // =========================
        // NORMALIZE
        // =========================
        const normalizedData = normalizeTender(rawInput);
        // =========================
        // SAVE
        // =========================
        const res = await saveTender({
          ...normalizedData,
          lastScrapedAt: new Date(),
        });

        console.log(`✅ Saved: ${res}`);
        
      } catch (err) {
        console.error(`❌ Tender ${i + 1} failed:`, err.message);
      } finally {
        try {
          if (context) await context.close();
        } catch {}
      }
    }

    return {
      success: true,
      message: "Sync completed successfully",
      total: rowCount,
    };
  } catch (error) {
    console.error("🔥 CPPP Sync Error:", error.message);
    throw error;
  } finally {
    try {
      if (listContext) await listContext.close();
    } catch {}

    try {
      if (browser.isConnected()) {
        await browser.close();
      }
    } catch {}
  }
};

module.exports = {
  syncCpppTenders,
};
