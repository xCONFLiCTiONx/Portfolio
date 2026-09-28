const SCANNER_VERSION = "4.0";

const ALLOWED_ORIGINS = new Set([
    "https://xconflictionx.cc",
    "https://www.xconflictionx.cc"
]);

const MAX_REDIRECTS = 8;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_PROBE_BYTES = 512 * 1024;
const REQUEST_TIMEOUT_MS = 15000;

const SECURITY_WEIGHTS = {
    high: 20,
    medium: 10,
    low: 4
};

const CATEGORY_WEIGHTS = {
    security: 1,
    privacy: 1,
    performance: 1,
    seo: 1,
    configuration: 1,
    accessibility: 1
};

function corsHeaders(origin) {
    const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://xconflictionx.cc";

    return {
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Vary": "Origin"
    };
}

function json(data, status = 200, origin = "") {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders(origin)
        }
    });
}

function normalizeUrl(value) {
    if (typeof value !== "string") {
        throw new Error("URL must be a string.");
    }

    const trimmed = value.trim();

    if (!trimmed) {
        throw new Error("URL is required.");
    }

    let url;

    try {
        url = new URL(trimmed);
    } catch {
        throw new Error("Invalid URL.");
    }

    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are supported.");
    }

    if (url.username || url.password) {
        throw new Error("URLs containing usernames or passwords are not allowed.");
    }

    if (!url.hostname) {
        throw new Error("URL hostname is required.");
    }

    const host = url.hostname.toLowerCase();

    if (
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host === "local" ||
        host.endsWith(".local") ||
        host === "0.0.0.0" ||
        host === "127.0.0.1" ||
        host === "::1" ||
        host === "[::1]"
    ) {
        throw new Error("Local/private destinations are not allowed.");
    }

    if (isPrivateIPv4(host) || isPrivateIPv6(host)) {
        throw new Error("Private network destinations are not allowed.");
    }

    url.hash = "";

    return url;
}

function isPrivateIPv4(host) {
    const parts = host.split(".");

    if (parts.length !== 4 || parts.some(p => !/^\d+$/.test(p))) {
        return false;
    }

    const nums = parts.map(Number);

    if (nums.some(n => n < 0 || n > 255)) {
        return false;
    }

    const [a, b] = nums;

    return (
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a === 0
    );
}

function isPrivateIPv6(host) {
    const h = host.toLowerCase().replace(/^\[|\]$/g, "");

    return (
        h === "::1" ||
        h === "::" ||
        h.startsWith("fc") ||
        h.startsWith("fd") ||
        h.startsWith("fe80:")
    );
}

function addFinding(findings, category, severity, title, detail, evidence = null) {
    findings.push({
        category,
        severity,
        title,
        detail,
        ...(evidence ? { evidence } : {})
    });
}

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } catch (error) {
        if (error?.name === "AbortError") {
            throw new Error("Request timed out.");
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchPage(initialUrl) {
    let currentUrl = new URL(initialUrl);
    const redirects = [];

    for (let i = 0; i <= MAX_REDIRECTS; i++) {
        const requestStarted = performance.now();

        const response = await fetchWithTimeout(currentUrl.toString(), {
            method: "GET",
            redirect: "manual",
            headers: {
                "User-Agent": "SiteGrade/" + SCANNER_VERSION,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        });

        const responseMs = Math.round(performance.now() - requestStarted);

        const location = response.headers.get("Location");

        if (
            [301, 302, 303, 307, 308].includes(response.status) &&
            location
        ) {
            if (i === MAX_REDIRECTS) {
                throw new Error("Too many redirects.");
            }

            const nextUrl = new URL(location, currentUrl);

            if (!["http:", "https:"].includes(nextUrl.protocol)) {
                throw new Error("Redirected to an unsupported protocol.");
            }

            if (nextUrl.hostname !== currentUrl.hostname) {
                redirects.push({
                    from: currentUrl.toString(),
                    to: nextUrl.toString(),
                    status: response.status,
                    responseMs
                });
            } else {
                redirects.push({
                    from: currentUrl.toString(),
                    to: nextUrl.toString(),
                    status: response.status,
                    responseMs
                });
            }

            currentUrl = nextUrl;
            continue;
        }

        const contentType = response.headers.get("content-type") || "";

        const buffer = await response.arrayBuffer();

        if (buffer.byteLength > MAX_HTML_BYTES) {
            throw new Error("Target HTML response is larger than the scanner limit.");
        }

        const html = new TextDecoder().decode(buffer);

        return {
            response,
            url: currentUrl,
            html,
            bytes: buffer.byteLength,
            redirects,
            ttfbMs: responseMs
        };
    }

    throw new Error("Unable to fetch target.");
}

async function fetchProbe(url) {
    const started = performance.now();

    try {
        const response = await fetchWithTimeout(url, {
            method: "GET",
            redirect: "manual",
            headers: {
                "User-Agent": "SiteGrade/" + SCANNER_VERSION,
                "Accept": "*/*"
            }
        });

        const responseMs = Math.round(performance.now() - started);

        const contentLength = Number(response.headers.get("content-length") || 0);

        if (contentLength > MAX_PROBE_BYTES) {
            return {
                status: response.status,
                contentType: response.headers.get("content-type") || "",
                body: "",
                responseMs,
                tooLarge: true
            };
        }

        const buffer = await response.arrayBuffer();

        if (buffer.byteLength > MAX_PROBE_BYTES) {
            return {
                status: response.status,
                contentType: response.headers.get("content-type") || "",
                body: "",
                responseMs,
                tooLarge: true
            };
        }

        return {
            status: response.status,
            contentType: response.headers.get("content-type") || "",
            body: new TextDecoder().decode(buffer),
            responseMs,
            tooLarge: false
        };
    } catch (error) {
        return {
            status: 0,
            contentType: "",
            body: "",
            responseMs: Math.round(performance.now() - started),
            error: error.message
        };
    }
}

function looksLikeHtml(body, contentType = "") {
    if (/text\/html|application\/xhtml\+xml/i.test(contentType)) {
        return true;
    }

    const sample = body.slice(0, 4000).toLowerCase();

    return (
        /<!doctype\s+html/i.test(sample) ||
        /<html[\s>]/i.test(sample) ||
        /<head[\s>]/i.test(sample) ||
        /<body[\s>]/i.test(sample)
    );
}

function looksLikeRealEnv(body, contentType) {
    if (!body || looksLikeHtml(body, contentType)) {
        return false;
    }

    const lines = body
        .split(/\r?\n/)
        .map(x => x.trim())
        .filter(Boolean);

    if (lines.length < 2 || lines.length > 5000) {
        return false;
    }

    let assignments = 0;
    let meaningful = 0;

    for (const line of lines) {
        if (line.startsWith("#")) {
            continue;
        }

        meaningful++;

        if (/^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(line)) {
            assignments++;
        }
    }

    if (meaningful < 2) {
        return false;
    }

    return assignments >= 2 && assignments / meaningful >= 0.5;
}

function looksLikeGitConfig(body, contentType) {
    if (!body || looksLikeHtml(body, contentType)) {
        return false;
    }

    const text = body.slice(0, 100000);

    const sections = (
        text.match(/^\s*\[[^\]]+\]\s*$/gm) || []
    ).length;

    const gitMarkers = [
        /\[core\]/i,
        /\[remote\s+"[^"]+"\]/i,
        /\[branch\s+"[^"]+"\]/i,
        /repositoryformatversion\s*=/i,
        /bare\s*=/i,
        /url\s*=/i
    ].filter(rx => rx.test(text)).length;

    return sections >= 1 && gitMarkers >= 1;
}

function looksLikeRealRobots(body, contentType) {
    if (!body || looksLikeHtml(body, contentType)) {
        return false;
    }

    const text = body.trim();

    return (
        /^user-agent\s*:/im.test(text) ||
        /^disallow\s*:/im.test(text) ||
        /^allow\s*:/im.test(text) ||
        /^sitemap\s*:/im.test(text)
    );
}

function looksLikeSitemap(body, contentType) {
    if (!body || looksLikeHtml(body, contentType)) {
        return false;
    }

    return (
        /<urlset[\s>]/i.test(body) ||
        /<sitemapindex[\s>]/i.test(body)
    );
}

function parseTagAttributes(tag) {
    const attrs = {};

    const regex = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

    let match;

    while ((match = regex.exec(tag))) {
        attrs[match[1].toLowerCase()] =
            match[2] ?? match[3] ?? match[4] ?? "";
    }

    return attrs;
}

function getFirstMatch(html, regex) {
    const match = regex.exec(html);
    return match ? match[1] : null;
}

function extractTitle(html) {
    return getFirstMatch(
        html,
        /<title\b[^>]*>([\s\S]*?)<\/title>/i
    )?.replace(/\s+/g, " ").trim() || "";
}

function extractMeta(html, name) {
    const regex = new RegExp(
        `<meta\\b[^>]*\\bname\\s*=\\s*["']${name}["'][^>]*>`,
        "i"
    );

    const tag = html.match(regex)?.[0];

    if (!tag) {
        return "";
    }

    return parseTagAttributes(tag).content || "";
}

function extractMetaProperty(html, property) {
    const regex = new RegExp(
        `<meta\\b[^>]*\\bproperty\\s*=\\s*["']${property}["'][^>]*>`,
        "i"
    );

    const tag = html.match(regex)?.[0];

    if (!tag) {
        return "";
    }

    return parseTagAttributes(tag).content || "";
}

function extractCanonical(html) {
    const match = html.match(
        /<link\b[^>]*\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["'][^>]*>/i
    );

    if (!match) {
        return "";
    }

    return parseTagAttributes(match[0]).href || "";
}

function countMatches(html, regex) {
    return (html.match(regex) || []).length;
}

function extractLinks(html) {
    const links = [];

    const regex = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;

    let match;

    while ((match = regex.exec(html))) {
        links.push(match[1]);
    }

    return links;
}

function extractImages(html) {
    const images = [];

    const regex = /<img\b[^>]*>/gi;

    let match;

    while ((match = regex.exec(html))) {
        images.push(parseTagAttributes(match[0]));
    }

    return images;
}

function extractScripts(html) {
    const scripts = [];

    const regex = /<script\b[^>]*>/gi;

    let match;

    while ((match = regex.exec(html))) {
        scripts.push(parseTagAttributes(match[0]));
    }

    return scripts;
}

function extractExternalOrigins(html, pageUrl) {
    const origins = new Set();

    const patterns = [
        /(?:src|href|action)\s*=\s*["']([^"']+)["']/gi
    ];

    for (const regex of patterns) {
        let match;

        while ((match = regex.exec(html))) {
            try {
                const value = match[1];

                if (
                    !value ||
                    value.startsWith("#") ||
                    value.startsWith("data:") ||
                    value.startsWith("javascript:") ||
                    value.startsWith("mailto:") ||
                    value.startsWith("tel:")
                ) {
                    continue;
                }

                const resolved = new URL(value, pageUrl);

                if (resolved.origin !== pageUrl.origin) {
                    origins.add(resolved.origin);
                }
            } catch {
                // Ignore malformed resource URLs.
            }
        }
    }

    return [...origins].sort();
}

function parseCookies(setCookieHeaders) {
    return setCookieHeaders.map(value => {
        const first = value.split(";")[0] || "";
        const name = first.split("=")[0].trim();

        return {
            name,
            secure: /;\s*secure(?:;|$)/i.test(value),
            httpOnly: /;\s*httponly(?:;|$)/i.test(value),
            sameSite: (
                value.match(/;\s*samesite\s*=\s*([^;]+)/i)?.[1] || ""
            ).toLowerCase()
        };
    });
}

function getSetCookieHeaders(response) {
    try {
        if (typeof response.headers.getSetCookie === "function") {
            return response.headers.getSetCookie();
        }
    } catch {
        // Ignore.
    }

    const combined = response.headers.get("set-cookie");

    if (!combined) {
        return [];
    }

    return combined.split(/,(?=[^;,]+=)/);
}

function hasFrameAncestors(csp) {
    return /\bframe-ancestors\s+/i.test(csp || "");
}

function hasHeader(headers, name) {
    return Boolean(headers.get(name));
}

function getHeaderMap(response) {
    const result = {};

    for (const [key, value] of response.headers.entries()) {
        result[key.toLowerCase()] = value;
    }

    return result;
}

async function dnsLookup(name, type) {
    try {
        const url =
            "https://cloudflare-dns.com/dns-query?name=" +
            encodeURIComponent(name) +
            "&type=" +
            encodeURIComponent(type);

        const response = await fetchWithTimeout(url, {
            headers: {
                "Accept": "application/dns-json"
            }
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();

        return (data.Answer || [])
            .filter(answer => answer.type)
            .map(answer => ({
                type: answer.type,
                data: answer.data,
                ttl: answer.TTL
            }));
    } catch {
        return [];
    }
}

function scoreCategory(findings, category) {
    let score = 100;

    for (const finding of findings) {
        if (finding.category !== category) {
            continue;
        }

        const severity = String(finding.severity).toLowerCase();

        if (severity === "info") {
            continue;
        }

        score -= SECURITY_WEIGHTS[severity] || 0;
    }

    return Math.max(0, Math.min(100, score));
}

function gradeForScore(score) {
    if (score >= 97) return "A+";
    if (score >= 93) return "A";
    if (score >= 90) return "A-";
    if (score >= 87) return "B+";
    if (score >= 83) return "B";
    if (score >= 80) return "B-";
    if (score >= 77) return "C+";
    if (score >= 73) return "C";
    if (score >= 70) return "C-";
    if (score >= 67) return "D+";
    if (score >= 63) return "D";
    if (score >= 60) return "D-";
    return "F";
}

function buildSummary(overall, findings) {
    const actionable = findings.filter(
        f => String(f.severity).toLowerCase() !== "info"
    ).length;

    const verified = findings.length;

    if (!verified) {
        return "No findings were returned by the configured public-facing checks.";
    }

    return (
        `Results are based on ${verified} verified observation(s), ` +
        `including ${actionable} actionable finding(s), from the public site.`
    );
}

function detectHeadingIssues(html) {
    const headings = [];

    const regex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;

    let match;

    while ((match = regex.exec(html))) {
        headings.push({
            level: Number(match[1]),
            text: match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
        });
    }

    return headings;
}

function detectDuplicateIds(html) {
    const ids = new Map();

    const regex = /\bid\s*=\s*["']([^"']+)["']/gi;

    let match;

    while ((match = regex.exec(html))) {
        const id = match[1];

        ids.set(id, (ids.get(id) || 0) + 1);
    }

    return [...ids.entries()]
        .filter(([, count]) => count > 1)
        .map(([id, count]) => ({ id, count }));
}

function detectFormIssues(html) {
    const issues = [];

    const labels = new Set();

    const labelRegex =
        /<label\b[^>]*\bfor\s*=\s*["']([^"']+)["'][^>]*>/gi;

    let match;

    while ((match = labelRegex.exec(html))) {
        labels.add(match[1]);
    }

    const inputRegex =
        /<(input|select|textarea)\b([^>]*)>/gi;

    while ((match = inputRegex.exec(html))) {
        const tag = match[0];
        const attrs = parseTagAttributes(tag);

        if (
            attrs.type?.toLowerCase() === "hidden" ||
            attrs.type?.toLowerCase() === "submit" ||
            attrs.type?.toLowerCase() === "button"
        ) {
            continue;
        }

        if (!attrs.id || !labels.has(attrs.id)) {
            issues.push({
                element: match[1].toLowerCase(),
                name: attrs.name || "",
                id: attrs.id || ""
            });
        }
    }

    return issues;
}

function detectMixedContent(html, pageUrl) {
    if (pageUrl.protocol !== "https:") {
        return [];
    }

    const mixed = [];

    const regex =
        /(?:src|href|action)\s*=\s*["'](http:\/\/[^"']+)["']/gi;

    let match;

    while ((match = regex.exec(html))) {
        mixed.push(match[1]);
    }

    return [...new Set(mixed)];
}

async function scanTarget(targetUrl) {
    const scanStarted = performance.now();

    const fetched = await fetchPage(targetUrl);

    const response = fetched.response;
    const finalUrl = fetched.url;
    const html = fetched.html;

    const findings = [];

    const headers = getHeaderMap(response);

    const contentType = response.headers.get("content-type") || "";

    const csp = response.headers.get("content-security-policy") || "";

    const title = extractTitle(html);
    const description = extractMeta(html, "description");
    const canonical = extractCanonical(html);
    const viewport = extractMeta(html, "viewport");
    const robotsMeta = extractMeta(html, "robots");

    const h1Count = countMatches(html, /<h1\b[^>]*>/gi);

    const links = extractLinks(html);
    const images = extractImages(html);
    const scripts = extractScripts(html);
    const headings = detectHeadingIssues(html);
    const duplicateIds = detectDuplicateIds(html);
    const formIssues = detectFormIssues(html);

    const thirdPartyOrigins = extractExternalOrigins(
        html,
        finalUrl
    );

    const mixedContent = detectMixedContent(html, finalUrl);

    // ------------------------------------------------------------
    // SECURITY
    // ------------------------------------------------------------

    if (finalUrl.protocol === "https:") {
        if (!hasHeader(response.headers, "strict-transport-security")) {
            addFinding(
                findings,
                "security",
                "medium",
                "Missing HSTS",
                "The HTTPS response does not send Strict-Transport-Security."
            );
        }
    }

    if (!csp) {
        addFinding(
            findings,
            "security",
            "medium",
            "Missing Content-Security-Policy",
            "No Content-Security-Policy response header was detected."
        );
    }

    if (!hasFrameAncestors(csp) &&
        !hasHeader(response.headers, "x-frame-options")) {
        addFinding(
            findings,
            "security",
            "medium",
            "Missing clickjacking protection",
            "Neither X-Frame-Options nor a CSP frame-ancestors directive was detected."
        );
    }

    if (!hasHeader(response.headers, "x-content-type-options")) {
        addFinding(
            findings,
            "security",
            "low",
            "Missing X-Content-Type-Options",
            "The response does not send X-Content-Type-Options."
        );
    }

    if (!hasHeader(response.headers, "referrer-policy")) {
        addFinding(
            findings,
            "security",
            "low",
            "Missing Referrer-Policy",
            "The response does not explicitly define a Referrer-Policy."
        );
    }

    if (!hasHeader(response.headers, "permissions-policy")) {
        addFinding(
            findings,
            "security",
            "low",
            "Missing Permissions-Policy",
            "The response does not explicitly define Permissions-Policy."
        );
    }

    if (mixedContent.length) {
        addFinding(
            findings,
            "security",
            "medium",
            "Mixed content detected",
            `${mixedContent.length} HTTP resource URL(s) were found on an HTTPS page.`,
            mixedContent.slice(0, 10)
        );
    }

    if (headers.server) {
        addFinding(
            findings,
            "security",
            "info",
            "Server header disclosed",
            `The response exposes a Server header: ${headers.server}.`
        );
    }

    // ------------------------------------------------------------
    // PRIVACY
    // ------------------------------------------------------------

    const cookies = parseCookies(
        getSetCookieHeaders(response)
    );

    for (const cookie of cookies) {
        if (!cookie.secure && finalUrl.protocol === "https:") {
            addFinding(
                findings,
                "privacy",
                "medium",
                `Cookie "${cookie.name}" missing Secure`,
                "A cookie was set over an HTTPS page without the Secure attribute."
            );
        }

        if (!cookie.httpOnly) {
            addFinding(
                findings,
                "privacy",
                "low",
                `Cookie "${cookie.name}" missing HttpOnly`,
                "The cookie does not use HttpOnly, allowing client-side scripts to access it."
            );
        }

        if (!cookie.sameSite) {
            addFinding(
                findings,
                "privacy",
                "low",
                `Cookie "${cookie.name}" missing SameSite`,
                "The cookie does not explicitly define SameSite behavior."
            );
        }
    }

    if (thirdPartyOrigins.length) {
        addFinding(
            findings,
            "privacy",
            "info",
            "Third-party origins detected",
            `${thirdPartyOrigins.length} third-party origin(s) were referenced by the audited page.`,
            thirdPartyOrigins
        );
    }

    // ------------------------------------------------------------
    // PERFORMANCE
    // ------------------------------------------------------------

    const externalHeadScripts = [];

    const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);

    if (headMatch) {
        const headHtml = headMatch[1];

        const scriptRegex = /<script\b[^>]*>/gi;

        let match;

        while ((match = scriptRegex.exec(headHtml))) {
            const attrs = parseTagAttributes(match[0]);

            if (!attrs.src) {
                continue;
            }

            const isAsync = Object.prototype.hasOwnProperty.call(
                attrs,
                "async"
            );

            const isDefer = Object.prototype.hasOwnProperty.call(
                attrs,
                "defer"
            );

            const isModule = attrs.type?.toLowerCase() === "module";

            if (!isAsync && !isDefer && !isModule) {
                externalHeadScripts.push(attrs.src);
            }
        }
    }

    if (externalHeadScripts.length) {
        addFinding(
            findings,
            "performance",
            "low",
            "Render-blocking external scripts detected",
            `${externalHeadScripts.length} external script(s) in <head> lack async, defer, or module loading.`,
            externalHeadScripts.slice(0, 10)
        );
    }

    const contentEncoding =
        response.headers.get("content-encoding") || "";

    if (!contentEncoding && fetched.bytes > 100 * 1024) {
        addFinding(
            findings,
            "performance",
            "low",
            "HTML response is not compressed",
            "The HTML response is larger than 100 KiB and no Content-Encoding was detected."
        );
    }

    if (!response.headers.get("cache-control")) {
        addFinding(
            findings,
            "performance",
            "info",
            "No Cache-Control header detected",
            "The response does not expose a Cache-Control header."
        );
    }

    // ------------------------------------------------------------
    // SEO
    // ------------------------------------------------------------

    if (!title) {
        addFinding(
            findings,
            "seo",
            "medium",
            "Missing page title",
            "No HTML title element was detected."
        );
    } else if (title.length < 20 || title.length > 65) {
        addFinding(
            findings,
            "seo",
            "low",
            "Title length could improve",
            `The page title is ${title.length} characters long.`
        );
    }

    if (!description) {
        addFinding(
            findings,
            "seo",
            "low",
            "Missing meta description",
            "No meta description was detected."
        );
    } else if (description.length < 50 || description.length > 170) {
        addFinding(
            findings,
            "seo",
            "low",
            "Meta description length could improve",
            `The meta description is ${description.length} characters long.`
        );
    }

    if (!canonical) {
        addFinding(
            findings,
            "seo",
            "low",
            "Canonical URL not detected",
            "No canonical link element was detected."
        );
    } else {
        try {
            const canonicalUrl = new URL(canonical, finalUrl);

            if (canonicalUrl.protocol !== "https:" && finalUrl.protocol === "https:") {
                addFinding(
                    findings,
                    "seo",
                    "low",
                    "Canonical URL is not HTTPS",
                    `The canonical URL resolves to ${canonicalUrl.toString()}.`
                );
            }
        } catch {
            addFinding(
                findings,
                "seo",
                "low",
                "Invalid canonical URL",
                "A canonical element exists but its URL could not be parsed."
            );
        }
    }

    if (h1Count === 0) {
        addFinding(
            findings,
            "seo",
            "low",
            "Missing H1 heading",
            "No H1 heading was detected."
        );
    } else if (h1Count > 1) {
        addFinding(
            findings,
            "seo",
            "low",
            "Multiple H1 headings detected",
            `${h1Count} H1 headings were detected. Multiple H1 elements are allowed in HTML5, but should be intentional.`
        );
    }

    if (!extractMetaProperty(html, "og:title")) {
        addFinding(
            findings,
            "seo",
            "info",
            "No Open Graph title",
            "No og:title metadata was detected."
        );
    }

    if (!/application\/ld\+json/i.test(html)) {
        addFinding(
            findings,
            "seo",
            "info",
            "No JSON-LD structured data",
            "No application/ld+json block was detected."
        );
    }

    if (!viewport) {
        addFinding(
            findings,
            "seo",
            "low",
            "Missing viewport metadata",
            "No mobile viewport meta tag was detected."
        );
    }

    if (robotsMeta && /noindex/i.test(robotsMeta)) {
        addFinding(
            findings,
            "seo",
            "info",
            "Page explicitly uses noindex",
            "The page's robots metadata contains noindex."
        );
    }

    // ------------------------------------------------------------
    // ACCESSIBILITY
    // ------------------------------------------------------------

    const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] || "";

    const htmlAttrs = parseTagAttributes(htmlTag);

    if (!htmlAttrs.lang) {
        addFinding(
            findings,
            "accessibility",
            "medium",
            "Missing document language",
            "The HTML element does not declare a lang attribute."
        );
    }

    const missingAlt = images.filter(
        image => !Object.prototype.hasOwnProperty.call(image, "alt")
    ).length;

    if (missingAlt) {
        addFinding(
            findings,
            "accessibility",
            "medium",
            "Images missing alt attributes",
            `${missingAlt} image(s) do not have an alt attribute.`
        );
    }

    if (!/<main\b/i.test(html)) {
        addFinding(
            findings,
            "accessibility",
            "low",
            "Main landmark not detected",
            "No <main> element was detected."
        );
    }

    if (duplicateIds.length) {
        addFinding(
            findings,
            "accessibility",
            "low",
            "Duplicate HTML IDs detected",
            `${duplicateIds.length} duplicate ID value(s) were detected.`,
            duplicateIds.slice(0, 20)
        );
    }

    if (formIssues.length) {
        addFinding(
            findings,
            "accessibility",
            "low",
            "Form controls may lack labels",
            `${formIssues.length} form control(s) were not associated with a matching label.`,
            formIssues.slice(0, 20)
        );
    }

    const headingProblems = [];

    for (let i = 1; i < headings.length; i++) {
        const previous = headings[i - 1].level;
        const current = headings[i].level;

        if (current - previous > 1) {
            headingProblems.push({
                from: previous,
                to: current,
                text: headings[i].text
            });
        }
    }

    if (headingProblems.length) {
        addFinding(
            findings,
            "accessibility",
            "low",
            "Heading levels skip",
            `${headingProblems.length} heading transition(s) skip one or more levels.`,
            headingProblems.slice(0, 20)
        );
    }

    // ------------------------------------------------------------
    // CONFIGURATION
    // ------------------------------------------------------------

    if (fetched.redirects.length) {
        addFinding(
            findings,
            "configuration",
            "info",
            "Redirects detected",
            `${fetched.redirects.length} redirect(s) were followed before reaching the final page.`,
            fetched.redirects
        );
    }

    const envProbe = await fetchProbe(
        new URL("/.env", finalUrl).toString()
    );

    if (looksLikeRealEnv(envProbe.body, envProbe.contentType)) {
        addFinding(
            findings,
            "configuration",
            "high",
            "Potentially exposed .env file",
            "A public /.env request returned content that resembles a real environment configuration file."
        );
    }

    const gitProbe = await fetchProbe(
        new URL("/.git/config", finalUrl).toString()
    );

    if (looksLikeGitConfig(gitProbe.body, gitProbe.contentType)) {
        addFinding(
            findings,
            "configuration",
            "high",
            "Potentially exposed Git configuration",
            "A public /.git/config request returned content that resembles a Git repository configuration file."
        );
    }

    const gitHeadProbe = await fetchProbe(
        new URL("/.git/HEAD", finalUrl).toString()
    );

    if (
        gitHeadProbe.status >= 200 &&
        gitHeadProbe.status < 300 &&
        !looksLikeHtml(gitHeadProbe.body, gitHeadProbe.contentType) &&
        /^ref:\s+refs\/heads\//i.test(gitHeadProbe.body.trim())
    ) {
        addFinding(
            findings,
            "configuration",
            "high",
            "Potentially exposed Git repository",
            "A public /.git/HEAD request returned a valid Git branch reference."
        );
    }

    const robotsProbe = await fetchProbe(
        new URL("/robots.txt", finalUrl).toString()
    );

    if (
        robotsProbe.status >= 200 &&
        robotsProbe.status < 300 &&
        looksLikeRealRobots(
            robotsProbe.body,
            robotsProbe.contentType
        )
    ) {
        addFinding(
            findings,
            "configuration",
            "info",
            "robots.txt detected",
            "A valid robots.txt response was detected."
        );
    } else {
        addFinding(
            findings,
            "configuration",
            "low",
            "robots.txt not detected",
            "No valid public robots.txt response was detected."
        );
    }

    const sitemapProbe = await fetchProbe(
        new URL("/sitemap.xml", finalUrl).toString()
    );

    if (
        sitemapProbe.status >= 200 &&
        sitemapProbe.status < 300 &&
        looksLikeSitemap(
            sitemapProbe.body,
            sitemapProbe.contentType
        )
    ) {
        addFinding(
            findings,
            "configuration",
            "info",
            "sitemap.xml detected",
            "A valid XML sitemap response was detected."
        );
    } else {
        addFinding(
            findings,
            "configuration",
            "low",
            "sitemap.xml not detected",
            "No valid public sitemap.xml response was detected."
        );
    }

    // ------------------------------------------------------------
    // DNS
    // ------------------------------------------------------------

    const hostname = finalUrl.hostname;

    const [aRecords, aaaaRecords, cnameRecords, mxRecords, nsRecords] =
        await Promise.all([
            dnsLookup(hostname, "A"),
            dnsLookup(hostname, "AAAA"),
            dnsLookup(hostname, "CNAME"),
            dnsLookup(hostname, "MX"),
            dnsLookup(hostname, "NS")
        ]);

    const scanDurationMs = Math.round(
        performance.now() - scanStarted
    );

    // ------------------------------------------------------------
    // SCORES
    // ------------------------------------------------------------

    const scores = {};

    for (const category of Object.keys(CATEGORY_WEIGHTS)) {
        scores[category] = scoreCategory(findings, category);
    }

    const overallScore = Math.round(
        Object.values(scores).reduce((sum, value) => sum + value, 0) /
        Object.keys(scores).length
    );

    const overall = {
        score: overallScore,
        grade: gradeForScore(overallScore)
    };

    return {
        scannerVersion: SCANNER_VERSION,

        overall,

        scores,

        summary: buildSummary(overall, findings),

        finalUrl: finalUrl.toString(),

        page: {
            title,
            htmlBytes: fetched.bytes,
            links: links.length,
            images: images.length,
            scripts: scripts.length,
            contentType,
            status: response.status,
            protocol: finalUrl.protocol
        },

        performance: {
            ttfbMs: fetched.ttfbMs,
            scanDurationMs,
            contentEncoding,
            externalHeadRenderBlockingScripts: externalHeadScripts.length,
            imageCount: images.length,
            cacheControl: response.headers.get("cache-control") || ""
        },

        privacy: {
            cookies,
            thirdPartyOrigins
        },

        accessibility: {
            imageCount: images.length,
            missingAlt,
            h1Count,
            headingCount: headings.length,
            duplicateIdCount: duplicateIds.length,
            unlabeledFormControlCount: formIssues.length
        },

        configuration: {
            redirects: fetched.redirects.length,
            redirectChain: fetched.redirects,
            probes: {
                env: {
                    status: envProbe.status,
                    contentType: envProbe.contentType
                },
                gitConfig: {
                    status: gitProbe.status,
                    contentType: gitProbe.contentType
                },
                gitHead: {
                    status: gitHeadProbe.status,
                    contentType: gitHeadProbe.contentType
                },
                robots: {
                    status: robotsProbe.status,
                    valid: looksLikeRealRobots(
                        robotsProbe.body,
                        robotsProbe.contentType
                    )
                },
                sitemap: {
                    status: sitemapProbe.status,
                    valid: looksLikeSitemap(
                        sitemapProbe.body,
                        sitemapProbe.contentType
                    )
                }
            }
        },

        dns: {
            hostname,
            A: aRecords,
            AAAA: aaaaRecords,
            CNAME: cnameRecords,
            MX: mxRecords,
            NS: nsRecords
        },

        headers: {
            hsts: headers["strict-transport-security"] || "",
            csp: headers["content-security-policy"] || "",
            xContentTypeOptions:
                headers["x-content-type-options"] || "",
            xFrameOptions:
                headers["x-frame-options"] || "",
            referrerPolicy:
                headers["referrer-policy"] || "",
            permissionsPolicy:
                headers["permissions-policy"] || "",
            server:
                headers["server"] || "",
            cacheControl:
                headers["cache-control"] || "",
            contentEncoding:
                headers["content-encoding"] || ""
        },

        seo: {
            title,
            titleLength: title.length,
            description,
            descriptionLength: description.length,
            canonical,
            viewport,
            robotsMeta,
            h1Count,
            openGraphTitle: extractMetaProperty(
                html,
                "og:title"
            ),
            hasJsonLd: /application\/ld\+json/i.test(html)
        },

        findings
    };
}

async function handleScan(request, origin) {
    let body;

    try {
        body = await request.json();
    } catch {
        return json(
            { error: "Request body must be valid JSON." },
            400,
            origin
        );
    }

    let target;

    try {
        target = normalizeUrl(body?.url);
    } catch (error) {
        return json(
            { error: error.message },
            400,
            origin
        );
    }

    try {
        const result = await scanTarget(target);

        return json(result, 200, origin);
    } catch (error) {
        return json(
            {
                scannerVersion: SCANNER_VERSION,
                error: error?.message || "Scan failed."
            },
            502,
            origin
        );
    }
}

export default {
    async fetch(request) {
        const origin = request.headers.get("Origin") || "";

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(origin)
            });
        }

        const url = new URL(request.url);

        if (request.method === "GET" && url.pathname === "/health") {
            return json(
                {
                    ok: true,
                    scannerVersion: SCANNER_VERSION,
                    service: "SiteGrade scanner"
                },
                200,
                origin
            );
        }

        if (request.method === "POST" && url.pathname === "/scan") {
            return handleScan(request, origin);
        }

        return json(
            {
                error: "Not found."
            },
            404,
            origin
        );
    }
};