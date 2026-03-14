const express       = require("express");
const cors          = require("cors");
const helmet        = require("helmet");
const rateLimit     = require("express-rate-limit");
const path          = require("path");
const connectDB     = require("./config/db");
const errorHandler  = require("./middleware/errorHandler");
require("dotenv").config();

const app = express();

// ─── Connexion MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── CORS — autorise le frontend React ───────────────────────────────────────
const envOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || "").split(","),
]
  .map((origin) => origin && origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    "http://localhost:5173",
    "http://localhost:3000",
    ...envOrigins,
  ])
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origine non autorisée par CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Sécurité & parsing ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir les fichiers uploadés comme fichiers statiques
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use("/api", limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth",        require("./routes/auth"));
app.use("/api/v1/courses",     require("./routes/courses"));
app.use("/api/v1/modules",     require("./routes/modules"));
app.use("/api/v1/enrollments", require("./routes/enrollments"));
app.use("/api/v1/progress",    require("./routes/progress"));
app.use("/api/v1/quizzes",     require("./routes/quizzes"));
app.use("/api/v1/exercises",   require("./routes/exercises"));
app.use("/api/v1/reviews",     require("./routes/reviews"));
app.use("/api/v1/admin",       require("./routes/admin"));

// ─── Route de santé ───────────────────────────────────────────────────────────
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "OK", message: "LearnHub API is running" });
});

// ─── Gestion des erreurs ──────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 LearnHub API démarré sur le port ${PORT}`);
  console.log("🌍 CORS autorisé pour :", allowedOrigins.join(", "));
});

module.exports = app;
