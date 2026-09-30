"use strict";
function getDomain(urlStr){try{if(!urlStr)return "example.com";let u=new URL(urlStr.startsWith("http")?urlStr:"https://"+urlStr);return u.hostname||"example.com"}catch{return urlStr||"example.com"}}
function resolveUrl(url,base){if(!url)return "";try{return new URL(url,base||site()||window.location.href).href}catch{return url}}
function updatePreview(){
  let c=cfg();
  let domain=getDomain(c.canonical||c.site);
  let title=c.ogTitle||c.title||c.name||"Website title";
  let desc=c.ogDesc||c.desc||"Your page description will appear here.";
  let publisherName=c.publisher||c.name||"Publisher";
  let handle=c.twitter||("@"+publisherName.replace(/\s+/g,"").toLowerCase());
  let imageUrl=resolveUrl(c.ogImage,c.site);

  if($("previewUrl"))$("previewUrl").textContent=c.site||"https://example.com";
  if($("previewTitle"))$("previewTitle").textContent=c.title||c.name||"Website title";
  if($("previewDesc"))$("previewDesc").textContent=c.desc||"Your page description will appear here.";

  if($("ogAuthorName"))$("ogAuthorName").textContent=publisherName;
  if($("ogAvatar"))$("ogAvatar").textContent=(publisherName[0]||"X").toUpperCase();
  if($("ogPreviewDomain"))$("ogPreviewDomain").textContent=domain;
  if($("ogPreviewTitle"))$("ogPreviewTitle").textContent=title;
  if($("ogPreviewDesc"))$("ogPreviewDesc").textContent=desc;

  let ogImg=$("ogPreviewImg"),ogFallback=$("ogImgFallback");
  if(ogImg&&ogFallback){
    if(imageUrl){
      ogImg.src=imageUrl;ogImg.style.display="block";ogFallback.style.display="none";
      ogImg.onerror=()=>{ogImg.style.display="none";ogFallback.style.display="flex"};
      ogImg.onload=()=>{ogImg.style.display="block";ogFallback.style.display="none"};
    }else{ogImg.style.display="none";ogFallback.style.display="flex"}
  }

  if($("twAuthorName"))$("twAuthorName").textContent=publisherName;
  if($("twAvatar"))$("twAvatar").textContent=(publisherName[0]||"X").toUpperCase();
  if($("twAuthorHandle"))$("twAuthorHandle").textContent=(handle.startsWith("@")?handle:"@"+handle)+" · 1m";
  if($("twPreviewDomain"))$("twPreviewDomain").textContent="🔗 "+domain;
  if($("twPreviewTitle"))$("twPreviewTitle").textContent=title;
  if($("twPreviewDesc"))$("twPreviewDesc").textContent=desc;

  let twCardBox=$("twCardBox");
  if(twCardBox){
    if(c.card==="summary"){twCardBox.classList.add("card-summary")}
    else{twCardBox.classList.remove("card-summary")}
  }

  let twImg=$("twPreviewImg"),twFallback=$("twImgFallback");
  if(twImg&&twFallback){
    if(imageUrl){
      twImg.src=imageUrl;twImg.style.display="block";twFallback.style.display="none";
      twImg.onerror=()=>{twImg.style.display="none";twFallback.style.display="flex"};
      twImg.onload=()=>{twImg.style.display="block";twFallback.style.display="none"};
    }else{twImg.style.display="none";twFallback.style.display="flex"}
  }
}
function initPreviewTabs(){
  let tabs=document.querySelectorAll(".preview-tab");
  tabs.forEach(tab=>{
    tab.addEventListener("click",()=>{
      let target=tab.dataset.tab;
      tabs.forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      let panes=document.querySelectorAll(".preview-pane");
      panes.forEach(pane=>{
        if(target==="all"){pane.classList.add("active")}
        else{pane.classList.toggle("active",pane.id==="pane-"+target)}
      });
    });
  });
}
function updateAll(){$("outRobots").textContent=robotsTxt();$("outSitemap").textContent=sitemap();$("outHead").textContent=head();$("outJson").textContent=jsonLd();updatePreview()}
function download(name,text,mime="text/plain;charset=utf-8"){let blob=new Blob([text],{type:mime}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200)}
function downloadAll(){let files=[["robots.txt",robotsTxt(),"text/plain"],["sitemap.xml",sitemap(),"application/xml"],["seo-head.html",head(),"text/html"],["structured-data.json",jsonLd()+"\n","application/ld+json"],["site.webmanifest",manifest(),"application/manifest+json"],["llms.txt",llms(),"text/plain"],["seo-report.txt",report(),"text/plain"]];files.forEach((f,i)=>setTimeout(()=>download(f[0],f[1],f[2]),i*300));status("Generated all seven SEO files. Your browser may ask to allow multiple downloads.","good")}
function validate(){let c=cfg(),e=[],w=[];if(!c.site){$("validation").innerHTML='<div class="validation vinfo" style="background:#172332;border:1px solid #34577b;color:#a9cbff;">Enter a website URL above and click <b>Crawl Site</b> to analyze pages and populate SEO metadata.</div>';return false}try{let u=new URL(c.site);if(!/^https?:$/.test(u.protocol))throw 0}catch{e.push("Website URL must be a valid HTTP or HTTPS URL.")}if(!c.name)e.push("Site name is required.");if(!c.title)w.push("Default title is empty.");if(!c.desc)w.push("Default description is empty.");if(c.desc.length>160)w.push("Default description is longer than 160 characters.");if(!c.ogImage)w.push("Open Graph image is not configured.");if(!pages.length)e.push("Sitemap has no entries.");pages.forEach((p,i)=>{let n=Number(p.priority);if(!p.path)e.push("Sitemap row "+(i+1)+" has no path.");if(!Number.isFinite(n)||n<0||n>1)e.push("Sitemap row "+(i+1)+" priority must be between 0 and 1.")});$("validation").innerHTML=(e.length?'<div class="validation vbad"><b>Errors</b><ul>'+e.map(x=>"<li>"+esc(x)+"</li>").join("")+"</ul></div>":"")+(w.length?'<div class="validation vwarn"><b>Warnings</b><ul>'+w.map(x=>"<li>"+esc(x)+"</li>").join("")+"</ul></div>":"")+(e.length+w.length===0?'<div class="validation vgood">Configuration passed basic validation.</div>':"");return !e.length}
async function copy(s){try{await navigator.clipboard.writeText(s)}catch{let t=document.createElement("textarea");t.value=s;document.body.appendChild(t);t.select();document.execCommand("copy");t.remove()}status("Copied to clipboard.","good")}
