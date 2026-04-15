export type OgPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

// Estrae attributi tipo content="..." o content='...' da un tag <meta>
function attrValue(tag: string, attr: string): string | null {
  const re = new RegExp(`${attr}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
  const m = tag.match(re);
  return (m?.[2] ?? m?.[3] ?? null)?.trim() || null;
}

function decodeHtml(s: string | null): string | null {
  if (!s) return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function findMeta(
  html: string,
  key: string,
  value: string,
): string | null {
  // Match <meta ... key="value" ... content="..."> in either order
  const re = new RegExp(
    `<meta[^>]*${key}\\s*=\\s*["']${value}["'][^>]*>`,
    "i",
  );
  const m = html.match(re);
  if (!m) return null;
  return decodeHtml(attrValue(m[0], "content"));
}

function findTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return decodeHtml(m?.[1] ?? null);
}

function absolutize(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

export async function fetchOg(rawUrl: string): Promise<OgPreview | null> {
  const url = rawUrl.trim();
  if (!url) return null;

  // Validate URL shape and force http/https
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  // Block private / local addresses to avoid SSRF to internal services
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  ) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  let html = "";
  try {
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FoundersClubBot/1.0; +https://foundersclub.it)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      return null;
    }

    // Leggi solo i primi ~300KB: gli OG stanno sempre nel <head>
    const reader = res.body?.getReader();
    if (!reader) return null;
    const decoder = new TextDecoder();
    let total = 0;
    const limit = 300_000;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (total >= limit) {
        try {
          reader.cancel();
        } catch {
          /* ignore */
        }
        break;
      }
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }

  if (!html) return null;

  const title =
    findMeta(html, "property", "og:title") ??
    findMeta(html, "name", "twitter:title") ??
    findTitle(html);

  const description =
    findMeta(html, "property", "og:description") ??
    findMeta(html, "name", "twitter:description") ??
    findMeta(html, "name", "description");

  const imageRaw =
    findMeta(html, "property", "og:image") ??
    findMeta(html, "name", "twitter:image") ??
    findMeta(html, "property", "og:image:url");

  const siteName =
    findMeta(html, "property", "og:site_name") ??
    parsed.hostname.replace(/^www\./, "");

  return {
    url: parsed.toString(),
    title: title?.slice(0, 200) ?? null,
    description: description?.slice(0, 500) ?? null,
    image: absolutize(imageRaw, parsed.toString()),
    siteName: siteName?.slice(0, 120) ?? null,
  };
}
