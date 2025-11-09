// Serverless function for /api/generate on Vercel
// Mirrors logic from native server implementation

const PostGenerator = require("../postgenerator_advanced");
const generator = new PostGenerator(null);

function sendJSON(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.status(statusCode).setHeader("Content-Type", "application/json");
  // Basic CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send(body);
}

module.exports = async (req, res) => {
  const method = req.method || "GET";

  if (method === "OPTIONS") {
    res.status(204);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.end();
  }

  if (method !== "POST") {
    return sendJSON(res, 405, { error: "Method Not Allowed" });
  }

  try {
    const { sport, faculties } = req.body || {};
    if (!sport || !Array.isArray(faculties) || faculties.length === 0) {
      return sendJSON(res, 400, {
        success: false,
        error: "sport (string) and faculties (array) are required",
      });
    }

    console.log(`🎨 Generating post for: ${sport}`);
    console.log(`📋 Faculties: ${faculties.join(", ")}`);

    const imageBuffer = await generator.generatePostBuffer(sport, faculties);
    const base64Image = imageBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    return sendJSON(res, 200, {
      success: true,
      sport,
      faculties,
      imageBase64: dataUrl,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("❌ Error generating post:", err.message);
    const status =
      err.message === "Payload too large" || err.message === "Invalid JSON body"
        ? 400
        : 500;
    return sendJSON(res, status, { success: false, error: err.message });
  }
};
