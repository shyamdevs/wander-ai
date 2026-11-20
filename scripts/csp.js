// Builds the app's Content-Security-Policy from the real API origin.
//
// Why this exists: the policy used to hard-code `connect-src https://*.vercel.app`, which silently
// blocked every API call as soon as the backend sat on a custom domain (the setup DEPLOYMENT.md
// recommends). The origin is public configuration (VITE_API_URL), so the policy is generated from
// it at build time and delivered as a <meta> tag; vercel.json keeps only the directives that do not
// depend on it (script-src, object-src, frame-ancestors, ...), as real response headers.

const NOMINATIM = "https://nominatim.openstreetmap.org";

/** Origin of VITE_API_URL, or null for same-origin ("/api") mode. Throws on an unusable value. */
export function apiOriginFrom(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (raw.startsWith("/")) return null; // relative => same origin
  const url = new URL(raw); // throws on garbage
  if (url.protocol !== "https:" && !(url.protocol === "http:" && /^(localhost|127\.0\.0\.1)$/.test(url.hostname))) {
    throw new Error("VITE_API_URL must be https (http is only allowed for localhost)");
  }
  return url.origin;
}

export function buildCsp({ apiOrigin = null } = {}) {
  const connect = ["'self'", ...(apiOrigin ? [apiOrigin] : []), NOMINATIM];
  // meta-delivered CSP ignores frame-ancestors, so that one lives only in the vercel.json header.
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src ${connect.join(" ")}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/** Vite plugin: prepends the policy as <meta http-equiv> in production builds only (dev needs inline HMR scripts). */
export function cspPlugin(env) {
  return {
    name: "wander-csp",
    apply: "build",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const policy = buildCsp({ apiOrigin: apiOriginFrom(env.VITE_API_URL) });
        return html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
      },
    },
  };
}
