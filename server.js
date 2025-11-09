// Lightweight HTTP server implementation without Express.
// Keeps existing API surface: POST /api/generate and GET /health with CORS.
const http = require("http");
const { parse: parseUrl } = require("url");
const PostGenerator = require("./postgenerator_advanced");

const PORT = process.env.PORT || 3000;
const generator = new PostGenerator(null);

// Utility: write JSON with headers
function sendJSON(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

// Utility: parse request body as JSON (returns Promise)
function parseJSONBody(req, maxBytes = 1_000_000) {
  // ~1MB limit
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        return resolve({});
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      try {
        const parsed = raw ? JSON.parse(raw) : {};
        resolve(parsed);
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = parseUrl(req.url || "", true);
  const method = req.method || "GET";

  // Handle CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  // Route: Health check
  if (method === "GET" && pathname === "/health") {
    return sendJSON(res, 200, {
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }

  // Route: Generate post
  if (method === "POST" && pathname === "/api/generate") {
    try {
      const body = await parseJSONBody(req);
      const { sport, faculties } = body;
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
      console.log("✅ Post generated successfully");
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
        err.message === "Payload too large" ||
        err.message === "Invalid JSON body"
          ? 400
          : 500;
      return sendJSON(res, status, { success: false, error: err.message });
    }
  }

  // Fallback 404
  sendJSON(res, 404, { error: "Not Found", path: pathname });
});

server.listen(PORT, () => {
  console.log(`\n Server running on http://localhost:${PORT}`);
});

module.exports = server;
