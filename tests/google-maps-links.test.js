import test from "node:test";
import assert from "node:assert/strict";
import { directionsUrl, placeUrl } from "../src/utils/geo.js";

test("directions open from the user's current location without an API key or origin", () => {
  const url = new URL(directionsUrl({
    origin: { latitude: -34.6, longitude: -58.4 },
    destination: { latitude: -34.6037, longitude: -58.3816 },
    mode: "WALK",
  }));
  assert.equal(url.hostname, "www.google.com");
  assert.equal(url.pathname, "/maps/dir/");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("origin"), null);
  assert.equal(url.searchParams.get("travelmode"), "walking");
  assert.equal(url.searchParams.get("destination"), "-34.6037,-58.3816");
  assert.equal(url.searchParams.get("key"), null);
});

test("nearby place links pin the exact coordinates in Google Maps search", () => {
  const url = new URL(placeUrl({ latitude: -34.6037, longitude: -58.3816 }));
  assert.equal(url.hostname, "www.google.com");
  assert.equal(url.pathname, "/maps/search/");
  assert.equal(url.searchParams.get("query"), "-34.6037,-58.3816");
  assert.equal(url.searchParams.get("key"), null);
});
