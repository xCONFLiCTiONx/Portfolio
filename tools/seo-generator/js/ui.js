"use strict";

function getDomain(urlStr){
  try{
    if(!urlStr) return "example.com";
    let u = new URL(urlStr.startsWith("http") ? urlStr : "https://" + urlStr);
    return u.hostname || "example.com";
  }catch{
    return urlStr || "example.com";
  }
}

function resolveUrl(url, base){
  if(!url) return "";
  try{
    return new URL(url, base || site() || window.location.href).href;
  }catch{
    return url;
  }
}

function updatePageSelectOptions(){
  const sel = $("pageSelect");
  if(!sel) return;

  const currentVal = sel.value || currentSelectedPath || "/";
  const pathSet = new Set(["/"]);

  for(const p of pages){
    if(p.path) pathSet.add(normPath(p.path));
  }
  for(const p of Object.keys(pageOverrides)){
    if(p) pathSet.add(normPath(p));
  }

  const sortedPaths = Array.from(pathSet).sort((a, b) => a === "/" ? -1 : (b === "/" ? 1 : a.localeCompare(b)));

  sel.innerHTML = sortedPaths.map(p => {
    let label = (p === "/" ? "Homepage (/)" : p);
    return '<option value="' + esc(p) + '" ' + (p === currentVal ? "selected" : "") + '>' + esc(label) + '</option>';
  }).join("");

  if(!pathSet.has(currentVal)){
    sel.value = "/";
    currentSelectedPath = "/";
  } else {
    sel.value = currentVal;
    currentSelectedPath = currentVal;
  }
}

function onPageSelectChange(){
  const sel = $("pageSelect");
  if(!sel) return;

  const newPath = sel.value || "/";
  currentSelectedPath = newPath;

  const cur = pageOverrides[newPath] || {};
  const cDefault = cfg("/");

  if($("title")) $("title").value = cur.title || cDefault.title || "";
  if($("description")) $("description").value = cur.desc || cDefault.desc || "";
  if($("canonical")) $("canonical").value = cur.canonical || (site() + (newPath === "/" ? "/" : newPath));
  if($("ogTitle")) $("ogTitle").value = cur.ogTitle || cur.title || cDefault.ogTitle || "";
  if($("ogDescription")) $("ogDescription").value = cur.ogDesc || cur.desc || cDefault.ogDesc || "";
  if($("ogImage")) $("ogImage").value = cur.ogImage || cDefault.ogImage || "";
  if($("twitterImage")) $("twitterImage").value = cur.twitterImage || cur.ogImage || cDefault.twitterImage || "";

  updateAll();
  validate();
}

function saveCurrentPageOverrides(){
  const path = currentSelectedPath || "/";
  if(!pageOverrides[path]) pageOverrides[path] = {};

  pageOverrides[path] = {
    title: val("title"),
    desc: val("description"),
    canonical: val("canonical"),
    ogTitle: val("ogTitle"),
    ogDesc: val("ogDescription"),
    ogImage: val("ogImage"),
    twitterImage: val("twitterImage")
  };
}

function updatePreview(){
  const c = cfg(currentSelectedPath);
  const domain = getDomain(c.canonical || c.site);
  const title = c.ogTitle || c.title || c.name || "Website title";
  const desc = c.ogDesc || c.desc || "Your page description will appear here.";
  const publisherName = c.publisher || c.name || "Publisher";
  const handle = c.twitter || ("@" + publisherName.replace(/\s+/g, "").toLowerCase());
  const ogImageUrl = resolveUrl(c.ogImage, c.site);
  const twImageUrl = resolveUrl(c.twitterImage || c.ogImage, c.site);

  if($("previewUrl")) $("previewUrl").textContent = c.canonical || c.site || "https://example.com/";
  if($("previewTitle")) $("previewTitle").textContent = c.title || c.name || "Website title";
  if($("previewDesc")) $("previewDesc").textContent = c.desc || "Your page description will appear here.";

  if($("ogAuthorName")) $("ogAuthorName").textContent = publisherName;
  if($("ogAvatar")) $("ogAvatar").textContent = (publisherName[0] || "X").toUpperCase();
  if($("ogPreviewDomain")) $("ogPreviewDomain").textContent = domain;
  if($("ogPreviewTitle")) $("ogPreviewTitle").textContent = title;
  if($("ogPreviewDesc")) $("ogPreviewDesc").textContent = desc;

  const ogImg = $("ogPreviewImg");
  const ogFallback = $("ogImgFallback");
  const ogBadge = $("ogImgBadge");

  if(ogImg && ogFallback){
    if(ogImageUrl){
      ogImg.src = ogImageUrl;
      ogImg.onerror = () => {
        ogImg.style.display = "none";
        ogFallback.style.display = "flex";
        if(ogBadge) ogBadge.textContent = "Error loading image URL";
      };
      ogImg.onload = () => {
        ogImg.style.display = "block";
        ogFallback.style.display = "none";
        if(ogBadge && ogImg.naturalWidth && ogImg.naturalHeight){
          const w = ogImg.naturalWidth;
          const h = ogImg.naturalHeight;
          const ratio = (w / h).toFixed(2);
          let note = (ratio >= 1.7 && ratio <= 2.1) ? " (Ideal 1.91:1 ratio for social cards)" :
                     (Math.abs(ratio - 1.0) < 0.1 ? " (Square image aspect ratio)" : "");
          ogBadge.textContent = "Dimensions: " + w + " × " + h + " px" + note;
        }
      };
    } else {
      ogImg.style.display = "none";
      ogFallback.style.display = "flex";
      if(ogBadge) ogBadge.textContent = "No image provided";
    }
  }

  if($("twAuthorName")) $("twAuthorName").textContent = publisherName;
  if($("twAvatar")) $("twAvatar").textContent = (publisherName[0] || "X").toUpperCase();
  if($("twAuthorHandle")) $("twAuthorHandle").textContent = (handle.startsWith("@") ? handle : "@" + handle) + " · 1m";
  if($("twPreviewDomain")) $("twPreviewDomain").textContent = "🔗 " + domain;
  if($("twPreviewTitle")) $("twPreviewTitle").textContent = title;
  if($("twPreviewDesc")) $("twPreviewDesc").textContent = desc;

  const twCardBox = $("twCardBox");
  if(twCardBox){
    if(c.card === "summary"){
      twCardBox.classList.add("card-summary");
    } else {
      twCardBox.classList.remove("card-summary");
    }
  }

  const twImg = $("twPreviewImg");
  const twFallback = $("twImgFallback");
  const twBadge = $("twImgBadge");

  if(twImg && twFallback){
    if(twImageUrl){
      twImg.src = twImageUrl;
      twImg.onerror = () => {
        twImg.style.display = "none";
        twFallback.style.display = "flex";
        if(twBadge) twBadge.textContent = "Error loading image URL";
      };
      twImg.onload = () => {
        twImg.style.display = "block";
        twFallback.style.display = "none";
        if(twBadge && twImg.naturalWidth && twImg.naturalHeight){
          const w = twImg.naturalWidth;
          const h = twImg.naturalHeight;
          const ratio = (w / h).toFixed(2);
          let note = (c.card === "summary_large_image" && ratio >= 1.7 && ratio <= 2.1) ? " (Ideal 1.91:1 ratio)" :
                     (c.card === "summary" && Math.abs(ratio - 1.0) < 0.15) ? " (Ideal 1:1 summary ratio)" : "";
          twBadge.textContent = "Dimensions: " + w + " × " + h + " px" + note;
        }
      };
    } else {
      twImg.style.display = "none";
      twFallback.style.display = "flex";
      if(twBadge) twBadge.textContent = "No image provided";
    }
  }
}

function initPreviewTabs(){
  const tabs = document.querySelectorAll(".preview-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      let target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      let panes = document.querySelectorAll(".preview-pane");
      panes.forEach(pane => {
        if(target === "all"){
          pane.classList.add("active");
        } else {
          pane.classList.toggle("active", pane.id === "pane-" + target);
        }
      });
    });
  });
}

function updateAll(){
  saveCurrentPageOverrides();
  $("outRobots").textContent = robotsTxt();
  $("outSitemap").textContent = sitemap();
  $("outHead").textContent = head(currentSelectedPath);
  $("outJson").textContent = jsonLd(currentSelectedPath);
  updatePreview();
}

function download(name, text, mime = "text/plain;charset=utf-8"){
  let blob = new Blob([text], { type: mime });
  let u = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = u;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1200);
}

function downloadAll(){
  let files = [
    ["robots.txt", robotsTxt(), "text/plain"],
    ["sitemap.xml", sitemap(), "application/xml"],
    ["seo-head.html", head(currentSelectedPath), "text/html"],
    ["structured-data.json", jsonLd(currentSelectedPath) + "\n", "application/ld+json"],
    ["site.webmanifest", manifest(), "application/manifest+json"],
    ["llms.txt", llms(), "text/plain"],
    ["seo-report.txt", report(), "text/plain"]
  ];
  files.forEach((f, i) => setTimeout(() => download(f[0], f[1], f[2]), i * 300));
  status("Generated all seven SEO files. Your browser may ask to allow multiple downloads.", "good");
}

function validate(){
  const c = cfg(currentSelectedPath);
  const errors = [];
  const warnings = [];

  if(!c.site){
    $("validation").innerHTML = '<div class="validation vinfo" style="background:#172332;border:1px solid #34577b;color:#a9cbff;">Enter a website URL above and click <b>Crawl Site</b> or <b>Validate</b> to analyze pages and populate SEO metadata.</div>';
    return false;
  }

  try{
    let u = new URL(c.site);
    if(!/^https?:$/.test(u.protocol)) throw 0;
  }catch{
    errors.push("Website URL must be a valid HTTP or HTTPS URL.");
  }

  if(!c.name) errors.push("Site name is required.");
  if(!c.title) warnings.push("Page title is empty.");
  else if(c.title.length > 60) warnings.push("Page title is " + c.title.length + " characters (recommended max: 60).");

  if(!c.desc) warnings.push("Meta description is empty.");
  else if(c.desc.length > 160) warnings.push("Meta description is " + c.desc.length + " characters (recommended max: 160).");

  if(!c.ogImage) warnings.push("Open Graph image URL is not configured.");
  else if(!/^https?:\/\//i.test(c.ogImage) && !c.ogImage.startsWith("/")) warnings.push("Open Graph image should be a full absolute URL.");

  if(c.card === "summary_large_image" && c.ogImage && c.ogImage.includes("256x256")) {
    warnings.push("Open Graph / X image is a 256x256 square icon. Large cards recommend a 1200x630 (1.91:1) image.");
  }

  if(!pages.length) errors.push("Sitemap has no entries.");

  pages.forEach((p, i) => {
    let n = Number(p.priority);
    if(!p.path) errors.push("Sitemap row " + (i + 1) + " has no path.");
    if(!Number.isFinite(n) || n < 0 || n > 1) errors.push("Sitemap row " + (i + 1) + " priority must be between 0 and 1.");
  });

  try{
    JSON.parse(jsonLd(currentSelectedPath));
  }catch(err){
    errors.push("Structured data JSON is invalid: " + err.message);
  }

  let html = "";
  if(errors.length){
    html += '<div class="validation vbad"><b>Validation Errors (' + errors.length + ')</b><ul>' + errors.map(x => "<li>" + esc(x) + "</li>").join("") + '</ul></div>';
  }
  if(warnings.length){
    html += '<div class="validation vwarn"><b>Validation Warnings & Recommendations (' + warnings.length + ')</b><ul>' + warnings.map(x => "<li>" + esc(x) + "</li>").join("") + '</ul></div>';
  }
  if(!errors.length && !warnings.length){
    html = '<div class="validation vgood"><b>Audit Passed:</b> All SEO, social metadata, and structured data checks passed.</div>';
  }

  $("validation").innerHTML = html;
  return !errors.length;
}

async function copy(s){
  try{
    await navigator.clipboard.writeText(s);
  }catch{
    let t = document.createElement("textarea");
    t.value = s;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    t.remove();
  }
  status("Copied to clipboard.", "good");
}
