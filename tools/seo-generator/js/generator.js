"use strict";

function parseSameAs(str){
  if(!str) return [];
  return str.split(/[\r\n,]+/).map(s=>s.trim()).filter(s=>/^https?:\/\//i.test(s));
}

function cfg(targetPath){
  const path = normPath(targetPath || currentSelectedPath || "/");
  const s = site();
  let host = "";
  try { if(s) host = new URL(s).hostname.replace(/^www\./i,""); } catch{}

  const siteName = val("siteName") || host || "Website";
  const defaultTitle = val("title");
  const defaultDesc = val("description");
  const defaultOgTitle = val("ogTitle") || defaultTitle;
  const defaultOgDesc = val("ogDescription") || defaultDesc;
  const defaultOgImage = val("ogImage");
  const defaultTwImage = val("twitterImage") || defaultOgImage;

  const overrides = pageOverrides[path] || {};

  const normP = normPath(path);
  const defaultCanonical = s ? (s + (normP === "/" ? "/" : normP)) : "";

  return {
    site: s,
    path: normP,
    name: siteName,
    title: overrides.title || defaultTitle || siteName,
    desc: overrides.desc || defaultDesc,
    author: val("author"),
    publisher: val("publisher") || siteName,
    canonical: overrides.canonical || defaultCanonical,
    favicon: val("favicon"),
    ogImage: overrides.ogImage || defaultOgImage,
    twitterImage: overrides.twitterImage || defaultTwImage || overrides.ogImage || defaultOgImage,
    theme: val("theme", "#0b0d10"),
    robots: val("robots", "index, follow"),
    schema: val("schemaType", "WebSite"),
    schemaDesc: val("schemaDescription"),
    inLanguage: val("inLanguage", "en"),
    logoUrl: val("logoUrl"),
    sameAs: parseSameAs(val("sameAs")),
    search: checked("searchAction"),
    searchUrl: val("searchUrl"),
    ogTitle: overrides.ogTitle || defaultOgTitle || overrides.title || defaultTitle || siteName,
    ogDesc: overrides.ogDesc || defaultOgDesc || overrides.desc || defaultDesc,
    card: val("twitterCard", "summary_large_image"),
    twitter: val("twitterSite")
  };
}

function jsonLd(path){
  const c = cfg(path);
  const pageUrl = c.canonical || (c.site + c.path);
  const typeId = c.schema.toLowerCase();

  const o = {
    "@context": "https://schema.org",
    "@type": c.schema,
    "@id": pageUrl + "#" + typeId,
    "url": pageUrl,
    "name": c.title || c.name,
    "inLanguage": c.inLanguage || "en"
  };

  if(c.schemaDesc || c.desc) o.description = c.schemaDesc || c.desc;

  if(c.author){
    o.author = {
      "@type": "Person",
      "@id": (c.site || "https://example.com") + "/#person",
      "name": c.author
    };
  }

  if(c.publisher){
    const pub = {
      "@type": "Organization",
      "@id": (c.site || "https://example.com") + "/#organization",
      "name": c.publisher,
      "url": c.site || pageUrl
    };
    if(c.logoUrl){
      pub.logo = {
        "@type": "ImageObject",
        "url": c.logoUrl
      };
    }
    if(c.sameAs && c.sameAs.length){
      pub.sameAs = c.sameAs;
    }
    o.publisher = pub;
  }

  if((c.schema === "Organization" || c.schema === "Person") && c.sameAs && c.sameAs.length){
    o.sameAs = c.sameAs;
  }

  if(c.schema === "WebSite" && c.search && c.searchUrl){
    o.potentialAction = {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": c.searchUrl
      },
      "query-input": "required name=search_term_string"
    };
  }

  return JSON.stringify(o, null, 2);
}

function head(path){
  const c = cfg(path);
  const t = c.title;
  const d = c.desc;
  const ot = c.ogTitle;
  const od = c.ogDesc;
  const pageUrl = c.canonical || (c.site + c.path);

  const lines = ['<title>' + esc(t) + '</title>'];
  if(d) lines.push('<meta name="description" content="' + esc(d) + '">');
  if(c.robots) lines.push('<meta name="robots" content="' + esc(c.robots) + '">');
  if(pageUrl) lines.push('<link rel="canonical" href="' + esc(pageUrl) + '">');
  if(c.author) lines.push('<meta name="author" content="' + esc(c.author) + '">');
  if(c.theme) lines.push('<meta name="theme-color" content="' + esc(c.theme) + '">');
  if(c.favicon) lines.push('<link rel="icon" href="' + esc(c.favicon) + '">');

  lines.push("", "<!-- Open Graph -->");
  lines.push('<meta property="og:type" content="website">');
  lines.push('<meta property="og:title" content="' + esc(ot) + '">');
  lines.push('<meta property="og:description" content="' + esc(od) + '">');
  lines.push('<meta property="og:url" content="' + esc(pageUrl) + '">');
  if(c.name) lines.push('<meta property="og:site_name" content="' + esc(c.name) + '">');
  if(c.ogImage) lines.push('<meta property="og:image" content="' + esc(c.ogImage) + '">');

  lines.push("", "<!-- X / Twitter -->");
  lines.push('<meta name="twitter:card" content="' + esc(c.card) + '">');
  lines.push('<meta name="twitter:title" content="' + esc(ot) + '">');
  lines.push('<meta name="twitter:description" content="' + esc(od) + '">');
  if(c.twitterImage || c.ogImage) lines.push('<meta name="twitter:image" content="' + esc(c.twitterImage || c.ogImage) + '">');
  if(c.twitter) lines.push('<meta name="twitter:site" content="' + esc(c.twitter) + '">');

  lines.push("", "<!-- Structured Data -->");
  lines.push('<script type="application/ld+json">');
  lines.push(jsonLd(path));
  lines.push("<" + "/script>");

  return lines.join("\n");
}

function robotsTxt(){
  const c = cfg("/");
  const baseUrl = c.site || "https://example.com";
  return "User-agent: *\nAllow: /\n\nSitemap: " + baseUrl + "/sitemap.xml\n";
}

function sitemap(){
  const c = cfg("/");
  const baseUrl = c.site || "https://example.com";
  const urls = pages.map(p => {
    let path = normPath(p.path);
    let loc = baseUrl + (path === "/" ? "/" : path);
    let a = ["  <url>", "    <loc>" + xml(loc) + "</loc>"];
    if(p.lastmod) a.push("    <lastmod>" + xml(p.lastmod) + "</lastmod>");
    if(p.changefreq) a.push("    <changefreq>" + xml(p.changefreq) + "</changefreq>");
    if(p.priority !== "") a.push("    <priority>" + xml(p.priority) + "</priority>");
    a.push("  </url>");
    return a.join("\n");
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join("\n") + "\n</urlset>\n";
}

function manifest(){
  const c = cfg("/");
  const o = {
    name: c.name,
    short_name: c.name,
    description: c.desc,
    start_url: "/",
    display: "standalone",
    theme_color: c.theme || "#0b0d10",
    background_color: c.theme || "#0b0d10",
    orientation: "any",
    icons: [
      { src: "assets/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "assets/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      { src: c.favicon || "assets/favicon.ico", sizes: "any", type: "image/x-icon" }
    ]
  };
  return JSON.stringify(o, null, 2) + "\n";
}

function llms(){
  const c = cfg("/");
  const baseUrl = c.site || "https://example.com";
  const s = ["# " + c.name, "", c.desc, "", "Website: " + baseUrl, "", "## Pages", ""];
  for(let p of pages){
    let path = normPath(p.path);
    s.push("- [" + path + "](" + baseUrl + (path === "/" ? "/" : path) + ")");
  }
  return s.join("\n") + "\n";
}

function report(){
  const c = cfg("/");
  const errors = [], warnings = [];
  for(let r of results){
    if(r.error && !r.soft404){
      errors.push(r.url + " — " + r.error);
      continue;
    }
    if(r.status >= 400) errors.push(r.url + " — HTTP " + r.status);
    if(!r.title) warnings.push(r.url + " — missing title");
    else if(r.title.length > 60) warnings.push(r.url + " — title longer than 60 characters (" + r.title.length + " chars)");
    if(!r.description) warnings.push(r.url + " — missing meta description");
    else if(r.description.length > 160) warnings.push(r.url + " — description longer than 160 characters (" + r.description.length + " chars)");
    if(!r.canonical) warnings.push(r.url + " — missing canonical tag");
    if(r.h1 === 0) warnings.push(r.url + " — missing H1");
    if(r.h1 > 1) warnings.push(r.url + " — multiple H1 elements (" + r.h1 + ")");
    if(!r.viewport) warnings.push(r.url + " — missing viewport meta");
    if(!r.lang) warnings.push(r.url + " — missing html lang attribute");
    if(r.missingAlt) warnings.push(r.url + " — " + r.missingAlt + " image(s) missing alt attribute");
    if(r.soft404) warnings.push(r.url + " — server returned homepage content (soft 404)");
  }
  return [
    "STATIC WEBSITE SEO REPORT",
    "==========================",
    "Generated: " + new Date().toISOString(),
    "Site: " + (c.site || "Not specified"),
    "",
    "Discovered URLs: " + seen.size,
    "Analyzed pages: " + results.length,
    "Sitemap entries: " + pages.length,
    "Maximum crawl depth: " + results.reduce((m, r) => Math.max(m, r.depth || 0), 0),
    "",
    "ERRORS",
    "------",
    errors.join("\n") || "None",
    "",
    "WARNINGS",
    "--------",
    warnings.join("\n") || "None"
  ].join("\n") + "\n";
}
