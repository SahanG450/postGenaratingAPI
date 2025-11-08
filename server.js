const express = require("express");
const PostGenerator = require("./postgenerator_advanced");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Initialize generator (no server URL needed since we're just generating)
const generator = new PostGenerator(null);

/**
 * POST /api/generate
 * Generate post and return directly to client
 *
 * Request body:
 * {
 *   "sport": "Football",
 *   "faculties": ["Engineering", "Medical", "Arts"]
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "imageBase64": "data:image/png;base64,..."
 * }
 */
app.post("/api/generate", async (req, res) => {
  try {
    const { sport, faculties } = req.body;

    // Validate input
    if (!sport || !Array.isArray(faculties) || faculties.length === 0) {
      return res.status(400).json({
        success: false,
        error: "sport (string) and faculties (array) are required",
      });
    }

    console.log(`🎨 Generating post for: ${sport}`);
    console.log(`📋 Faculties: ${faculties.join(", ")}`);

    // Generate post (creates image buffer)
    const imageBuffer = await generator.generatePostBuffer(sport, faculties);

    // Convert to base64
    const base64Image = imageBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log(`✅ Post generated successfully`);

    // Return directly to client
    res.json({
      success: true,
      sport: sport,
      faculties: faculties,
      imageBase64: dataUrl,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("❌ Error generating post:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `📡 Generate endpoint: POST http://localhost:${PORT}/api/generate`
  );
  console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
  console.log(`Example request:`);
  console.log(`  POST /api/generate`);
  console.log(
    `  Body: { "sport": "Football", "faculties": ["Eng", "Med", "Arts"] }\n`
  );
});

module.exports = app;
