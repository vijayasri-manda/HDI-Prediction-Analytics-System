import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";

if (existsSync(".env")) process.loadEnvFile(".env");

const { createHandler } = await import("../api/insights.mjs");

const distDir = resolve("dist");
if (!existsSync(join(distDir, "index.html"))) {
  console.error(
    "Missing dist/index.html. Run `npm run build` before `npm start`.",
  );
  process.exit(1);
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
};

const apiEnv = {
  ...process.env,
  ...(process.env.RENDER && !process.env.NODE_ENV
    ? { NODE_ENV: "production" }
    : {}),
  ...(!process.env.APP_ORIGIN && process.env.RENDER_EXTERNAL_URL
    ? { APP_ORIGIN: process.env.RENDER_EXTERNAL_URL }
    : {}),
};
const insightsHandler = createHandler({ env: apiEnv });

function sendStatic(res, filePath, isHead) {
  const ext = extname(filePath).toLowerCase();
  const isAsset = filePath.startsWith(join(distDir, "assets") + sep);
  const body = readFileSync(filePath);
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    "Content-Length": body.byteLength,
    "Cache-Control":
      ext === ".html"
        ? "no-cache"
        : isAsset
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600",
  });
  res.end(isHead ? undefined : body);
}

const server = createServer((req, res) => {
  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  if (pathname === "/api/insights") {
    insightsHandler(req, res).catch(() => {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end('{"error":"AI service unavailable."}');
      } else if (!res.writableEnded) {
        res.end();
      }
    });
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  const relative = decoded.replace(/^\/+/, "") || "index.html";
  const candidate = resolve(distDir, relative);
  if (candidate !== distDir && !candidate.startsWith(distDir + sep)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const isHead = req.method === "HEAD";
  if (existsSync(candidate) && statSync(candidate).isFile()) {
    sendStatic(res, candidate, isHead);
    return;
  }

  if (!extname(relative) && !relative.startsWith("api/")) {
    sendStatic(res, join(distDir, "index.html"), isHead);
    return;
  }

  res.writeHead(404, SECURITY_HEADERS);
  res.end("Not Found");
});

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 3000;
server.listen(port, host, () => {
  console.log(`HDI Intelligence listening on http://${host}:${port}`);
});

const close = () => {
  server.close(() => process.exit(0));
};
process.on("SIGINT", close);
process.on("SIGTERM", close);
