"use strict";
async function fetchWithCors(url, opts={redirect:"follow",cache:"no-store",credentials:"omit"}){
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

function parseRobots(txt){let active=false,out=[];for(let raw of txt.split(/\r?\n/)){let line=raw.split("#")[0].trim(),i=line.indexOf(":");if(!line||i<0)continue;let k=line.slice(0,i).trim().toLowerCase(),v=line.slice(i+1).trim();if(k==="user-agent")active=v==="*";else if(active&&(k==="allow"||k==="disallow")&&v)out.push({k,v})}return out}
function allowed(u){if(!robotsRules)return true;let p=new URL(u).pathname,best=-1,allow=true;for(let r of robotsRules){let pattern=r.v,end=pattern.endsWith("$");if(end)pattern=pattern.slice(0,-1);let re=new RegExp("^"+pattern.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\\\*/g,".*")+(end?"$":""));if(re.test(p)&&pattern.length>=best){best=pattern.length;allow=r.k==="allow"}}return allow}
async function loadRobots(){robotsRules=null;if(!checked("respectRobots"))return;try{let r=await fetchWithCors(new URL("/robots.txt",site()).href);if(r.ok)robotsRules=parseRobots(await r.text())}catch{}}
async function addSitemapSeeds(){
  const origin=new URL(site()).origin;
  const candidates=new Set([new URL("/sitemap.xml",site()).href]);
  if(robotsRules){try{let r=await fetchWithCors(new URL("/robots.txt",site()).href);if(r.ok)for(let line of (await r.text()).split(/\r?\n/)){let m=line.match(/^\s*Sitemap:\s*(\S+)/i);if(m)candidates.add(m[1])}}catch{}}
  const visited=new Set();
  while(candidates.size){
    const sm=candidates.values().next().value;candidates.delete(sm);if(visited.has(sm)||visited.size>=25)continue;visited.add(sm);
    try{
      const r=await fetchWithCors(sm);if(!r.ok)continue;
      const doc=new DOMParser().parseFromString(await r.text(),"application/xml");
      if(doc.querySelector("parsererror"))continue;
      for(const loc of doc.querySelectorAll("sitemap > loc")){const u=loc.textContent.trim();if(u)candidates.add(u)}
      for(const loc of doc.querySelectorAll("url > loc")){
        const u=urlKey(loc.textContent.trim(),origin);
        if(u&&sameSite(u)&&htmlUrl(u)&&!seen.has(u)){seen.set(u,{url:u,depth:0,from:"sitemap"});queue.push({url:u,depth:0,from:"sitemap"})}
      }
    }catch{}
  }
}
let homepageProfile=null;
function profileFor(doc){
 const norm=s=>String(s||"").replace(/\s+/g," ").trim().toLowerCase();
 return {title:norm(doc.querySelector("title")?.textContent),description:norm(doc.querySelector('meta[name="description"]')?.content),h1:[...doc.querySelectorAll("h1")].map(x=>norm(x.textContent)).filter(Boolean).join("|"),links:[...doc.querySelectorAll("a[href]")].map(a=>norm(a.getAttribute("href"))).filter(Boolean).sort().join("\n")};
}
async function loadHomepageProfile(){
 homepageProfile=null;try{const u=urlKey(site(),site()),r=await fetchWithCors(u);if(!r.ok||!/text\/html/i.test(r.headers.get("content-type")||""))return;homepageProfile=profileFor(new DOMParser().parseFromString(await r.text(),"text/html"))}catch{}
}
async function crawlOne(item){
  let response;
  try{response=await fetchWithCors(item.url)}
  catch(e){
    results.push({url:item.url,depth:item.depth,status:0,error:e.message||String(e),soft404:false,title:"",description:"",canonical:"",noindex:false,indexable:false,h1:0,h1Text:"",links:0,internal:0,external:0,missingAlt:0,images:0,viewport:false,lang:false,jsonLd:0});
    return;
  }
  const type=response.headers.get("content-type")||"";
  if(!/text\/html/i.test(type)){
    if(checked("nonHtml"))results.push({url:item.url,depth:item.depth,status:response.status,error:"Non-HTML resource",soft404:false,title:"",description:"",canonical:"",noindex:false,indexable:false,h1:0,h1Text:"",links:0,internal:0,external:0,missingAlt:0,images:0,viewport:false,lang:false,jsonLd:0});
    return;
  }
  let doc;
  try{doc=new DOMParser().parseFromString(await response.text(),"text/html")}
  catch(e){
    results.push({url:item.url,depth:item.depth,status:response.status,error:e.message||String(e),soft404:false,title:"",description:"",canonical:"",noindex:false,indexable:false,h1:0,h1Text:"",links:0,internal:0,external:0,missingAlt:0,images:0,viewport:false,lang:false,jsonLd:0});
    return;
  }
  const profile=profileFor(doc);
  const root=urlKey(site(),site());
  const soft404=!!(homepageProfile&&item.url!==root&&response.status===200&&profile.title===homepageProfile.title&&profile.description===homepageProfile.description&&profile.h1===homepageProfile.h1&&profile.links===homepageProfile.links);
  const title=(doc.querySelector("title")?.textContent||"").trim();
  const description=(doc.querySelector('meta[name="description"]')?.getAttribute("content")||"").trim();
  const canonicalRaw=doc.querySelector('link[rel~="canonical"]')?.getAttribute("href")||"";
  const canonical=canonicalRaw?urlKey(canonicalRaw,item.url)||canonicalRaw:"";
  const ogImageRaw=(doc.querySelector('meta[property="og:image"]')?.getAttribute("content")||doc.querySelector('meta[name="og:image"]')?.getAttribute("content")||doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content")||"").trim();
  
  if(item.url===root){
    if(title) $("title").value = title;
    if(description) $("description").value = description;
    
    const ogSiteName = (doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content")||"").trim();
    let sName = ogSiteName;
    if(!sName){
      try { sName = new URL(site()).hostname.replace(/^www\./i, ""); } catch{}
    }
    if(sName) $("siteName").value = sName;
    
    if(canonical) $("canonical").value = canonical;
    else $("canonical").value = site() + "/";
    
    const fav = doc.querySelector('link[rel~="icon"]')?.getAttribute("href") || doc.querySelector('link[rel~="shortcut icon"]')?.getAttribute("href") || "";
    if(fav){
      try { $("favicon").value = new URL(fav, item.url).href; } catch { $("favicon").value = fav; }
    } else {
      $("favicon").value = "/favicon.ico";
    }
    
    if(ogImageRaw){
      try { $("ogImage").value = new URL(ogImageRaw, item.url).href; } catch { $("ogImage").value = ogImageRaw; }
    }
    
    const author = (doc.querySelector('meta[name="author"]')?.getAttribute("content")||"").trim();
    if(author) $("author").value = author;
    
    const publisher = (doc.querySelector('meta[property="article:publisher"]')?.getAttribute("content")||doc.querySelector('meta[name="publisher"]')?.getAttribute("content")||"").trim();
    if(publisher) $("publisher").value = publisher;
    
    const theme = (doc.querySelector('meta[name="theme-color"]')?.getAttribute("content")||"").trim();
    if(theme) $("theme").value = theme;
    
    const rob = (doc.querySelector('meta[name="robots"]')?.getAttribute("content")||"").trim();
    if(rob) $("robots").value = rob;
    
    const ogTitle = (doc.querySelector('meta[property="og:title"]')?.getAttribute("content")||"").trim();
    if(ogTitle) $("ogTitle").value = ogTitle;
    
    const ogDesc = (doc.querySelector('meta[property="og:description"]')?.getAttribute("content")||"").trim();
    if(ogDesc) $("ogDescription").value = ogDesc;
    
    const twCard = (doc.querySelector('meta[name="twitter:card"]')?.getAttribute("content")||"").trim();
    if(twCard) $("twitterCard").value = twCard;
    
    const twSite = (doc.querySelector('meta[name="twitter:site"]')?.getAttribute("content")||doc.querySelector('meta[name="twitter:creator"]')?.getAttribute("content")||"").trim();
    if(twSite) $("twitterSite").value = twSite;
  }

  const robots=(doc.querySelector('meta[name="robots"]')?.getAttribute("content")||"")+" "+(doc.querySelector('meta[name="googlebot"]')?.getAttribute("content")||"");
  const noindex=/\bnoindex\b/i.test(robots);
  const h1=[...doc.querySelectorAll("h1")].map(x=>x.textContent.trim()).filter(Boolean);
  const links=[...doc.querySelectorAll("a[href]")];let internal=0,external=0;
  for(const a of links){let u=urlKey(a.getAttribute("href"),item.url);if(!u)continue;if(sameSite(u)){internal++;if(!soft404&&htmlUrl(u)&&!seen.has(u)){seen.set(u,{url:u,depth:item.depth+1,from:item.url});queue.push({url:u,depth:item.depth+1,from:item.url})}}else external++}
  const imgs=[...doc.images];
  results.push({url:item.url,depth:item.depth,status:response.status,error:soft404?"Soft 404: server returned the homepage":"",soft404,title,description,canonical,noindex,indexable:response.ok&&!noindex&&!soft404,h1:h1.length,h1Text:h1.slice(0,2).join(" | "),links:links.length,internal,external,missingAlt:imgs.filter(i=>!i.hasAttribute("alt")).length,images:imgs.length,viewport:!!doc.querySelector('meta[name="viewport"]'),lang:!!doc.documentElement.getAttribute("lang"),jsonLd:doc.querySelectorAll('script[type="application/ld+json"]').length});
}
async function crawlSite(){
 if(running)return;try{let u=new URL(site());if(!/^https?:$/.test(u.protocol))throw 0}catch{status("Enter a valid HTTP or HTTPS website URL.","error");return}
 running=true;stopRequested=false;results=[];queue=[];seen.clear();robotsRules=null;
 let start=urlKey(site(),site());seen.set(start,{url:start,depth:0});queue.push({url:start,depth:0});renderResults();stats();status("Preparing crawl…","info");
 await loadHomepageProfile();await loadRobots();await addSitemapSeeds();
 const limit=Math.max(1,Math.min(100000,Number(val("maxPages","10000"))||10000));
 while(queue.length&&!stopRequested&&results.length<limit){
   const item=queue.shift();
   if(!allowed(item.url)){results.push({url:item.url,depth:item.depth,status:0,error:"Blocked by robots.txt",soft404:false,title:"",description:"",canonical:"",noindex:false,indexable:false,h1:0,h1Text:"",links:0,internal:0,external:0,missingAlt:0,images:0,viewport:false,lang:false,jsonLd:0});stats();renderResults();continue}
   await crawlOne(item);stats();renderResults();
   await sleep(Math.max(0,Math.min(10000,Number(val("delay","0"))||0)));
 }
 running=false;
 status(stopRequested?"Crawl stopped. "+results.length+" page(s) analyzed.":results.length>=limit&&queue.length?"Safety limit reached ("+limit+" pages).":"Crawl complete. "+results.length+" page(s) analyzed.",stopRequested||queue.length?"warn":"good");
 useCrawledPages();renderPages();updateAll();validate();
}
function stopCrawl(){if(running){stopRequested=true;status("Stopping after the current request…","warn")}}
