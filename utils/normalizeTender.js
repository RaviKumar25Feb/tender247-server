const cleanText = (text) => {
  if (!text) return null;

  const cleaned = text.toString().replace(/\s+/g, " ").trim();
  return cleaned || null;
};

const parseNumber = (val) => {
  if (!val) return null;

  const num = Number(
    val
      .toString()
      .replace(/,/g, "")
      .replace(/[^\d.]/g, ""),
  );

  return isNaN(num) ? null : num;
};

// safer date parser
const parseDate = (val) => {
  if (!val) return null;

  const d = new Date(val);

  if (!d || isNaN(d.getTime())) return null;

  return d;
};

const extractState = (data) => {
  return cleanText(data.state || data.location?.state || data.address?.state);
};

const extractCity = (data) => {
  return cleanText(data.city || data.location?.city || data.address?.city);
};

// better keyword generator (filtered)
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
  ]);

  return [
    ...new Set(
      `${title} ${desc}`
        .toLowerCase()
        .split(/\s+/)
        .filter(
          (w) =>
            w && w.length > 2 && !stopWords.has(w) && /^[a-z0-9]+$/.test(w),
        ),
    ),
  ].slice(0, 25);
};

const normalizeTender = (data) => {
  const title = cleanText(data.title);
  const description = cleanText(data.description);

  return {
    // =====================
    // SOURCE
    // =====================
    sourceTenderId: cleanText(data.sourceTenderId || data.tenderId || data.id),

    sourcePortal: data.sourcePortal || "CPPP",

    sourceUrl: cleanText(data.sourceUrl),

    // =====================
    // BASIC INFO
    // =====================
    title,
    brief: cleanText(data.brief),
    description,

    organization: cleanText(data.organization),
    department: cleanText(data.department),

    // =====================
    // LOCATION
    // =====================
    location: cleanText(data.location),
    city: extractCity(data),
    state: extractState(data),
    pincode: cleanText(data.pincode),

    // =====================
    // DATES
    // =====================
    publishDate: parseDate(data.publishDate),
    submissionDate: parseDate(data.submissionDate),
    openingDate: parseDate(data.openingDate),
    closingDate: parseDate(data.closingDate),

    // =====================
    // FINANCIAL
    // =====================
    estimatedCost: parseNumber(data.estimatedCost),
    emdAmount: parseNumber(data.emdAmount),
    tenderFee: parseNumber(data.tenderFee),

    // =====================
    // DOCUMENTS
    // =====================
    documents: Array.isArray(data.documents) ? data.documents : [],
    boqItems: Array.isArray(data.boqItems) ? data.boqItems : [],

    // =====================
    // META
    // =====================
    keywords: generateKeywords(title || "", description || ""),

    status: cleanText(data.status) || "ACTIVE",

    lastScrapedAt: new Date(),

    rawData: data,
  };
};

module.exports = normalizeTender;
