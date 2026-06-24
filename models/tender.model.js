const mongoose = require("mongoose");

const boqItemSchema = new mongoose.Schema(
  {
    itemNo: Number,
    itemCode: String,
    description: String,
    quantity: Number,
    unit: String,
    rate: Number,
    amount: Number,
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    name: String,
    type: {
      type: String,
      enum: ["TENDER_DOC", "BOQ", "CORRIGENDUM", "OTHER"],
      default: "OTHER",
    },
    url: String,
    fileSize: String,
  },
  { _id: false },
);

const tenderSchema = new mongoose.Schema(
  {
    // =========================
    // SOURCE (IDENTITY LAYER)
    // =========================
    sourceTenderId: {
      type: String,
      required: true,
      trim: true,
    },

    sourcePortal: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    sourceUrl: {
      type: String,
    },

    tenderReferenceNumber: {
      type: String,
      index: true,
    },

    // =========================
    // BASIC INFO
    // =========================
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    brief: String,
    description: String,
    workDescription: String,

    category: {
      type: String,
      index: true,
    },

    organization: {
      type: String,
      index: true,
    },

    department: {
      type: String,
      index: true,
    },

    // =========================
    // LOCATION
    // =========================
    location: String,

    fullLocation: { type: String },

    city: {
      type: String,
      index: true,
    },

    state: {
      type: String,
      index: true,
    },

    pincode: String,

    // =========================
    // DATES (MOST IMPORTANT FOR YOUR USE CASE)
    // =========================
    publishDate: {
      type: Date,
      index: true,
    },

    submissionDate: {
      type: Date,
      index: true,
    },

    closingDate: Date,

    openingDate: Date,

    // =========================
    // FINANCIAL
    // =========================
    estimatedCost: {
      type: Number,
      index: true,
    },

    emdAmount: Number,
    tenderFee: Number,

    currency: {
      type: String,
      default: "INR",
    },

    // =========================
    // DOCUMENTS / BOQ
    // =========================
    documents: [documentSchema],
    boqItems: [boqItemSchema],

    // =========================
    // SEARCH OPTIMIZATION
    // =========================
    keywords: {
      type: [String],
    },

    // =========================
    // STATUS
    // =========================
    status: {
      type: String,
      enum: ["ACTIVE", "CLOSED", "CANCELLED", "AWARDED", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    // =========================
    // CPPP EXTRA DETAILS
    // =========================

    subCategory: String,

    tenderCategory: {
      type: String,
      index: true,
    },

    tenderType: String,

    contractType: String,

    formOfContract: String,

    noOfCovers: Number,

    bidValidity: Number,

    periodOfWork: Number,

    ndaPreQualification: String,

    authorityName: String,

    address: String,

    paymentMode: String,

    emdPayableTo: String,

    emdPayableAt: String,

    bidOpeningPlace: String,

    preBidMeetingPlace: String,

    preBidMeetingAddress: String,

    preBidMeetingDate: Date,

    bidSubmissionStartDate: Date,

    documentDownloadStartDate: Date,

    documentDownloadEndDate: Date,

    clarificationStartDate: Date,

    clarificationEndDate: Date,

    nitDocument: String,

    workItemDocuments: String,

    // =========================
    // SCRAPING META
    // =========================
    lastScrapedAt: {
      type: Date,
      default: Date.now,
    },

    rawData: {
      type: mongoose.Schema.Types.Mixed,
      select: false, // IMPORTANT: hidden by default (performance boost)
    },
  },
  {
    timestamps: true,
  },
);

// =========================
// TEXT SEARCH (OPTIMIZED)
// =========================
tenderSchema.index(
  {
    title: "text",
    organization: "text",
    category: "text",
    city: "text",
    state: "text",
  },

  {
    weights: {
      title: 5,
      organization: 3,
      category: 2,
      city: 1,
      state: 1,
    },
  },
);

// =========================
// UNIQUE IDENTITY INDEX
// =========================
tenderSchema.index(
  {
    sourcePortal: 1,
    sourceTenderId: 1,
  },
  {
    unique: true,
  },
);

// =========================
// PERFORMANCE INDEXES
// =========================
tenderSchema.index({ submissionDate: -1 });
tenderSchema.index({ state: 1, city: 1 });

module.exports = mongoose.model("Tender", tenderSchema);
