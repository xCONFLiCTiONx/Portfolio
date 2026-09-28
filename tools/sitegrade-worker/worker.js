const ALLOWED_ORIGINS = new Set([
    "https://xconflictionx.cc",
    "https://www.xconflictionx.cc"
]);

const SCANNER_VERSION = "3.0";

const SECURITY_HEADERS = {
    hsts: "strict-transport-security",
    csp: "content-security-policy",
    xcto: "x-content-type-options",
    xfo: "x-frame-options",
    referrer: "referrer-policy",
    permissions: "permissions-policy"
};

const PRIVATE_HOST_PATTERNS = [
    /^localhost$/i,
    /^localhost\./i,
    /^127\./,
    /^0\./,
    /^10\./,
    /^192\.168\./,
    /^169\.254\./,
    /^172\.(1[6-9]|2\d|3[0-1])\./,
    /^\[?::1\]?$/,
    /^\[?fc/i,
    /^\[?fd/i,
    /^\[?fe80:/i
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function corsHeaders(origin) {
    const headers = {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Vary": "Origin"
    };

    if (origin && ALLOWED_ORIGINS.has(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }

    return headers;
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
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are supported.");
    }

    if (url.username || url.password) {
        throw new Error("URLs containing credentials are not allowed.");
    }

    if (isPrivateHostname(url.hostname)) {
        throw new Error("Private or local targets are not allowed.");
    }

    return url;
}

function isPrivateHostname(hostname) {
    const host = hostname.toLowerCase().replace(/\.$/, "");

    if (PRIVATE_HOST_PATTERNS.some(rx => rx.test(host))) {
        return true;
    }

    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        const parts = host.split(".").map(Number);

        if (
            parts[0] === 10 ||
            parts[0] === 127 ||
            parts[0] === 0 ||
            (parts[0] === 192 && parts[1] === 168) ||
            (parts[0] === 169 && parts[1] === 254) ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
        ) {
            return true;
        }
    }

    return false;
}

async function fetchPage(url, options = {}) {
    const maxRedirects = options.maxRedirects ?? 8;

    let current = new URL(url);

    for (let i = 0; i <= maxRedirects; i++) {
        const response = await fetch(current.toString(), {
            method: "GET",
            redirect: "manual",
            headers: {
                "User-Agent":
                    "SiteGrade/3.0 (+https://xconflictionx.cc/tools/)"
            }
        });

        const location = response.headers.get("location");

        if (
            location &&
            response.status >= 300 &&
            response.status < 400
        ) {
            if (i === maxRedirects) {
                throw new Error("Too many redirects.");
            }

            const next = new URL(location, current);

            if (!["http:", "https:"].includes(next.protocol)) {
                throw new Error("Redirected to unsupported protocol.");
            }

            if (isPrivateHostname(next.hostname)) {
                throw new Error("Redirected to a private or local target.");
            }

            current = next;
            continue;
        }

        return {
            response,
            finalUrl: current,
            redirects: i
        };
    }

    throw new Error("Unable to retrieve target.");
}

async function fetchProbe(url, path) {
    const target = new URL(path, url);

    const response = await fetch(target.toString(), {
        method: "GET",
        redirect: "manual",
        headers: {
            "User-Agent":
                "SiteGrade/3.0 (+https://xconflictionx.cc/tools/)"
        }
    });

    const contentType =
        response.headers.get("content-type") || "";

    const lengthHeader =
        response.headers.get("content-length");

    const maxRead = 512 * 1024;

    let body = "";

    if (lengthHeader && Number(lengthHeader) > maxRead) {
        body = "";
    } else {
        const buffer = await response.arrayBuffer();

        if (buffer.byteLength <= maxRead) {
            body = new TextDecoder().decode(buffer);
        }
    }

    return {
        response,
        body,
        contentType,
        url: target
    };
}

/*
 * IMPORTANT:
 *
 * Cloudflare Pages, SPA hosts, frameworks and custom 404 handlers
 * frequently return HTTP 200 with the site's normal HTML for files
 * that do NOT exist.
 *
 * Therefore:
 *
 * status === 200
 *
 * is NEVER sufficient evidence that /.env or /.git/config exists.
 */

function looksLikeHtml(body, contentType = "") {
    if (/text\/html/i.test(contentType)) {
        return true;
    }

    return /^\s*(<!doctype\s+html|<html[\s>])/i.test(body);
}

function looksLikeRealEnv(body, contentType) {
    if (!body || body.length > 200000) {
        return false;
    }

    if (looksLikeHtml(body, contentType)) {
        return false;
    }

    const text = body.trim();

    if (!text) {
        return false;
    }

    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .filter(line => !line.startsWith("#"));

    if (lines.length < 2) {
        return false;
    }

    const assignments = lines.filter(line =>
        /^[A-Za-z_][A-Za-z0-9_]*\s*=\s*.*$/.test(line)
    );

    /*
     * Require multiple actual environment assignments.
     * This prevents arbitrary text containing a single "=" from
     * becoming an exposed .env finding.
     */
    return assignments.length >= 2 &&
        assignments.length / lines.length >= 0.5;
}

function looksLikeGitConfig(body, contentType) {
    if (!body || body.length > 200000) {
        return false;
    }

    if (looksLikeHtml(body, contentType)) {
        return false;
    }

    const text = body.trim();

    if (!text) {
        return false;
    }

    /*
     * Real .git/config files contain Git INI sections.
     */
    const hasGitSection =
        /\[(?:core|remote\s+"[^"]+"|branch\s+"[^"]+"|user|credential|http|submodule)\]/i
            .test(text);

    const hasRepositoryMarker =
        /repositoryformatversion\s*=\s*\d+/i.test(text);

    const hasRemoteMarker =
        /\[remote\s+"[^"]+"\]/i.test(text);

    const hasCoreMarker =
        /\[core\]/i.test(text);

    return (
        hasGitSection &&
        (
            hasRepositoryMarker ||
            hasRemoteMarker ||
            hasCoreMarker
        )
    );
}

function isNormalFallbackPage(body, contentType, originalPath) {
    if (!body) {
        return false;
    }

    if (looksLikeHtml(body, contentType)) {
        return true;
    }

    /*
     * Some hosts omit content-type but still return their normal
     * application shell.
     */
    if (
        /<head[\s>]/i.test(body) &&
        /<body[\s>]/i.test(body)
    ) {
        return true;
    }

    return false;
}

function first(text, regex) {
    const match = text.match(regex);
    return match ? match[1] : "";
}

function attr(text, name) {
    return first(
        text,
        new RegExp(
            "\\b" +
            name +
            "\\s*=\\s*[\"']([^\"']*)[\"']",
            "i"
        )
    );
}

function countMatches(text, regex) {
    return (text.match(regex) || []).length;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function addFinding(findings, severity, title, detail, category) {
    findings.push({
        severity,
        title,
        detail,
        category
    });
}

async function scanTarget(target) {
    const started = Date.now();

    const fetched = await fetchPage(target.toString());

    const response = fetched.response;
    const finalUrl = fetched.finalUrl;
    const redirects = fetched.redirects;

    const html = await response.text();

    const headers = response.headers;

    const findings = [];

    /*
     * ------------------------------------------------------------
     * SECURITY
     * ------------------------------------------------------------
     */

    if (!headers.get(SECURITY_HEADERS.hsts)) {
        addFinding(
            findings,
            "medium",
            "Missing HSTS",
            "Strict-Transport-Security was not detected.",
            "security"
        );
    }

    const csp = headers.get(SECURITY_HEADERS.csp);

    if (!csp) {
        addFinding(
            findings,
            "medium",
            "Missing Content-Security-Policy",
            "No Content-Security-Policy response header was detected.",
            "security"
        );
    } else {
        if (/unsafe-inline/i.test(csp)) {
            addFinding(
                findings,
                "low",
                "CSP permits unsafe-inline",
                "The Content-Security-Policy contains unsafe-inline.",
                "security"
            );
        }

        if (/unsafe-eval/i.test(csp)) {
            addFinding(
                findings,
                "low",
                "CSP permits unsafe-eval",
                "The Content-Security-Policy contains unsafe-eval.",
                "security"
            );
        }
    }

    if (!headers.get(SECURITY_HEADERS.xcto)) {
        addFinding(
            findings,
            "low",
            "Missing X-Content-Type-Options",
            "X-Content-Type-Options was not detected.",
            "security"
        );
    }

    if (!headers.get(SECURITY_HEADERS.xfo)) {
        addFinding(
            findings,
            "medium",
            "Missing X-Frame-Options",
            "Protect against unwanted framing.",
            "security"
        );
    }

    if (!headers.get(SECURITY_HEADERS.referrer)) {
        addFinding(
            findings,
            "low",
            "Missing Referrer-Policy",
            "A Referrer-Policy response header was not detected.",
            "security"
        );
    }

    if (!headers.get(SECURITY_HEADERS.permissions)) {
        addFinding(
            findings,
            "medium",
            "Missing Permissions-Policy",
            "Restrict unused browser features.",
            "security"
        );
    }

    if (headers.get("server")) {
        addFinding(
            findings,
            "info",
            "Server header disclosed",
            "A Server response header is exposed.",
            "security"
        );
    }

    /*
     * ------------------------------------------------------------
     * REAL EXPOSED FILE CHECKS
     * ------------------------------------------------------------
     */

    const envProbe = await fetchProbe(finalUrl, "/.env");

    if (
        envProbe.response.ok &&
        !isNormalFallbackPage(
            envProbe.body,
            envProbe.contentType,
            "/.env"
        ) &&
        looksLikeRealEnv(
            envProbe.body,
            envProbe.contentType
        )
    ) {
        addFinding(
            findings,
            "high",
            "Potentially exposed /.env",
            "A publicly accessible response contained environment-variable assignments.",
            "security"
        );
    }

    const gitProbe = await fetchProbe(
        finalUrl,
        "/.git/config"
    );

    if (
        gitProbe.response.ok &&
        !isNormalFallbackPage(
            gitProbe.body,
            gitProbe.contentType,
            "/.git/config"
        ) &&
        looksLikeGitConfig(
            gitProbe.body,
            gitProbe.contentType
        )
    ) {
        addFinding(
            findings,
            "high",
            "Potentially exposed /.git/config",
            "A publicly accessible response contained Git repository configuration data.",
            "security"
        );
    }

    /*
     * ------------------------------------------------------------
     * SEO
     * ------------------------------------------------------------
     */

    const title = first(
        html,
        /<title[^>]*>([\s\S]*?)<\/title>/i
    ).trim();

    const description = first(
        html,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
    );

    const canonical = first(
        html,
        /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']*)["']/i
    );

    const h1Count = countMatches(
        html,
        /<h1\b[^>]*>/gi
    );

    const ogTitle = first(
        html,
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i
    );

    const jsonLd = /<script[^>]+type=["']application\/ld\+json["']/i
        .test(html);

    if (!title) {
        addFinding(
            findings,
            "medium",
            "Missing page title",
            "No HTML title element was detected.",
            "seo"
        );
    } else if (title.length < 30 || title.length > 60) {
        addFinding(
            findings,
            "low",
            "Title length could improve",
            `The title is ${title.length} characters.`,
            "seo"
        );
    }

    if (!description) {
        addFinding(
            findings,
            "low",
            "Missing meta description",
            "No meta description was detected.",
            "seo"
        );
    }

    if (!canonical) {
        addFinding(
            findings,
            "low",
            "Canonical URL not detected",
            "No canonical link was detected.",
            "seo"
        );
    }

    if (h1Count === 0) {
        addFinding(
            findings,
            "low",
            "No H1 heading detected",
            "The page does not contain an H1 element.",
            "seo"
        );
    }

    if (!ogTitle) {
        addFinding(
            findings,
            "info",
            "No Open Graph title",
            "og:title was not detected.",
            "seo"
        );
    }

    if (!jsonLd) {
        addFinding(
            findings,
            "info",
            "No JSON-LD structured data",
            "Structured data was not detected.",
            "seo"
        );
    }

    /*
     * ------------------------------------------------------------
     * ACCESSIBILITY
     * ------------------------------------------------------------
     */

    const lang = attr(
        html.match(/<html\b[^>]*>/i)?.[0] || "",
        "lang"
    );

    const images = [
        ...html.matchAll(/<img\b[^>]*>/gi)
    ];

    let missingAlt = 0;

    for (const match of images) {
        const tag = match[0];

        if (!/\balt\s*=/i.test(tag)) {
            missingAlt++;
        }
    }

    if (!lang) {
        addFinding(
            findings,
            "low",
            "HTML language not declared",
            "The root html element does not declare a lang attribute.",
            "accessibility"
        );
    }

    if (missingAlt > 0) {
        addFinding(
            findings,
            "medium",
            "Images missing alt text",
            `${missingAlt} image(s) do not have an alt attribute.`,
            "accessibility"
        );
    }

    if (!/<main\b/i.test(html)) {
        addFinding(
            findings,
            "low",
            "Main landmark not detected",
            "No main landmark was detected.",
            "accessibility"
        );
    }

    /*
     * ------------------------------------------------------------
     * PERFORMANCE
     * ------------------------------------------------------------
     */

    const htmlBytes = new TextEncoder().encode(html).byteLength;

    const renderBlockingScripts = [
        ...html.matchAll(/<script\b[^>]*>/gi)
    ].filter(match => {
        const tag = match[0];

        if (/\basync\b/i.test(tag)) return false;
        if (/\bdefer\b/i.test(tag)) return false;
        if (/type\s*=\s*["']module["']/i.test(tag)) return false;

        return true;
    }).length;

    if (renderBlockingScripts > 0) {
        addFinding(
            findings,
            "low",
            "Render-blocking scripts detected",
            `${renderBlockingScripts} script(s) lack async, defer, or module loading.`,
            "performance"
        );
    }

    /*
     * ------------------------------------------------------------
     * CONFIGURATION
     * ------------------------------------------------------------
     */

    const robotsProbe = await fetchProbe(
        finalUrl,
        "/robots.txt"
    );

    const robotsExists =
        robotsProbe.response.ok &&
        !isNormalFallbackPage(
            robotsProbe.body,
            robotsProbe.contentType,
            "/robots.txt"
        ) &&
        /(^|\n)\s*(user-agent|disallow|allow|sitemap)\s*:/i
            .test(robotsProbe.body);

    if (!robotsExists) {
        addFinding(
            findings,
            "low",
            "robots.txt not detected",
            "A valid robots.txt response was not detected.",
            "configuration"
        );
    }

    const sitemapProbe = await fetchProbe(
        finalUrl,
        "/sitemap.xml"
    );

    const sitemapExists =
        sitemapProbe.response.ok &&
        !isNormalFallbackPage(
            sitemapProbe.body,
            sitemapProbe.contentType,
            "/sitemap.xml"
        ) &&
        /<urlset[\s>]|<sitemapindex[\s>]/i
            .test(sitemapProbe.body);

    if (!sitemapExists) {
        addFinding(
            findings,
            "low",
            "sitemap.xml not detected",
            "A valid XML sitemap response was not detected.",
            "configuration"
        );
    }

    /*
     * ------------------------------------------------------------
     * PRIVACY
     * ------------------------------------------------------------
     */

    const setCookie = headers.get("set-cookie") || "";

    if (setCookie) {
        if (!/;\s*secure\b/i.test(setCookie)) {
            addFinding(
                findings,
                "medium",
                "Cookie missing Secure",
                "A Set-Cookie response was detected without the Secure attribute.",
                "privacy"
            );
        }

        if (!/;\s*httponly\b/i.test(setCookie)) {
            addFinding(
                findings,
                "low",
                "Cookie missing HttpOnly",
                "A Set-Cookie response was detected without HttpOnly.",
                "privacy"
            );
        }

        if (!/;\s*samesite=/i.test(setCookie)) {
            addFinding(
                findings,
                "low",
                "Cookie missing SameSite",
                "A Set-Cookie response was detected without SameSite.",
                "privacy"
            );
        }
    }

    const pageOrigin = finalUrl.origin;

    const thirdPartyOrigins = [
        ...new Set(
            [
                ...html.matchAll(
                    /\b(?:src|href|action)=["']([^"']+)["']/gi
                )
            ]
                .map(m => m[1])
                .filter(value => /^https?:\/\//i.test(value))
                .map(value => {
                    try {
                        return new URL(value, finalUrl).origin;
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean)
                .filter(origin => origin !== pageOrigin)
        )
    ];

    /*
     * ------------------------------------------------------------
     * DNS
     * ------------------------------------------------------------
     */

    const dns = {};

    async function doh(name, type) {
        const url =
            "https://cloudflare-dns.com/dns-query?name=" +
            encodeURIComponent(name) +
            "&type=" +
            encodeURIComponent(type);

        const res = await fetch(url, {
            headers: {
                Accept: "application/dns-json"
            }
        });

        if (!res.ok) {
            return null;
        }

        return res.json();
    }

    try {
        dns.A = await doh(finalUrl.hostname, "A");
        dns.AAAA = await doh(finalUrl.hostname, "AAAA");
        dns.CNAME = await doh(finalUrl.hostname, "CNAME");
        dns.MX = await doh(finalUrl.hostname, "MX");
        dns.NS = await doh(finalUrl.hostname, "NS");
    } catch {
        dns.error = "DNS lookup failed.";
    }

    /*
     * ------------------------------------------------------------
     * SCORING
     * ------------------------------------------------------------
     */

    const categories = [
        "security",
        "privacy",
        "performance",
        "seo",
        "configuration",
        "accessibility"
    ];

    const weights = {
        high: 20,
        medium: 10,
        low: 4,
        info: 0
    };

    const scores = {};

    for (const category of categories) {
        let penalty = 0;

        for (const finding of findings) {
            if (finding.category !== category) {
                continue;
            }

            penalty += weights[finding.severity] || 0;
        }

        scores[category] =
            Math.max(0, Math.min(100, 100 - penalty));
    }

    const overall = Math.round(
        categories.reduce(
            (sum, category) => sum + scores[category],
            0
        ) / categories.length
    );

    const durationMs = Date.now() - started;

    return {
        ok: true,
        scannerVersion: SCANNER_VERSION,

        target: target.toString(),
        finalUrl: finalUrl.toString(),

        overall: {
            score: overall,
            grade: gradeForScore(overall)
        },

        scores,

        findings: findings.sort((a, b) => {
            const order = {
                high: 0,
                medium: 1,
                low: 2,
                info: 3
            };

            return (
                (order[a.severity] ?? 9) -
                (order[b.severity] ?? 9)
            );
        }),

        page: {
            title: title || "Untitled",
            htmlBytes,
            links: countMatches(
                html,
                /<a\b[^>]*href\s*=/gi
            ),
            images: images.length
        },

        privacy: {
            hasCookies: Boolean(setCookie),
            thirdPartyOrigins
        },

        performance: {
            htmlBytes,
            ttfbMs: durationMs,
            imageCount: images.length,
            renderBlockingScripts,
            contentEncoding:
                headers.get("content-encoding") || null,
            cacheControl:
                headers.get("cache-control") || null
        },

        accessibility: {
            missingAlt,
            imageCount: images.length,
            hasLang: Boolean(lang),
            hasMain: /<main\b/i.test(html)
        },

        configuration: {
            redirects,
            robotsTxt: robotsExists,
            sitemapXml: sitemapExists
        },

        dns,

        durationMs
    };
}

export default {
    async fetch(request) {
        const origin =
            request.headers.get("Origin") || "";

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(origin)
            });
        }

        const url = new URL(request.url);

        if (url.pathname === "/health") {
            return json({
                ok: true,
                service: "SiteGrade",
                scannerVersion: SCANNER_VERSION,
                time: new Date().toISOString()
            }, 200, origin);
        }

        if (url.pathname !== "/scan") {
            return json({
                error: "Not found"
            }, 404, origin);
        }

        if (request.method !== "POST") {
            return json({
                error: "POST required"
            }, 405, origin);
        }

        if (
            origin &&
            !ALLOWED_ORIGINS.has(origin)
        ) {
            return json({
                error: "Origin not allowed."
            }, 403, origin);
        }

        try {
            const body = await request.json();

            if (
                !body ||
                typeof body.url !== "string" ||
                !body.url.trim()
            ) {
                return json({
                    error: "A website URL is required."
                }, 400, origin);
            }

            const target = normalizeUrl(body.url.trim());

            const result = await scanTarget(target);

            return json(result, 200, origin);

        } catch (error) {
            return json({
                ok: false,
                scannerVersion: SCANNER_VERSION,
                error:
                    error instanceof Error
                        ? error.message
                        : "Scanner failed."
            }, 400, origin);
        }
    }
};