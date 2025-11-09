// Serverless function for /api/health on Vercel

function sendJSON(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.status(statusCode).setHeader("Content-Type", "application/json");
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

  if (method !== "GET") {
    return sendJSON(res, 405, { error: "Method Not Allowed" });
  }

  return sendJSON(res, 200, {
    status: "ok",
    timestamp: new Date().toISOString(),
  });
};
