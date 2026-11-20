import test from "node:test";
import assert from "node:assert/strict";
import { apiOriginFrom, buildCsp, cspPlugin } from "../scripts/csp.js";

const connect = (csp) => csp.split("; ").find((d) => d.startsWith("connect-src ")).split(" ").slice(1);

test("custom API domains are allowed by connect-src (previously only *.vercel.app was)", () => {
  const origin = apiOriginFrom("https://api.mytravelsite.test/api");
  assert.equal(origin, "https://api.mytravelsite.test");
  assert.ok(connect(buildCsp({ apiOrigin: origin })).includes("https://api.mytravelsite.test"));
});

test("same-origin mode adds no extra origin and never a wildcard", () => {
  const list = connect(buildCsp({ apiOrigin: apiOriginFrom("") }));
  assert.deepEqual(list, ["'self'", "https://nominatim.openstreetmap.org"]);
  assert.ok(!buildCsp().includes("*"));
  assert.equal(apiOriginFrom("/api"), null);
});

test("rejects unusable API URLs", () => {
  assert.throws(() => apiOriginFrom("http://api.example.org/api"), /https/);
  assert.throws(() => apiOriginFrom("not a url"));
  assert.equal(apiOriginFrom("http://localhost:5000/api"), "http://localhost:5000");
});

test("policy keeps scripts same-origin only", () => {
  const csp = buildCsp({ apiOrigin: "https://api.mytravelsite.test" });
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe/);
});

test("plugin injects the meta tag first in <head> for production builds only", () => {
  const plugin = cspPlugin({ VITE_API_URL: "https://api.mytravelsite.test/api" });
  assert.equal(plugin.apply, "build");
  const out = plugin.transformIndexHtml.handler("<html><head><title>x</title></head></html>");
  assert.match(out, /<head>\s*<meta http-equiv="Content-Security-Policy" content="[^"]*api\.mytravelsite\.test/);
  assert.ok(out.indexOf("Content-Security-Policy") < out.indexOf("<title>"));
});
