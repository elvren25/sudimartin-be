const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const familyRoutes = require("./routes/familyRoutes");

const app = express();
const PORT = process.env.PORT || 5200;

// CORS Configuration
const corsOptions = {
  origin: "*",
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

// Apply CORS middleware

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/families", familyRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Initialize database endpoint
app.post("/api/init-db", async (req, res) => {
  try {
    console.log("🔄 Running database initialization...");
    // Import and run initialize
    const initDb = require("./database/initialize.js");
    res.json({
      success: true,
      message: "Database initialization started",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Init error:", error);
    res.status(500).json({
      success: false,
      message: "Database initialization failed",
      error: error.message,
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n✨ Backend Server Running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health\n`);

  // Test database connection
  const pool = require("./config/database");

  // Initialize database schema on startup (disabled - create tables manually in Railway UI)
  console.log(
    "📌 Note: Database tables must be created manually via Railway Database UI"
  );
  console.log(
    "   Use railway-init.sql as template for CREATE TABLE statements"
  );

  pool
    .getConnection()
    .then((conn) => {
      console.log("✅ Database connected successfully!");
      conn.release();
    })
    .catch((err) => {
      console.error("⚠️  Database connection warning:", err.message);
      // Don't crash, let server run anyway for /api/health
    });
});

module.exports = app;
