const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { dbConnect } = require("./configs/dbConnect");
const authRoutes = require("./routes/auth.routes");
const tenderRoutes = require("./routes/tender.routes");
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require("cors");

const allowedOrigins = [
  "http://localhost:5173/",
  "",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

let server;
// ================= MIDDLEWARE =================
app.use(express.json());
app.use(cookieParser());

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.send("<h1>Welcome to Tender247 API</h1>");
});

app.use("/api/auth", authRoutes);
app.use("/api/tenders", tenderRoutes);

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// ================= GLOBAL ERROR HANDLERS =================
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

// ================= GRACEFUL SHUTDOWN =================
const gracefulShutdown = async (signal) => {
  console.log(`⚠️ ${signal} received. Shutting down...`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));

      console.log("✅ HTTP server closed");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Shutdown error:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ================= START SERVER =================
const startServer = async () => {
  try {
    console.log("🚀 Starting server...");

    await dbConnect();

    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);

    process.exit(1);
  }
};

startServer();
