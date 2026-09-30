"use strict";
const $=id=>document.getElementById(id);
let pages = [{ path: "/", lastmod: "", changefreq: "weekly", priority: "1.0" }],
    results = [],
    queue = [],
    seen = new Map(),
    running = false,
    stopRequested = false,
    robotsRules = null,
    pageOverrides = {},
    currentSelectedPath = "/";

const val=(id,def="")=>($(id)?.value?.trim() || def);
const checked=id=>!!$(id)?.checked;
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const xml=s=>esc(s).replace(/&#39;/g,"&apos;");

function site(){
  let s = val("siteUrl").replace(/[,;\s]+$/,"").replace(/\/+$/,"");
  if(s && !/^https?:\/\//i.test(s)) s = "https://" + s;
  return s;
}

function status(msg,type="good"){
  const st = $("status");
  if(st){ st.textContent=msg; st.className="status "+type; }
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

function urlKey(raw,base){
  try{
    let u=new URL(raw,base||site()||"https://example.com");
    if(!/^https?:$/.test(u.protocol))return null;
    u.hash="";
    if(!checked("queryUrls"))u.search="";
    if(u.pathname.length>1 && u.pathname.endsWith("/")) u.pathname=u.pathname.slice(0,-1);
    return u.href;
  }catch{return null}
}

function sameSite(u){
  try{
    let s = site();
    if(!s) return false;
    return new URL(u).hostname.toLowerCase()===new URL(s).hostname.toLowerCase();
  }catch{return false}
}

const assetExt=/\.(?:css|js|mjs|json|xml|txt|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|mp[34]|webm|mov|zip|rar|7z|gz|tar|exe|msi|dmg|iso|pdf|docx?|xlsx?|pptx?|csv)$/i;
function htmlUrl(u){try{return !assetExt.test(new URL(u).pathname)}catch{return false}}

function pathOf(u){
  try{
    let x=new URL(u), p=x.pathname||"/";
    if(p.length>1 && p.endsWith("/")) p=p.slice(0,-1);
    return p+(checked("queryUrls")?x.search:"");
  }catch{return "/"}
}

function stats(){
  if($("discovered")) $("discovered").textContent=seen.size;
  if($("crawled")) $("crawled").textContent=results.length;
  if($("queued")) $("queued").textContent=queue.length;
  if($("failed")) $("failed").textContent=results.filter(x=>x.error||x.status>=400).length;
  if($("depth")) $("depth").textContent=results.reduce((m,x)=>Math.max(m,x.depth||0),0);
  if($("progress")) $("progress").style.width=Math.min(100,results.length/Math.max(seen.size,1)*100)+"%";
}
