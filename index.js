const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");

const { dbConnect } = require("./configs/dbConnect");
const authRoutes = require("./routes/auth.routes");
const tenderRoutes = require("./routes/tender.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ FIXED: proper allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://your-frontend-domain.com", // replace later
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow tools like Postman (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// middleware
app.use(express.json());
app.use(cookieParser());

// routes
app.get("/", (req, res) => {
  res.send("Tender API Running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/tenders", tenderRoutes);

// health
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// start
dbConnect().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
});