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

const parseAmount = (value) => {
  if (!value) return null;

  const num = Number(
    value
      .toString()
      .replace(/,/g, "")
      .replace(/[^\d.]/g, ""),
  );

  return isNaN(num) ? null : num;
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

          tenderReferenceNumber: detailData.tenderReferenceNumber,

          title: detailData.title,
          brief: detailData.brief,
          description: detailData.description,

          workDescription: detailData.workDescription,

          organization: detailData.organisation,
          department: detailData.department,

          location: detailData.location,
          city: detailData.city,
          state: detailData.state,

          estimatedCost: parseAmount(detailData.tenderValue),
          emdAmount: parseAmount(detailData.emdAmount),
          tenderFee: parseAmount(detailData.tenderFee),

          publishDate: detailData.publishDate,
          submissionDate: detailData.submissionDate,
          closingDate: detailData.closingDate,

          documents: detailData.documents || [],
          boqItems: detailData.boqItems || [],

          rawData: detailData,
        };

        // =========================
        // NORMALIZE
        // =========================
        const normalizedData = normalizeTender(rawInput);

        // =========================
        // SAVE
        // =========================
        await saveTender({
          ...normalizedData,
          lastScrapedAt: new Date(),
        });

        console.log(`✅ Saved: ${normalizedData.sourceTenderId}`);
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
