const cleanText = (text) => {
  if (text === undefined || text === null) return null;

  const cleaned = String(text).replace(/\s+/g, " ").trim();

  return cleaned || null;
};

/**
 * Normalize location
 */
const normalizeLocation = (location) => {
  if (!location) {
    return {
      city: null,
      state: null,
    };
  }

  const cleaned = String(location).replace(/\s+/g, " ").trim();

  let city = null;
  let state = null;

  const parts = cleaned.split(",");

  if (parts.length >= 2) {
    city = parts[0]?.trim() || null;
    state = parts[1]?.trim() || null;
  } else {
    city = cleaned;
  }

  return {
    city,
    state,
  };
};

/**
 * Parse currency/amount fields
 */
const parseNumber = (val) => {
  if (val === undefined || val === null || val === "") {
    return null;
  }

  const cleaned = String(val).replace(/₹/g, "").replace(/,/g, "").trim();

  const num = Number(cleaned);

  return Number.isFinite(num) ? num : null;
};

/**
 * Parse CPPP dates safely
 *
 * Examples:
 * 18-Jun-2026 06:55 PM
 * 18-Jun-2026
 * 2026-06-18T18:55:00.000Z
 */
const parseDate = (val) => {
  if (!val) return null;

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  const text = String(val).trim();

  const direct = new Date(text);

  if (!isNaN(direct.getTime())) {
    return direct;
  }

  const match = text.match(
    /(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?/i,
  );

  if (!match) return null;

  const months = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  let hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const meridian = match[6];

  if (meridian) {
    if (meridian.toUpperCase() === "PM" && hour < 12) {
      hour += 12;
    }

    if (meridian.toUpperCase() === "AM" && hour === 12) {
      hour = 0;
    }
  }

  return new Date(
    Number(match[3]),
    months[match[2]],
    Number(match[1]),
    hour,
    minute,
  );
};

const generateKeywords = (title = "", desc = "") => {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "are",
    "was",
    "were",
    "has",
    "have",
    "will",
    "shall",
    "into",
    "their",
    "your",
    "our",
    "under",
    "over",
    "than",
    "then",
  ]);

  const text = `${title || ""} ${desc || ""}`;

  return [
    ...new Set(
      text
        .toLowerCase()
        .split(/[\s,.;:()/-]+/)
        .filter((word) => word && word.length > 2 && !stopWords.has(word)),
    ),
  ].slice(0, 25);
};

const normalizeTender = (data) => {
  const title = cleanText(data.title);

  const description = cleanText(data.description || data.workDescription);

  const locationData = normalizeLocation(data.location || data.city);

  return {
    // SOURCE
    sourceTenderId: cleanText(data.sourceTenderId || data.tenderId || data.id),

    subCategory: cleanText(data.subCategory),

    tenderCategory: cleanText(data.tenderCategory),

    tenderType: cleanText(data.tenderType),

    contractType: cleanText(data.contractType),

    formOfContract: cleanText(data.formOfContract),

    noOfCovers: parseNumber(data.noOfCovers),

    bidValidity: parseNumber(data.bidValidity),

    periodOfWork: parseNumber(data.periodOfWork),

    ndaPreQualification: cleanText(data.ndaPreQualification),

    authorityName: cleanText(data.authorityName),

    address: cleanText(data.address),

    paymentMode: cleanText(data.paymentMode),

    emdPayableTo: cleanText(data.emdPayableTo),

    emdPayableAt: cleanText(data.emdPayableAt),

    bidOpeningPlace: cleanText(data.bidOpeningPlace),

    preBidMeetingPlace: cleanText(data.preBidMeetingPlace),

    preBidMeetingAddress: cleanText(data.preBidMeetingAddress),

    preBidMeetingDate: parseDate(data.preBidMeetingDate),

    bidSubmissionStartDate: parseDate(data.bidSubmissionStartDate),

    documentDownloadStartDate: parseDate(data.documentDownloadStartDate),

    documentDownloadEndDate: parseDate(data.documentDownloadEndDate),

    clarificationStartDate: parseDate(data.clarificationStartDate),

    clarificationEndDate: parseDate(data.clarificationEndDate),

    nitDocument: cleanText(data.nitDocument),

    workItemDocuments: cleanText(data.workItemDocuments),

    sourcePortal: cleanText(data.sourcePortal) || "CPPP",

    sourceUrl: cleanText(data.sourceUrl),

    tenderReferenceNumber: cleanText(data.tenderReferenceNumber),

    // BASIC
    title,

    brief: cleanText(data.brief),

    description,

    workDescription: cleanText(data.workDescription),

    organization: cleanText(data.organization || data.organisation),

    department: cleanText(data.department),

    category: cleanText(data.category),

    // LOCATION
    location: cleanText(data.location || data.city),

    city: cleanText(data.city || locationData.city),

    state: cleanText(data.state || locationData.state),

    pincode: cleanText(data.pincode),

    // DATES
    publishDate: parseDate(data.publishDate),

    submissionDate: parseDate(data.submissionDate),

    openingDate: parseDate(data.openingDate),

    closingDate: parseDate(data.closingDate),

    // FINANCIAL
    estimatedCost: parseNumber(
      data.estimatedCost || data.tenderValue || data.value,
    ),

    emdAmount: parseNumber(data.emdAmount),

    tenderFee: parseNumber(data.tenderFee),

    currency: cleanText(data.currency) || "INR",

    // DOCUMENTS
    documents: Array.isArray(data.documents) ? data.documents : [],

    boqItems: Array.isArray(data.boqItems) ? data.boqItems : [],

    // SEARCH
    keywords: generateKeywords(title, description),

    // STATUS
    status: cleanText(data.status) || "ACTIVE",

    // META
    lastScrapedAt: new Date(),

    rawData: data.rawData || {},
  };
};

module.exports = normalizeTender;
