"use strict";

async function fetchWithCors(url, opts = { redirect: "follow", cache: "no-store", credentials: "omit" }){
  try{
    const r = await fetch(url, opts);
    if(r.ok || (r.status > 0 && r.status !== 0)) return r;
  }catch(e){}

  const templates = [
    "https://api.allorigins.win/raw?url={url}",
    "https://api.allorigins.win/get?url={url}",
    "https://api.codetabs.com/v1/proxy?quest={url}",
    "https://cors.eu.org/{url}",
    "https://corsproxy.org/?{url}"
  ];

  for(const tmpl of templates){
    try{
      const isJsonAllOrigins = tmpl.includes("/get?url=");
      const pUrl = tmpl.replace("{url}", encodeURIComponent(url));
      const res = await fetch(pUrl, { cache: "no-store" });
      if(!res.ok) continue;
      if(isJsonAllOrigins){
        const data = await res.json();
        if(data && data.contents){
          return new Response(data.contents, { status: data.status?.http_code || 200, headers: { "content-type": "text/html; charset=utf-8" } });
        }
      }else{
        const txt = await res.text();
        if(txt && txt.trim()){
          return new Response(txt, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
        }
      }
    }catch(e){}
  }
  throw new Error("CORS / Network Error: Could not fetch URL directly or via CORS proxies.");
}

function parseRobots(txt){
  if(!txt) return [];
  let active = false;
  const out = [];
  for(let raw of txt.split(/\r?\n/)){
    let line = raw.split("#")[0].trim();
    if(!line) continue;
    let i = line.indexOf(":");
    if(i < 0) continue;
    let k = line.slice(0, i).trim().toLowerCase();
    let v = line.slice(i + 1).trim();
    if(k === "user-agent"){
      active = (v === "*" || v.toLowerCase().includes("bot"));
    }else if(active && (k === "allow" || k === "disallow") && v){
      out.push({ k, v });
    }
  }
  return out;
}

function allowed(u){
  if(!robotsRules || !robotsRules.length) return true;
  try{
    let p = new URL(u).pathname || "/";
    let best = -1;
    let allow = true;
    for(let r of robotsRules){
      let pattern = r.v;
      let end = pattern.endsWith("$");
      if(end) pattern = pattern.slice(0, -1);
      let re = new RegExp("^" + pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*") + (end ? "$" : ""));
      if(re.test(p) && pattern.length >= best){
        best = pattern.length;
        allow = (r.k === "allow");
      }
    }
    return allow;
  }catch{
    return true;
  }
}

async function loadRobots(){
  robotsRules = null;
  if(!checked("respectRobots")) return;
  try{
    let s = site();
    if(!s) return;
    let r = await fetchWithCors(new URL("/robots.txt", s).href);
    if(r.ok){
      robotsRules = parseRobots(await r.text());
    }
  }catch{}
}

async function addSitemapSeeds(){
  let s = site();
  if(!s) return;
  const origin = new URL(s).origin;
  const candidates = new Set([new URL("/sitemap.xml", s).href]);
  if(robotsRules){
    try{
      let r = await fetchWithCors(new URL("/robots.txt", s).href);
      if(r.ok){
        for(let line of (await r.text()).split(/\r?\n/)){
          let m = line.match(/^\s*Sitemap:\s*(\S+)/i);
          if(m) candidates.add(m[1]);
        }
      }
    }catch{}
  }
  const visited = new Set();
  while(candidates.size){
    const sm = candidates.values().next().value;
    candidates.delete(sm);
    if(visited.has(sm) || visited.size >= 25) continue;
    visited.add(sm);
    try{
      const r = await fetchWithCors(sm);
      if(!r.ok) continue;
      const doc = new DOMParser().parseFromString(await r.text(), "application/xml");
      if(doc.querySelector("parsererror")) continue;
      for(const loc of doc.querySelectorAll("sitemap > loc")){
        const u = loc.textContent.trim();
        if(u) candidates.add(u);
      }
      for(const loc of doc.querySelectorAll("url > loc")){
        const u = urlKey(loc.textContent.trim(), origin);
        if(u && sameSite(u) && htmlUrl(u) && !seen.has(u)){
          seen.set(u, { url: u, depth: 0, from: "sitemap" });
          queue.push({ url: u, depth: 0, from: "sitemap" });
        }
      }
      stats();
    }catch{}
  }
}

let homepageProfile = null;
function profileFor(doc){
  const norm = s => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
  return {
    title: norm(doc.querySelector("title")?.textContent),
    description: norm(doc.querySelector('meta[name="description"]')?.content),
    h1: [...doc.querySelectorAll("h1")].map(x => norm(x.textContent)).filter(Boolean).join("|"),
    links: [...doc.querySelectorAll("a[href]")].map(a => norm(a.getAttribute("href"))).filter(Boolean).sort().join("\n")
  };
}

async function loadHomepageProfile(){
  homepageProfile = null;
  try{
    const u = urlKey(site(), site());
    if(!u) return;
    const r = await fetchWithCors(u);
    if(!r.ok || !/text\/html/i.test(r.headers.get("content-type") || "")) return;
    homepageProfile = profileFor(new DOMParser().parseFromString(await r.text(), "text/html"));
  }catch{}
}

async function crawlOne(item){
  let response;
  try{
    response = await fetchWithCors(item.url);
  }catch(e){
    results.push({
      url: item.url, depth: item.depth, status: 0, error: e.message || String(e),
      soft404: false, title: "", description: "", canonical: "", noindex: false,
      indexable: false, h1: 0, h1Text: "", links: 0, internal: 0, external: 0,
      missingAlt: 0, images: 0, viewport: false, lang: false, jsonLd: 0
    });
    return;
  }

  const type = response.headers.get("content-type") || "";
  if(!/text\/html/i.test(type)){
    if(checked("nonHtml")){
      results.push({
        url: item.url, depth: item.depth, status: response.status, error: "Non-HTML resource",
        soft404: false, title: "", description: "", canonical: "", noindex: false,
        indexable: false, h1: 0, h1Text: "", links: 0, internal: 0, external: 0,
        missingAlt: 0, images: 0, viewport: false, lang: false, jsonLd: 0
      });
    }
    return;
  }

  let doc;
  try{
    doc = new DOMParser().parseFromString(await response.text(), "text/html");
  }catch(e){
    results.push({
      url: item.url, depth: item.depth, status: response.status, error: e.message || String(e),
      soft404: false, title: "", description: "", canonical: "", noindex: false,
      indexable: false, h1: 0, h1Text: "", links: 0, internal: 0, external: 0,
      missingAlt: 0, images: 0, viewport: false, lang: false, jsonLd: 0
    });
    return;
  }

  const profile = profileFor(doc);
  const root = urlKey(site(), site());
  const soft404 = !!(homepageProfile && item.url !== root && response.status === 200 &&
                    profile.title === homepageProfile.title && profile.description === homepageProfile.description &&
                    profile.h1 === homepageProfile.h1 && profile.links === homepageProfile.links);

  const title = (doc.querySelector("title")?.textContent || "").trim();
  const description = (doc.querySelector('meta[name="description"]')?.getAttribute("content") || "").trim();
  const canonicalRaw = doc.querySelector('link[rel~="canonical"]')?.getAttribute("href") || "";
  const canonical = canonicalRaw ? (urlKey(canonicalRaw, item.url) || canonicalRaw) : "";
  const ogImageRaw = (doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
                      doc.querySelector('meta[name="og:image"]')?.getAttribute("content") ||
                      doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content") || "").trim();

  const itemPath = pathOf(item.url);
  pageOverrides[itemPath] = {
    title,
    desc: description,
    canonical: canonical || (site() + itemPath),
    ogTitle: (doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || title).trim(),
    ogDesc: (doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || description).trim(),
    ogImage: ogImageRaw ? (urlKey(ogImageRaw, item.url) || ogImageRaw) : "",
    twitterImage: (doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content") || "").trim()
  };

  if(item.url === root){
    if(title && $("title")) $("title").value = title;
    if(description && $("description")) $("description").value = description;

    const ogSiteName = (doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content") || "").trim();
    let sName = ogSiteName;
    if(!sName){ try { sName = new URL(site()).hostname.replace(/^www\./i, ""); } catch{} }
    if(sName && $("siteName")) $("siteName").value = sName;

    if($("canonical")) $("canonical").value = canonical || (site() + "/");

    const fav = doc.querySelector('link[rel~="icon"]')?.getAttribute("href") ||
                doc.querySelector('link[rel~="shortcut icon"]')?.getAttribute("href") || "";
    if(fav && $("favicon")){
      try { $("favicon").value = new URL(fav, item.url).href; } catch { $("favicon").value = fav; }
    } else if($("favicon")) {
      $("favicon").value = "/favicon.ico";
    }

    if(ogImageRaw && $("ogImage")){
      try { $("ogImage").value = new URL(ogImageRaw, item.url).href; } catch { $("ogImage").value = ogImageRaw; }
    }

    const twImg = (doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content") || "").trim();
    if(twImg && $("twitterImage")){
      try { $("twitterImage").value = new URL(twImg, item.url).href; } catch { $("twitterImage").value = twImg; }
    }

    const author = (doc.querySelector('meta[name="author"]')?.getAttribute("content") || "").trim();
    if(author && $("author")) $("author").value = author;

    const publisher = (doc.querySelector('meta[property="article:publisher"]')?.getAttribute("content") ||
                       doc.querySelector('meta[name="publisher"]')?.getAttribute("content") || "").trim();
    if(publisher && $("publisher")) $("publisher").value = publisher;

    const theme = (doc.querySelector('meta[name="theme-color"]')?.getAttribute("content") || "").trim();
    if(theme && $("theme")) $("theme").value = theme;

    const rob = (doc.querySelector('meta[name="robots"]')?.getAttribute("content") || "").trim();
    if(rob && $("robots")) $("robots").value = rob;

    const ogTitle = (doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || "").trim();
    if(ogTitle && $("ogTitle")) $("ogTitle").value = ogTitle;

    const ogDesc = (doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || "").trim();
    if(ogDesc && $("ogDescription")) $("ogDescription").value = ogDesc;

    const twCard = (doc.querySelector('meta[name="twitter:card"]')?.getAttribute("content") || "").trim();
    if(twCard && $("twitterCard")) $("twitterCard").value = twCard;

    const twSite = (doc.querySelector('meta[name="twitter:site"]')?.getAttribute("content") ||
                    doc.querySelector('meta[name="twitter:creator"]')?.getAttribute("content") || "").trim();
    if(twSite && $("twitterSite")) $("twitterSite").value = twSite;
  }

  const robots = (doc.querySelector('meta[name="robots"]')?.getAttribute("content") || "") + " " +
                 (doc.querySelector('meta[name="googlebot"]')?.getAttribute("content") || "");
  const noindex = /\bnoindex\b/i.test(robots);
  const h1 = [...doc.querySelectorAll("h1")].map(x => x.textContent.trim()).filter(Boolean);
  const links = [...doc.querySelectorAll("a[href]")];
  let internal = 0, external = 0;

  for(const a of links){
    let u = urlKey(a.getAttribute("href"), item.url);
    if(!u) continue;
    if(sameSite(u)){
      internal++;
      if(!soft404 && htmlUrl(u) && !seen.has(u)){
        seen.set(u, { url: u, depth: item.depth + 1, from: item.url });
        queue.push({ url: u, depth: item.depth + 1, from: item.url });
      }
    } else {
      external++;
    }
  }

  const imgs = [...doc.images];
  results.push({
    url: item.url, depth: item.depth, status: response.status,
    error: soft404 ? "Soft 404: server returned the homepage" : "",
    soft404, title, description, canonical, noindex,
    indexable: response.ok && !noindex && !soft404,
    h1: h1.length, h1Text: h1.slice(0, 2).join(" | "),
    links: links.length, internal, external,
    missingAlt: imgs.filter(i => !i.hasAttribute("alt")).length,
    images: imgs.length, viewport: !!doc.querySelector('meta[name="viewport"]'),
    lang: !!doc.documentElement.getAttribute("lang"),
    jsonLd: doc.querySelectorAll('script[type="application/ld+json"]').length
  });
}

async function crawlSite(){
  if(running) return;
  let s = site();
  try{
    let u = new URL(s);
    if(!/^https?:$/.test(u.protocol)) throw 0;
  }catch{
    status("Enter a valid HTTP or HTTPS website URL.", "error");
    return;
  }

  running = true;
  stopRequested = false;
  results = [];
  queue = [];
  seen.clear();
  robotsRules = null;

  let start = urlKey(s, s);
  if(start){
    seen.set(start, { url: start, depth: 0 });
    queue.push({ url: start, depth: 0 });
  }

  renderResults();
  stats();
  status("Preparing crawl…", "info");

  await scrapeSiteMetadata(s);
  await loadHomepageProfile();
  await loadRobots();
  await addSitemapSeeds();

  const limit = Math.max(1, Math.min(100000, Number(val("maxPages", "10000")) || 10000));
  const delay = Math.max(0, Math.min(10000, Number(val("delay", "0")) || 0));

  while(queue.length && !stopRequested && results.length < limit){
    const item = queue.shift();
    if(!allowed(item.url)){
      results.push({
        url: item.url, depth: item.depth, status: 0, error: "Blocked by robots.txt",
        soft404: false, title: "", description: "", canonical: "", noindex: false,
        indexable: false, h1: 0, h1Text: "", links: 0, internal: 0, external: 0,
        missingAlt: 0, images: 0, viewport: false, lang: false, jsonLd: 0
      });
      stats();
      renderResults();
      continue;
    }
    await crawlOne(item);
    stats();
    renderResults();
    if(delay > 0) await sleep(delay);
  }

  running = false;
  status(stopRequested ? ("Crawl stopped. " + results.length + " page(s) analyzed.") :
         (results.length >= limit && queue.length ? ("Safety limit reached (" + limit + " pages).") :
         ("Crawl complete. " + results.length + " page(s) analyzed.")),
         stopRequested || queue.length ? "warn" : "good");

  useCrawledPages();
  if(typeof updatePageSelectOptions === "function") updatePageSelectOptions();
  renderPages();
  updateAll();
  validate();
}

function stopCrawl(){
  if(running){
    stopRequested = true;
    status("Stopping after the current request…", "warn");
  }
}

async function scrapeSiteMetadata(targetUrl){
  if(!targetUrl) return;
  let formattedUrl = targetUrl.trim();
  if(!/^https?:\/\//i.test(formattedUrl)){ formattedUrl = "https://" + formattedUrl; }
  try{
    let u = new URL(formattedUrl);
    if(!/^https?:$/.test(u.protocol)) return;
    formattedUrl = u.href;
  }catch{ return; }

  const normKey = urlKey(formattedUrl, formattedUrl) || formattedUrl;
  if(!seen.has(normKey)){
    seen.set(normKey, { url: normKey, depth: 0, from: "scraper" });
    stats();
  }

  status("Scraping metadata from " + formattedUrl + "...", "info");
  try{
    const res = await fetchWithCors(formattedUrl);
    if(!res.ok){
      status("Could not fetch " + formattedUrl + " (HTTP " + res.status + ").", "warn");
      return;
    }
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const title = (doc.querySelector("title")?.textContent || "").trim();
    const description = (doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
                         doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || "").trim();
    const ogSiteName = (doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content") || "").trim();
    let sName = ogSiteName;
    if(!sName){ try { sName = new URL(formattedUrl).hostname.replace(/^www\./i, ""); } catch{} }

    const canonicalRaw = (doc.querySelector('link[rel~="canonical"]')?.getAttribute("href") || "").trim();
    let canonical = canonicalRaw;
    if(canonicalRaw){ try { canonical = new URL(canonicalRaw, formattedUrl).href; } catch{} }
    else { canonical = formattedUrl; }

    const fav = (doc.querySelector('link[rel~="icon"]')?.getAttribute("href") ||
                 doc.querySelector('link[rel~="shortcut icon"]')?.getAttribute("href") || "").trim();
    let favicon = "/favicon.ico";
    if(fav){ try { favicon = new URL(fav, formattedUrl).href; } catch { favicon = fav; } }

    const ogImageRaw = (doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
                        doc.querySelector('meta[name="og:image"]')?.getAttribute("content") ||
                        doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content") || "").trim();
    let ogImage = "";
    if(ogImageRaw){ try { ogImage = new URL(ogImageRaw, formattedUrl).href; } catch { ogImage = ogImageRaw; } }

    const twImageRaw = (doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content") || "").trim();
    let twitterImage = "";
    if(twImageRaw){ try { twitterImage = new URL(twImageRaw, formattedUrl).href; } catch { twitterImage = twImageRaw; } }

    const author = (doc.querySelector('meta[name="author"]')?.getAttribute("content") || "").trim();
    const publisher = (doc.querySelector('meta[property="article:publisher"]')?.getAttribute("content") ||
                       doc.querySelector('meta[name="publisher"]')?.getAttribute("content") || "").trim();
    const theme = (doc.querySelector('meta[name="theme-color"]')?.getAttribute("content") || "").trim();
    const rob = (doc.querySelector('meta[name="robots"]')?.getAttribute("content") || "").trim();
    const ogTitle = (doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || title).trim();
    const ogDesc = (doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || description).trim();
    const twCard = (doc.querySelector('meta[name="twitter:card"]')?.getAttribute("content") || "summary_large_image").trim();
    const twSite = (doc.querySelector('meta[name="twitter:site"]')?.getAttribute("content") ||
                    doc.querySelector('meta[name="twitter:creator"]')?.getAttribute("content") || "").trim();

    if($("siteName")) $("siteName").value = sName;
    if($("title")) $("title").value = title;
    if($("description")) $("description").value = description;
    if($("author")) $("author").value = author;
    if($("publisher")) $("publisher").value = publisher || sName;
    if($("canonical")) $("canonical").value = canonical;
    if($("favicon")) $("favicon").value = favicon;
    if($("ogImage")) $("ogImage").value = ogImage;
    if($("twitterImage")) $("twitterImage").value = twitterImage || ogImage;
    if($("theme")) $("theme").value = theme || "#0b0d10";
    if($("robots")) $("robots").value = rob || "index, follow";
    if($("ogTitle")) $("ogTitle").value = ogTitle;
    if($("ogDescription")) $("ogDescription").value = ogDesc;
    if($("twitterCard")) $("twitterCard").value = twCard;
    if($("twitterSite")) $("twitterSite").value = twSite;

    const scrapePath = pathOf(formattedUrl);
    pageOverrides[scrapePath] = {
      title,
      desc: description,
      canonical,
      ogTitle,
      ogDesc,
      ogImage,
      twitterImage: twitterImage || ogImage
    };

    status("Scraped metadata from " + formattedUrl + " successfully.", "good");
    if(typeof updatePageSelectOptions === "function") updatePageSelectOptions();
    updateAll();
    validate();
  }catch(e){
    status("Could not scrape metadata from " + formattedUrl + ": " + (e.message || String(e)), "warn");
  }
}
