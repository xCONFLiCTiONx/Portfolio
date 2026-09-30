"use strict";

function normPath(p){
  p = String(p || "").trim();
  if(!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/(?:index\.html?|index\.htm)$/i, "/");
  p = p.replace(/(?:\/|^)index\.html?$/i, "");
  if(!p.startsWith("/")) p = "/" + p;
  if(p.toLowerCase() === "/index.html" || p.toLowerCase() === "/index.htm") p = "/";
  if(p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

function renderResults(){
  const body = $("crawlRows");
  if(!body) return;
  body.innerHTML = "";
  for(const r of results){
    let tr = document.createElement("tr");
    let ok = r.status >= 200 && r.status < 400 && !r.error && !r.soft404;
    const cell = x => "<td>" + x + "</td>";
    tr.innerHTML = cell('<span class="url">' + esc(r.url) + '</span>') +
                   cell('<span class="' + (r.soft404 ? "warntext" : (ok ? "ok" : "bad")) + '">' + esc(r.soft404 ? "Soft 404" : (r.error || r.status)) + '</span>') +
                   cell(r.depth) +
                   cell(r.title ? esc(r.title) : '<span class="bad">Missing</span>') +
                   cell(r.description ? esc(r.description) : '<span class="bad">Missing</span>') +
                   cell(r.canonical ? esc(r.canonical) : '<span class="bad">Missing</span>') +
                   cell(r.noindex ? '<span class="warntext">noindex</span>' : (r.indexable ? '<span class="ok">indexable</span>' : '—')) +
                   cell(r.h1 === 1 ? esc(r.h1Text) : ((r.h1 || 0) === 0 ? '<span class="bad">Missing</span>' : '<span class="warntext">' + r.h1 + '</span>')) +
                   cell((r.links || 0) + " (" + (r.internal || 0) + " internal)");
    body.appendChild(tr);
  }
}

function addPage(){
  pages.push({ path: "/new-page", lastmod: "", changefreq: "monthly", priority: "0.5" });
  if(typeof updatePageSelectOptions === "function") updatePageSelectOptions();
  renderPages();
  updateAll();
}

function addCommon(){
  const defaults = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/about/", changefreq: "monthly", priority: "0.8" },
    { path: "/contact/", changefreq: "monthly", priority: "0.8" },
    { path: "/privacy/", changefreq: "monthly", priority: "0.8" },
    { path: "/tools/", changefreq: "monthly", priority: "0.8" },
    { path: "/tools/allow-copy-paste.html", changefreq: "monthly", priority: "0.5" },
    { path: "/tools/dev-box.html", changefreq: "monthly", priority: "0.5" },
    { path: "/tools/warp-test.html", changefreq: "monthly", priority: "0.5" },
    { path: "/tools/site-grade.html", changefreq: "monthly", priority: "0.5" },
    { path: "/tools/pdf-tools/", changefreq: "monthly", priority: "0.5" },
    { path: "/tools/seo-generator/", changefreq: "monthly", priority: "0.5" }
  ];
  for(const p of defaults){
    if(!pages.some(x => normPath(x.path) === normPath(p.path))){
      pages.push({ ...p, lastmod: "" });
    }
  }
  if(typeof updatePageSelectOptions === "function") updatePageSelectOptions();
  renderPages();
  updateAll();
}

function useCrawledPages(){
  let found = results.filter(r => r.status >= 200 && r.status < 400 && !r.error && htmlUrl(r.url));
  let arr = [];
  for(const r of found){
    let p = normPath(pathOf(r.url));
    if(!arr.some(x => normPath(x.path) === normPath(p))){
      arr.push({
        path: p,
        lastmod: "",
        changefreq: p === "/" ? "weekly" : "monthly",
        priority: p === "/" ? "1.0" : (r.depth <= 1 ? "0.8" : "0.5")
      });
    }
  }
  arr.sort((a, b) => a.path === "/" ? -1 : (b.path === "/" ? 1 : a.path.localeCompare(b.path)));
  if(arr.length){
    pages = arr;
    if(typeof updatePageSelectOptions === "function") updatePageSelectOptions();
  }
}

function renderPages(){
  let body = $("pageRows");
  if(!body) return;
  body.innerHTML = "";
  pages.forEach((p, i) => {
    let tr = document.createElement("tr");
    tr.innerHTML = '<td><input data-i="' + i + '" data-k="path" value="' + esc(p.path) + '"></td>' +
                   '<td><input type="date" data-i="' + i + '" data-k="lastmod" value="' + esc(p.lastmod) + '"></td>' +
                   '<td><select data-i="' + i + '" data-k="changefreq">' +
                   ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map(x => '<option ' + (p.changefreq === x ? "selected" : "") + '>' + x + '</option>').join("") +
                   '</select></td>' +
                   '<td><input type="number" min="0" max="1" step=".1" data-i="' + i + '" data-k="priority" value="' + esc(p.priority) + '"></td>' +
                   '<td><button class="danger" data-remove="' + i + '">Remove</button></td>';
    body.appendChild(tr);
  });

  body.querySelectorAll("[data-k]").forEach(el => {
    let f = () => {
      pages[+el.dataset.i][el.dataset.k] = el.value;
      if(el.dataset.k === "path" && typeof updatePageSelectOptions === "function"){
        updatePageSelectOptions();
      }
      updateAll();
    };
    el.addEventListener("input", f);
    el.addEventListener("change", f);
  });

  body.querySelectorAll("[data-remove]").forEach(el => {
    el.addEventListener("click", () => {
      pages.splice(+el.dataset.remove, 1);
      if(typeof updatePageSelectOptions === "function") updatePageSelectOptions();
      renderPages();
      updateAll();
    });
  });
}
