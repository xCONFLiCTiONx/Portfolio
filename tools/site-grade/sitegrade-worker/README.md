# SiteGrade scanner 2.0

Deploy this Worker to the existing `scanner.xconflictionx.cc` Worker.

`POST /scan` accepts `{ "url": "https://example.com/" }`.

Adds deeper checks for security headers/CSP, cookies and third parties, response timing/size/compression, SEO metadata, accessibility basics, robots/sitemap, exposed `.env`/`.git/config`, redirect chains, and public DNS.
