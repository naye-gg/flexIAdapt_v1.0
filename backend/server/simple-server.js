const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

console.log("🚀 Starting FlexiAdapt server...");
console.log("PORT:", PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);

// Basic middleware
app.use(cors());
app.use(express.json());

// Simplest possible health check
app.get("/", (req, res) => {
  console.log("✅ Health check called");
  res.json({ 
    message: "FlexiAdapt Backend is ALIVE!", 
    status: "running",
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Simple test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Test endpoint working!" });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
});

module.exports = app;
