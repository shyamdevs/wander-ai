import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const script = resolve(here, "check-deploy-env.js");
const run = (env) => spawnSync(process.execPath, [script], { env: { ...process.env, ...env }, encoding: "utf8" });

test("local build can use the Vite /api development proxy", () => {
  const result = run({ VERCEL: "", VITE_API_URL: "" });
  assert.equal(result.status, 0, result.stderr);
});

test("Vercel build rejects a missing backend API URL", () => {
  const result = run({ VERCEL: "1", VITE_API_URL: "" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /set VITE_API_URL/);
});

test("Vercel build accepts an HTTPS API URL ending in /api", () => {
  const result = run({ VERCEL: "1", VITE_API_URL: "https://api.example.com/api" });
  assert.equal(result.status, 0, result.stderr);
});

test("Vercel build rejects API URLs that are insecure or not rooted at /api", () => {
  const insecure = run({ VERCEL: "1", VITE_API_URL: "http://api.example.com/api" });
  const wrongPath = run({ VERCEL: "1", VITE_API_URL: "https://api.example.com" });
  assert.notEqual(insecure.status, 0);
  assert.notEqual(wrongPath.status, 0);
});

test("Vercel build accepts the same-origin /api proxy mode but not other relative paths", () => {
  assert.equal(run({ VERCEL: "1", VITE_API_URL: "/api" }).status, 0);
  assert.notEqual(run({ VERCEL: "1", VITE_API_URL: "/backend" }).status, 0);
});
