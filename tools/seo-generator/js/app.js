"use strict";

let lastScrapedUrl = "";

function setupUrlScraper(){
  const siteInput = $("siteUrl");
  if(!siteInput) return;

  const handleUrlChange = () => {
    let raw = siteInput.value.trim();
    if(!raw) return;
    if(!/^https?:\/\//i.test(raw)){
      raw = "https://" + raw;
    }
    if(raw.toLowerCase() !== lastScrapedUrl.toLowerCase()){
      lastScrapedUrl = raw;
      scrapeSiteMetadata(raw);
    }
  };

  siteInput.addEventListener("change", handleUrlChange);
  siteInput.addEventListener("blur", handleUrlChange);
}

function init(){
  renderPages();
  renderResults();
  initPreviewTabs();
  setupUrlScraper();

  if($("pageSelect")){
    $("pageSelect").addEventListener("change", onPageSelectChange);
  }

  updatePageSelectOptions();
  updateAll();
  validate();

  const initialUrl = val("siteUrl");
  if(initialUrl){
    lastScrapedUrl = initialUrl;
    scrapeSiteMetadata(initialUrl);
  }

  $("crawlBtn").onclick = crawlSite;
  $("stopBtn").onclick = stopCrawl;

  $("clearBtn").onclick = () => {
    if(running){
      status("Stop the crawl before clearing.", "warn");
      return;
    }
    results = [];
    queue = [];
    seen.clear();
    pages = [];
    pageOverrides = {};
    currentSelectedPath = "/";
    if(typeof updatePageSelectOptions === "function") updatePageSelectOptions();
    renderPages();
    renderResults();
    stats();
    $("progress").style.width = "0";
    updateAll();
    validate();
    status("Results cleared.", "good");
  };

  $("addPage").onclick = addPage;
  $("addCommon").onclick = addCommon;

  $("useCrawl").onclick = () => {
    useCrawledPages();
    renderPages();
    updateAll();
    status("Sitemap populated from successful crawled HTML pages.", "good");
  };

  $("validateBtn").onclick = validate;
  $("all").onclick = downloadAll;

  $("dlRobots").onclick = () => download("robots.txt", robotsTxt());
  $("dlSitemap").onclick = () => download("sitemap.xml", sitemap(), "application/xml");
  $("dlHead").onclick = () => download("seo-head.html", head(currentSelectedPath), "text/html");
  $("dlJson").onclick = () => download("structured-data.json", jsonLd(currentSelectedPath) + "\n", "application/ld+json");
  $("dlManifest").onclick = () => download("site.webmanifest", manifest(), "application/manifest+json");
  $("dlLlms").onclick = () => download("llms.txt", llms());
  $("dlReport").onclick = () => download("seo-report.txt", report());

  $("copyRobots").onclick = () => copy(robotsTxt());
  $("copySitemap").onclick = () => copy(sitemap());
  $("copyHead").onclick = () => copy(head(currentSelectedPath));
  $("copyJson").onclick = () => copy(jsonLd(currentSelectedPath));

  document.querySelectorAll("input:not([data-i]),textarea,select").forEach(el => {
    if(el.id !== "pageSelect"){
      el.addEventListener("input", () => { updateAll(); validate(); });
      el.addEventListener("change", () => { updateAll(); validate(); });
    }
  });
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
