"use strict";
const $=id=>document.getElementById(id);
let pages = [{ path: "/", lastmod: "", changefreq: "weekly", priority: "1.0" }], results = [], queue = [], seen = new Map(), running = false, stopRequested = false, robotsRules = null;
const val=(id,def="")=>($(id)?.value?.trim() || def);
const checked=id=>!!$(id)?.checked;
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const xml=s=>esc(s).replace(/&#39;/g,"&apos;");
function site(){return val("siteUrl").replace(/[,;\s]+$/,"").replace(/\/+$/,"")}
function status(msg,type="good"){$("status").textContent=msg;$("status").className="status "+type}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function urlKey(raw,base){try{let u=new URL(raw,base);if(!/^https?:$/.test(u.protocol))return null;u.hash="";if(!checked("queryUrls"))u.search="";if(u.pathname.length>1&&!u.pathname.endsWith("/"))u.pathname=u.pathname.replace(/\/+$/,"");return u.href}catch{return null}}
function sameSite(u){try{return new URL(u).hostname.toLowerCase()===new URL(site()).hostname.toLowerCase()}catch{return false}}
const assetExt=/\.(?:css|js|mjs|json|xml|txt|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|mp[34]|webm|mov|zip|rar|7z|gz|tar|exe|msi|dmg|iso|pdf|docx?|xlsx?|pptx?|csv)$/i;
function htmlUrl(u){try{return !assetExt.test(new URL(u).pathname)}catch{return false}}
function pathOf(u){try{let x=new URL(u),p=x.pathname||"/";if(p.length>1&&!p.endsWith("/"))p=p.replace(/\/+$/,"");return p+(checked("queryUrls")?x.search:"")}catch{return "/"}}
function stats(){$("discovered").textContent=seen.size;$("crawled").textContent=results.length;$("queued").textContent=queue.length;$("failed").textContent=results.filter(x=>x.error||x.status>=400).length;$("depth").textContent=results.reduce((m,x)=>Math.max(m,x.depth||0),0);$("progress").style.width=Math.min(100,results.length/Math.max(seen.size,1)*100)+"%"}
