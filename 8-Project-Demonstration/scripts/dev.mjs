import { createServer as createHTTP } from "node:http";
import { createServer as createVite } from "vite";
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
const { default: handler } = await import("../api/insights.mjs");
const api = createHTTP((req, res) => {
  if (req.url === "/api/insights")
    handler(req, res).catch(() => {
      res.statusCode = 500;
      res.end('{"error":"AI service unavailable."}');
    });
  else {
    res.statusCode = 404;
    res.end();
  }
});
api.listen(3001, "127.0.0.1");
const vite = await createVite();
await vite.listen();
vite.printUrls();
const close = async () => {
  api.close();
  await vite.close();
  process.exit(0);
};
process.on("SIGINT", close);
process.on("SIGTERM", close);
