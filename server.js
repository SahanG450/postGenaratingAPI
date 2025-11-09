const express = require("express");
const PostGenerator = require("./postgenerator_advanced");

const app = express();
const PORT = process.env.PORT || 3000;


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
app.post("/api/generate", async (req, res) => {
  try {
    const { sport, faculties } = req.body;
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
  console.log(`\n Server running on http://localhost:${PORT}`);
});

module.exports = app;
