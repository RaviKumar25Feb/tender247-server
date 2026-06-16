require("dotenv").config();
const { dbConnect } = require("./configs/dbConnect");
const { syncCpppTenders } = require("./services/tender.scraper.service");

(async () => {
  try {
    await dbConnect();

    console.log("Starting scraper");

    await syncCpppTenders();

    console.log("Scraper finished");

    process.exit(0);
  } catch (err) {
    console.error(err);

    process.exit(1);
  }
})();
