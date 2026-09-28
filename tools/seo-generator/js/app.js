"use strict";
function init(){
 renderPages();renderResults();updateAll();validate();
 $("crawlBtn").onclick=crawlSite;$("stopBtn").onclick=stopCrawl;
 $("clearBtn").onclick=()=>{if(running){status("Stop the crawl before clearing.","warn");return}results=[];queue=[];seen.clear();pages=[];renderPages();renderResults();stats();$("progress").style.width="0";updateAll();validate();status("Results cleared.","good")};
 $("addPage").onclick=addPage;$("addCommon").onclick=addCommon;
 $("useCrawl").onclick=()=>{useCrawledPages();renderPages();updateAll();status("Sitemap populated from successful crawled HTML pages.","good")};
 $("validateBtn").onclick=validate;
 $("all").onclick=downloadAll;
 $("dlRobots").onclick=()=>download("robots.txt",robotsTxt());
 $("dlSitemap").onclick=()=>download("sitemap.xml",sitemap(),"application/xml");
 $("dlHead").onclick=()=>download("seo-head.html",head(),"text/html");
 $("dlJson").onclick=()=>download("structured-data.json",jsonLd()+"\n","application/ld+json");
 $("dlManifest").onclick=()=>download("site.webmanifest",manifest(),"application/manifest+json");
 $("dlLlms").onclick=()=>download("llms.txt",llms());
 $("dlReport").onclick=()=>download("seo-report.txt",report());
 $("copyRobots").onclick=()=>copy(robotsTxt());$("copySitemap").onclick=()=>copy(sitemap());$("copyHead").onclick=()=>copy(head());$("copyJson").onclick=()=>copy(jsonLd());
 document.querySelectorAll("input:not([data-i]),textarea,select").forEach(el=>{el.addEventListener("input",updateAll);el.addEventListener("change",updateAll)});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
