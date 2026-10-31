import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

test("the Node API loads with only its runtime files from an unrelated working directory", async () => {
  const folder = await mkdtemp(join(tmpdir(), "hdi-function-"));
  try {
    for (const file of ["api/insights.mjs", "shared/inference.mjs", "public/data/model.json"]) {
      const target = join(folder, file);
      await mkdir(join(target, ".."), { recursive: true });
      await copyFile(new URL("../" + file, import.meta.url), target);
    }
    const program = `
      import { pathToFileURL } from 'node:url';
      const { createHandler } = await import(pathToFileURL(process.argv[1]).href);
      const handler = createHandler({ env: { VERCEL: '1', APP_ORIGIN: 'https://hdi.example' },
        fetchImpl: () => { throw new Error('No provider call should occur'); } });
      const response = { statusCode: 0, setHeader() {}, end(body) {
        if (this.statusCode !== 401 || JSON.parse(body).code !== 'missing_api_key') process.exit(1);
        console.log('Isolated production-mode handler loaded and rejected an unauthenticated request.');
      }};
      await handler({ method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://hdi.example' } }, response);
    `;
    const { stdout } = await promisify(execFile)(process.execPath,
      ["--input-type=module", "-e", program, join(folder, "api/insights.mjs")],
      { cwd: tmpdir() });
    assert.match(stdout, /Isolated production-mode handler loaded/);
  } finally {
    assert.equal(resolve(folder, ".."), resolve(tmpdir()));
    assert.match(folder.slice(tmpdir().length), /hdi-function-/);
    await rm(folder, { recursive: true, force: true });
  }
});
