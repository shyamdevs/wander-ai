const isVercelBuild = process.env.VERCEL === "1";
const api = String(process.env.VITE_API_URL || "").trim();

if (!isVercelBuild && !api) {
  console.log("VITE_API_URL is empty; local/same-origin /api mode is allowed.");
  process.exit(0);
}

if (!api) {
  console.error("Build configuration error: set VITE_API_URL in the Vercel frontend project's Production environment variables.");
  process.exit(1);
}

// Same-origin proxy mode: the frontend project rewrites /api/* to the backend (see DEPLOYMENT.md).
if (api === "/api") {
  console.log("VITE_API_URL=/api: same-origin proxy mode (requires an /api rewrite in client/vercel.json).");
  process.exit(0);
}

try {
  const parsed = new URL(api);
  if (parsed.protocol !== "https:") throw new Error("must use HTTPS");
  if (!parsed.pathname.replace(/\/+$/, "").endsWith("/api")) {
    throw new Error("path must end in /api (example: https://api.example.com/api)");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("must not contain credentials, query parameters, or fragments");
  }
  console.log(`VITE_API_URL configured for ${parsed.origin}${parsed.pathname}`);
} catch (error) {
  console.error(`Invalid VITE_API_URL: ${error.message}`);
  process.exit(1);
}
