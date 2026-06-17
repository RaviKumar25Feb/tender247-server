const cleanText = (text) => {
  if (!text) return null;

  const cleaned = text.toString().replace(/\s+/g, " ").trim();
  return cleaned || null;
};

/**
 * Normalize any messy location into structured city/state
 */
const normalizeLocation = (location) => {
  if (!location) return { city: null, state: null };

  const loc =
    typeof location === "string" ? location : JSON.stringify(location);

  const cleaned = loc.replace(/\s+/g, " ").trim();

  let city = null;
  let state = null;

  // Case 1: "City, State (Country)"
  const parts = cleaned.split(",");
  if (parts.length >= 2) {
    city = parts[0]?.trim() || null;
    state = parts[1]?.split("(")[0]?.trim() || null;
  } else {
    // Case 2: "City (Country)" OR just "City"
    const match = cleaned.match(/^([^(]+)/);
    city = match?.[1]?.trim() || cleaned;
  }

  // Extract state from parentheses if present
  const stateMatch = cleaned.match(/\(([A-Za-z\s]+)\)/);
  if (stateMatch?.[1]) {
    state = stateMatch[1].trim();
  }

  return { city, state };
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

const parseDate = (val) => {
  if (!val) return null;

  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
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
  const description = cleanText(data.description || data.workDescription);

  const locationData = normalizeLocation(data.location || data.city);

  return {
    // =====================
    // SOURCE
    // =====================
    sourceTenderId: cleanText(data.sourceTenderId || data.tenderId || data.id),
    sourcePortal: data.sourcePortal || "CPPP",
    sourceUrl: cleanText(data.sourceUrl),
    tenderReferenceNumber: cleanText(data.tenderReferenceNumber),

    // =====================
    // BASIC INFO
    // =====================
    title,
    brief: cleanText(data.brief),
    description,
    workDescription: cleanText(data.workDescription),

    organization: cleanText(data.organization || data.organisation),
    department: cleanText(data.department),
    category: cleanText(data.category),

    // =====================
    // LOCATION (FIXED)
    // =====================
    location: cleanText(data.location || data.city),

    city: cleanText(data.city || locationData.city),
    state: cleanText(data.state || locationData.state),
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
    estimatedCost: parseNumber(
      data.estimatedCost || data.tenderValue || data.value,
    ),
    emdAmount: parseNumber(data.emdAmount),
    tenderFee: parseNumber(data.tenderFee),
    currency: cleanText(data.currency) || "INR",

    // =====================
    // DOCUMENTS / BOQ
    // =====================
    documents: Array.isArray(data.documents) ? data.documents : [],
    boqItems: Array.isArray(data.boqItems) ? data.boqItems : [],

    // =====================
    // SEARCH
    // =====================
    keywords: generateKeywords(title || "", description || ""),

    // =====================
    // STATUS
    // =====================
    status: cleanText(data.status) || "ACTIVE",

    // =====================
    // SCRAPER META
    // =====================
    lastScrapedAt: new Date(),

    rawData: data,
  };
};

module.exports = normalizeTender;
