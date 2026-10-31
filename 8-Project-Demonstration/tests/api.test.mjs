import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { createHandler } from "../api/insights.mjs";
const baseline = {
  life_expectancy: 70,
  expected_schooling: 12,
  mean_schooling: 7,
  gni_per_capita: 8000,
};
const body = { baseline, question: "Explain this estimate." };
const visitorKey = "gsk_" + "test_only_".repeat(4);
const env = {
  GROQ_API_KEY: "gsk_" + "owner_test_only_".repeat(3),
  APP_ORIGIN: "https://review.example",
  VERCEL: "1",
  AI_ACCESS_TOKEN: "test-review-code-12345",
};
async function call(handler, overrides = {}) {
  const req = {
    method: "POST",
    headers: {
      origin: env.APP_ORIGIN,
      "content-type": "application/json",
      "x-groq-api-key": visitorKey,
      "x-vercel-forwarded-for": "192.0.2.1",
    },
    body,
    ...overrides,
  };
  let result;
  const headers = {};
  const res = {
    statusCode: 200,
    setHeader: (k, v) => {
      headers[k] = v;
    },
    end: (value) => {
      result = { status: res.statusCode, body: JSON.parse(value), headers };
    },
  };
  await handler(req, res);
  return result;
}
const handler = (options = {}) =>
  createHandler({
    env,
    store: new Map(),
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Test explanation" } }],
      }),
    }),
    ...options,
  });
test("rejects non-POST and wrong content type", async () => {
  assert.equal((await call(handler(), { method: "GET" })).status, 405);
  assert.equal(
    (await call(handler(), { headers: { "content-type": "text/plain" } }))
      .status,
    415,
  );
});
test("rejects cross-origin and missing personal key", async () => {
  assert.equal(
    (
      await call(handler(), {
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call(handler(), {
        headers: { "content-type": "application/json", origin: env.APP_ORIGIN },
      })
    ).status,
    401,
  );
});
test("missing configuration fails safely without upstream access", async () => {
  for (const config of [
    {},
    { ...env, APP_ORIGIN: "" },
    { ...env, APP_ORIGIN: "http://review.example" },
  ]) {
    const response = await call(handler({ env: config }));
    assert.ok([403, 503].includes(response.status));
    assert.ok(!JSON.stringify(response).includes(env.GROQ_API_KEY));
  }
});
test("rejects invalid indicators, null, strings, bad JSON and excessive sizes", async () => {
  for (const value of [
    null,
    { ...body, baseline: { ...baseline, gni_per_capita: null } },
    { ...body, question: "" },
    { ...body, question: "x".repeat(501) },
    "{",
  ])
    assert.equal((await call(handler(), { body: value })).status, 400);
  assert.equal((await call(handler(), { body: "x".repeat(4097) })).status, 413);
});
test("streaming body size limit works without content-length", async () => {
  const req = Readable.from(["x".repeat(4097)]);
  req.method = "POST";
  req.headers = {
    "content-type": "application/json",
    origin: env.APP_ORIGIN,
    "x-groq-api-key": visitorKey,
  };
  let status;
  await handler()(req, {
    setHeader() {},
    set statusCode(v) {
      status = v;
    },
    end() {},
  });
  assert.equal(status, 413);
});
test("server recomputes supplied results and sends only grounded context", async () => {
  let payload;
  const h = handler({
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
      payload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Grounded explanation" } }],
        }),
      };
    },
  });
  const response = await call(h, {
    body: {
      ...body,
      predictedHDI: 999,
      scenario: { ...baseline, mean_schooling: 8 },
    },
  });
  assert.equal(response.status, 200);
  const context = JSON.parse(payload.messages[1].content).context;
  assert.ok(
    context.baseline.predictedHDI > 0 && context.baseline.predictedHDI < 1,
  );
  assert.ok(context.scenario.predictedHDI > 0);
  assert.equal(payload.model, "openai/gpt-oss-20b");
});
test("upstream errors, timeouts and malformed responses degrade gracefully", async () => {
  for (const fetchImpl of [
    async () => {
      throw new Error("timeout");
    },
    async () => ({ ok: false }),
    async () => ({ ok: true, json: async () => ({}) }),
  ]) {
    const response = await call(handler({ fetchImpl }));
    assert.ok([502, 503].includes(response.status));
    assert.match(response.body.error, /results still work/);
  }
});
test("instance throttle blocks seventh request and expires after a minute", async () => {
  let time = 0;
  const h = handler({ now: () => time });
  for (let i = 0; i < 6; i++) assert.equal((await call(h)).status, 200);
  assert.equal((await call(h)).status, 429);
  time = 60001;
  assert.equal((await call(h)).status, 200);
});

test("BYOK needs no owner credentials and never reuses another visitor's key", async () => {
  const seen = [];
  const h = handler({ env: { APP_ORIGIN: env.APP_ORIGIN, VERCEL: "1" }, fetchImpl: async (_url, options) => {
    seen.push(options.headers.Authorization);
    return { ok: true, json: async () => ({ choices: [{ message: { content: options.headers.Authorization } }] }) };
  }});
  const a = await call(h);
  assert.equal(a.status, 200);
  assert.ok(!JSON.stringify(a).includes(visitorKey));
  const other = "gsk_" + "other_test_".repeat(4);
  await call(h, { headers: { origin: env.APP_ORIGIN, "content-type": "application/json", "x-groq-api-key": other } });
  assert.deepEqual(seen, [`Bearer ${visitorKey}`, `Bearer ${other}`]);
  assert.equal((await call(h, { headers: { origin: env.APP_ORIGIN, "content-type": "application/json" } })).status, 401);
});

test("owner fallback is opt-in and requires a strong matching token even locally", async () => {
  const headers = { origin: env.APP_ORIGIN, "content-type": "application/json", "x-ai-access-token": env.AI_ACCESS_TOKEN };
  assert.equal((await call(handler(), { headers })).status, 401);
  assert.equal((await call(handler({ env: { ...env, ALLOW_OWNER_AI: "true" } }), { headers })).status, 200);
  assert.equal((await call(handler({ env: { ...env, VERCEL: "0", ALLOW_OWNER_AI: "true", AI_ACCESS_TOKEN: "short" } }), { headers })).status, 503);
});

test("malformed keys, provider limits and timeouts have safe distinct error codes", async () => {
  const malformed = await call(handler(), { headers: { origin: env.APP_ORIGIN, "content-type": "application/json", "x-groq-api-key": "invalid" } });
  assert.equal(malformed.body.code, "malformed_api_key");
  for (const [status, code] of [[401,"invalid_api_key"],[429,"rate_limited"],[402,"quota_exceeded"],[504,"provider_timeout"]]) {
    const response = await call(handler({ fetchImpl: async () => ({ ok: false, status, json: () => { throw new Error("Provider errors must not be read"); } }) }));
    assert.equal(response.body.code, code);
  }
  assert.equal((await call(handler(), { body: { ...body, question: "   " } })).status, 400);
});
