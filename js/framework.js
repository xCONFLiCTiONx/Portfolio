/**
 * Portable Static Portfolio Framework
 * Central Framework Controller & Layout Engine
 */

(function () {
    'use strict';

    window.PortfolioFramework = window.PortfolioFramework || {};

    let cachedConfig = null;
    let configPromise = null;

    /**
     * Calculates relative path to site root directory based on document depth or meta tag
     */
    function getRootPrefix() {
        const metaRoot = document.querySelector('meta[name="portfolio-root"]');
        if (metaRoot && metaRoot.getAttribute('content')) {
            let prefix = metaRoot.getAttribute('content');
            if (!prefix.endsWith('/')) prefix += '/';
            return prefix;
        }

        // Calculate depth relative to root by examining path segments
        const pathname = window.location.pathname;
        const segments = pathname.split('/').filter(s => s.length > 0);

        // If last segment contains a file extension or is empty, exclude from directory depth
        const last = segments[segments.length - 1] || '';
        const isFile = last.includes('.') || last === '';
        const dirDepth = isFile ? Math.max(0, segments.length - 1) : segments.length;

        if (dirDepth === 0) return './';
        return '../'.repeat(dirDepth);
    }

    /**
     * Helper to resolve relative URLs from config paths
     */
    function toRelativeUrl(path) {
        if (!path) return '#';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//') || path.startsWith('mailto:')) {
            return path;
        }
        const rootPrefix = getRootPrefix();
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return rootPrefix + cleanPath;
    }

    /**
     * Ensures main.css stylesheet link exists in document head
     */
    function ensureMainCssLoaded() {
        const rootPrefix = getRootPrefix();
        const cssUrl = rootPrefix + 'css/main.css';
        const existingLink = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .find(l => l.getAttribute('href') && l.getAttribute('href').includes('css/main.css'));

        if (!existingLink && document.head) {
            const linkEl = document.createElement('link');
            linkEl.rel = 'stylesheet';
            linkEl.href = cssUrl;
            document.head.prepend(linkEl);
        }
    }

    /**
     * Loads portfolio.config.json
     */
    async function getPortfolioConfig() {
        if (cachedConfig) return cachedConfig;
        if (configPromise) return configPromise;

        configPromise = (async () => {
            const rootPrefix = getRootPrefix();
            const configUrls = [
                rootPrefix + 'portfolio.config.json',
                './portfolio.config.json',
                '../portfolio.config.json',
                '../../portfolio.config.json'
            ];

            for (const url of configUrls) {
                try {
                    const res = await fetch(url, { cache: 'no-cache' });
                    if (res.ok) {
                        cachedConfig = await res.json();
                        window.PortfolioConfig = cachedConfig;
                        return cachedConfig;
                    }
                } catch (e) {
                    // Try next URL fallback
                }
            }

            console.warn('[Framework] Could not fetch portfolio.config.json, using fallback configuration.');
            cachedConfig = {
                site: {
                    name: "xCONFLiCTiONx",
                    title: "xCONFLiCTiONx Portfolio",
                    description: "Software Developer Portfolio",
                    author: "xCONFLiCTiONx"
                },
                github: {
                    username: "xCONFLiCTiONx",
                    profileUrl: "https://github.com/xCONFLiCTiONx"
                },
                navigation: [
                    { label: "Overview", path: "index.html", icon: "im im-home" },
                    { label: "About", path: "about/", icon: "im im-user-male" },
                    { label: "Tools", path: "tools/index.html", icon: "im im-tools" },
                    { label: "Privacy", path: "privacy/", icon: "im im-shield" },
                    { label: "Contact", path: "contact/", icon: "im im-paperplane" }
                ],
                socials: [
                    { name: "GitHub", url: "https://github.com/xCONFLiCTiONx", icon: "im im-github" }
                ],
                tools: []
            };
            window.PortfolioConfig = cachedConfig;
            return cachedConfig;
        })();

        return configPromise;
    }
    let cachedAdsHtml = null;
    let adsPromise = null;

    /**
     * Normalizes relative protocols for local file execution
     */
    function normalizeAdProtocols(html) {
        if (!html) return '';
        if (window.location.protocol === 'file:' && html.includes('src="//')) {
            return html.replace(/src=(['"])(\/\/)/g, 'src=$1https://');
        }
        return html;
    }

    /**
     * Loads ads.config.html template snippet
     */
    async function getAdsSnippet(config) {
        if (cachedAdsHtml !== null) return cachedAdsHtml;
        if (adsPromise) return adsPromise;

        adsPromise = (async () => {
            const rootPrefix = getRootPrefix();
            const templateFile = config?.ads?.template || 'ads.config.html';
            const cleanTemplate = templateFile.replace(/^\//, '');
            const adUrls = [
                rootPrefix + cleanTemplate,
                './' + cleanTemplate,
                '../' + cleanTemplate,
                '../../' + cleanTemplate
            ];

            for (const url of adUrls) {
                try {
                    const res = await fetch(url, { cache: 'no-cache' });
                    if (res.ok) {
                        const html = await res.text();
                        if (html && html.trim()) {
                            cachedAdsHtml = normalizeAdProtocols(html.trim());
                            return cachedAdsHtml;
                        }
                    }
                } catch (e) {
                    // Try next fallback
                }
            }

            // Fallback default snippet matching ads.config.html
            cachedAdsHtml = normalizeAdProtocols(`<!-- BEGIN AADS AD UNIT 2459260 -->
<div id="frame" style="width: 100%;margin: auto;position: relative; z-index: 99998;">
          <iframe data-aa='2459260' src='//acceptable.a-ads.com/2459260/?size=Adaptive'
                            style='border:0; padding:0; width:70%; height:auto; overflow:hidden;display: block;margin: auto'></iframe>
        </div>
<!-- END AADS AD UNIT 2459260 -->`);
            return cachedAdsHtml;
        })();

        return adsPromise;
    }


    /**
     * Detect current page's tool metadata and layout configuration
     */
    function resolvePageLayout(config) {
        const bodyToolId = document.body ? document.body.getAttribute('data-tool-id') : null;
        const metaToolId = document.querySelector('meta[name="portfolio-tool-id"]')?.getAttribute('content');
        const toolId = bodyToolId || metaToolId;

        let matchedTool = null;
        if (toolId && config.tools) {
            matchedTool = config.tools.find(t => t.id === toolId);
        }

        if (!matchedTool && config.tools) {
            const currentPath = window.location.pathname.toLowerCase();
            matchedTool = config.tools.find(t => {
                const toolCleanPath = t.path.toLowerCase().replace(/^\//, '');
                return currentPath.endsWith(toolCleanPath) || currentPath.endsWith(toolCleanPath.replace('/index.html', '/'));
            });
        }

        // Read inline layout override flags on body or meta tags if present
        const metaHeader = document.querySelector('meta[name="portfolio-layout-header"]')?.getAttribute('content');
        const metaSidebar = document.querySelector('meta[name="portfolio-layout-sidebar"]')?.getAttribute('content');
        const metaFooter = document.querySelector('meta[name="portfolio-layout-footer"]')?.getAttribute('content');
        const metaAds = document.querySelector('meta[name="portfolio-layout-ads"]')?.getAttribute('content');

        const layout = {
            header: matchedTool?.layout?.header ?? true,
            sidebar: matchedTool?.layout?.sidebar ?? true,
            footer: matchedTool?.layout?.footer ?? true,
            ads: matchedTool?.layout?.ads ?? (config?.ads?.enabled ?? true)
        };

        if (metaHeader !== null && metaHeader !== undefined) layout.header = metaHeader === 'true';
        if (metaSidebar !== null && metaSidebar !== undefined) layout.sidebar = metaSidebar === 'true';
        if (metaFooter !== null && metaFooter !== undefined) layout.footer = metaFooter === 'true';
        if (metaAds !== null && metaAds !== undefined) layout.ads = metaAds === 'true';

        return { tool: matchedTool, layout };
    }

    /**
     * Renders Header component
     */
    function renderHeader(config) {
        let headerEl = document.querySelector('header.site-header');
        if (!headerEl) {
            headerEl = document.createElement('header');
            headerEl.className = 'site-header';
            document.body.prepend(headerEl);
        }

        const navLinksHtml = config.navigation.map(item => {
            const relUrl = toRelativeUrl(item.path);
            const currentPath = window.location.pathname.toLowerCase();
            const targetPath = item.path.toLowerCase().replace(/^\//, '');

            const cleanCurrent = currentPath.replace(/\/index\.html$/, '/').replace(/\/$/, '');
            const isRootTarget = targetPath === 'index.html' || targetPath === '';
            const isRootCurrent = cleanCurrent === '' || cleanCurrent === '/';

            let isActive = false;
            if (isRootTarget && isRootCurrent) {
                isActive = true;
            } else if (!isRootTarget && currentPath.endsWith(targetPath)) {
                isActive = true;
            }

            return `<li><a href="${relUrl}" class="${isActive ? 'active' : ''}"><i class="${item.icon}"></i> ${item.label}</a></li>`;
        }).join('');

        const homeUrl = toRelativeUrl(config.navigation[0]?.path || 'index.html');
        const defaultAvatarUrl = toRelativeUrl(config.site.ogImage || 'android-chrome-256x256.png');

        headerEl.innerHTML = `
            <nav class="nav-content">
                <div class="nav-brand">
                    <a href="${homeUrl}">
                        <span id="header-avatar" class="nav-logo"><img src="${defaultAvatarUrl}" alt="${config.site.name}"></span>
                        <span class="user-name-js">${config.site.name}</span>
                    </a>
                </div>
                <button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation menu">
                    <i class="im im-menu"></i>
                </button>
                <ul class="nav-links" id="navLinks">
                    ${navLinksHtml}
                </ul>
            </nav>
        `;

        // Bind Mobile Menu Toggle
        const menuBtn = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');
        if (menuBtn && navLinks) {
            menuBtn.onclick = function () {
                navLinks.classList.toggle('active');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    if (navLinks.classList.contains('active')) {
                        icon.className = 'im im-x-mark';
                    } else {
                        icon.className = 'im im-menu';
                    }
                }
            };
        }
    }

    /**
     * Renders Sidebar component
     */
    function renderSidebar(config) {
        let sidebarEl = document.querySelector('aside.sidebar');
        if (!sidebarEl) {
            const container = document.querySelector('main.container');
            if (container) {
                sidebarEl = document.createElement('aside');
                sidebarEl.className = 'sidebar profile-sidebar';
                container.prepend(sidebarEl);
            }
        }

        if (sidebarEl) {
            if (!sidebarEl.innerHTML.trim()) {
                const defaultAvatarUrl = toRelativeUrl(config.site.ogImage || 'assets/android-chrome-256x256.png');
                sidebarEl.innerHTML = `
                    <div id="profile-avatar" class="profile-avatar"><img src="${defaultAvatarUrl}" alt="${config.site.name}"></div>
                    <h1 id="profile-name" class="profile-name user-name-js">${config.site.name}</h1>
                    <span id="profile-handle" class="profile-handle">Software Developer</span>
                    <p id="profile-bio" class="profile-bio">${config.site.description}</p>
                    <ul id="profile-metadata" class="profile-metadata"></ul>
                `;
            }
        }
    }

    /**
     * Executes any dynamic script tags present inside an ad template
     */
    function executeAdScripts(container) {
        if (!container) return;
        container.querySelectorAll('#site-ad-container script').forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    /**
     * Renders Footer component with central ad template
     */
    function renderFooter(config, adsHtml) {
        let footerEl = document.querySelector('footer.site-footer');
        if (!footerEl) {
            footerEl = document.createElement('footer');
            footerEl.className = 'site-footer';
            document.body.appendChild(footerEl);
        }

        const currentYear = new Date().getFullYear();
        const existingP = footerEl.querySelector('p');
        const copyrightHtml = existingP ? existingP.outerHTML : `<p>&copy; ${currentYear} <span class="user-name-js">${config.site.name}</span>. Built with code and conviction.</p>`;

        const adMarkup = (adsHtml && adsHtml.trim())
            ? `<div id="site-ad-container" class="site-ad-container">${adsHtml}</div>`
            : '';

        footerEl.innerHTML = `
            ${adMarkup}
            <div class="container" style="display: block;">
                ${copyrightHtml}
            </div>
        `;

        executeAdScripts(footerEl);
    }

    /**
     * Renders standalone Ad unit if footer is disabled
     */
    function renderStandaloneAds(adsHtml) {
        if (!adsHtml || !adsHtml.trim()) return;
        let adEl = document.getElementById('site-ad-container');
        if (!adEl) {
            adEl = document.createElement('div');
            adEl.id = 'site-ad-container';
            adEl.className = 'site-ad-container';
            const mainEl = document.querySelector('main.container') || document.querySelector('main');
            if (mainEl && mainEl.parentNode) {
                mainEl.parentNode.insertBefore(adEl, mainEl.nextSibling);
            } else {
                document.body.appendChild(adEl);
            }
        }
        adEl.innerHTML = adsHtml;
        executeAdScripts(adEl);
    }

    /**
     * Applies Authoritative Layout rules for Header, Sidebar, Footer independent booleans
     */
    function applyLayout(config, adsHtml) {
        const { layout } = resolvePageLayout(config);

        // Header
        const headerEl = document.querySelector('header.site-header');
        if (layout.header) {
            renderHeader(config);
            document.body.classList.remove('no-header');
        } else {
            if (headerEl) headerEl.style.display = 'none';
            document.body.classList.add('no-header');
        }

        // Sidebar
        const sidebarEl = document.querySelector('aside.sidebar');
        const container = document.querySelector('main.container');
        if (layout.sidebar) {
            renderSidebar(config);
            if (container) container.classList.remove('no-sidebar');
            document.body.classList.remove('no-sidebar');
        } else {
            if (sidebarEl) sidebarEl.style.display = 'none';
            if (container) container.classList.add('no-sidebar');
            document.body.classList.add('no-sidebar');
        }

        // Footer & Ads
        const footerEl = document.querySelector('footer.site-footer');
        if (layout.footer) {
            renderFooter(config, layout.ads ? adsHtml : null);
            document.body.classList.remove('no-footer');
        } else {
            if (footerEl) footerEl.style.display = 'none';
            document.body.classList.add('no-footer');
            if (layout.ads) {
                renderStandaloneAds(adsHtml);
            }
        }
    }

    /**
     * Populates brand identity across DOM
     */
    function populateIdentity(config) {
        document.querySelectorAll('.user-name-js').forEach(el => {
            if (!el.children.length) el.textContent = config.site.name;
        });

        const faviconEl = document.getElementById('favicon-js');
        if (faviconEl) {
            faviconEl.setAttribute('href', toRelativeUrl(config.site.favicon || 'favicon.ico'));
        }

        const metaDesc = document.getElementById('meta-description-js');
        if (metaDesc && !metaDesc.content) {
            metaDesc.content = config.site.description;
        }
    }

    /**
     * Core Framework Initialization
     */
    async function initFramework() {
        ensureMainCssLoaded();
        const config = await getPortfolioConfig();
        const adsHtml = await getAdsSnippet(config);
        applyLayout(config, adsHtml);
        populateIdentity(config);
        return config;
    }

    // Export public API
    window.PortfolioFramework = {
        getRootPrefix,
        toRelativeUrl,
        getConfig: getPortfolioConfig,
        init: initFramework,
        getAdsSnippet,
        renderFooter,
        renderStandaloneAds,
        resolvePageLayout
    };

    // Backward compatibility for existing scripts
    window.getPortfolioConfig = getPortfolioConfig;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFramework);
    } else {
        initFramework();
    }

})();
