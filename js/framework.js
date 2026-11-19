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

        // Check sessionStorage first for instantaneous transitions between pages
        try {
            const stored = sessionStorage.getItem('portfolio_config');
            if (stored) {
                cachedConfig = JSON.parse(stored);
                window.PortfolioConfig = cachedConfig;
                return cachedConfig;
            }
        } catch (_) {}

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
                    const res = await fetch(url);
                    if (res.ok) {
                        cachedConfig = await res.json();
                        window.PortfolioConfig = cachedConfig;
                        try { sessionStorage.setItem('portfolio_config', JSON.stringify(cachedConfig)); } catch (_) {}
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
                    author: "xCONFLiCTiONx",
                    avatar: "https://avatars.githubusercontent.com/u/12835195?v=4"
                },
                github: {
                    username: "xCONFLiCTiONx",
                    profileUrl: "https://github.com/xCONFLiCTiONx",
                    avatarUrl: "https://avatars.githubusercontent.com/u/12835195?v=4"
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

        try {
            const stored = sessionStorage.getItem('portfolio_ads_html');
            if (stored !== null) {
                cachedAdsHtml = stored;
                return cachedAdsHtml;
            }
        } catch (_) {}

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
                    const res = await fetch(url);
                    if (res.ok) {
                        const html = await res.text();
                        if (html && html.trim()) {
                            cachedAdsHtml = normalizeAdProtocols(html.trim());
                            try { sessionStorage.setItem('portfolio_ads_html', cachedAdsHtml); } catch (_) {}
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
        function earlyLayoutCheck() {
        const metaSidebar = document.querySelector('meta[name="portfolio-layout-sidebar"]')?.getAttribute('content');
        if (metaSidebar === 'false') {
            if (document.body) document.body.classList.add('no-sidebar');
            const sidebarEl = document.querySelector('aside.sidebar');
            if (sidebarEl) sidebarEl.style.display = 'none';
        }
    }

    function resolvePageLayout(config) {
        const bodyToolId = document.body ? document.body.getAttribute('data-tool-id') : null;
        const metaToolId = document.querySelector('meta[name="portfolio-tool-id"]')?.getAttribute('content');
        const toolId = bodyToolId || metaToolId;

        let matchedTool = null;
        if (toolId && config.tools) {
            matchedTool = config.tools.find(t => t.id === toolId);
        }

        if (!matchedTool && config.tools) {
            const currentPath = window.location.pathname.toLowerCase().replace(/\/index\.html$/, '/');
            matchedTool = config.tools.find(t => {
                const toolCleanPath = t.path.toLowerCase().replace(/^\//, '').replace(/\/index\.html$/, '/');
                const pathWithSlash = toolCleanPath.endsWith('/') ? toolCleanPath : toolCleanPath + '/';
                return currentPath.endsWith(pathWithSlash) || (currentPath + '/').endsWith(pathWithSlash);
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
    /**
     * Resolves the user avatar URL prioritizing GitHub user profile avatar
     */
    function getAvatarUrl(config) {
        const username = (config?.github && config.github.username) || config?.github_username || 'xCONFLiCTiONx';

        // 1. Check cached GitHub API user profile if available
        try {
            const cached = JSON.parse(localStorage.getItem(`github-profile:${username.toLowerCase()}`) || 'null');
            if (cached && cached.data && cached.data.avatar_url) {
                return cached.data.avatar_url;
            }
        } catch (_) {}

        // 2. Direct avatar from config if provided
        if (config?.github && config.github.avatarUrl) {
            return config.github.avatarUrl;
        }
        if (config?.site && config.site.avatar) {
            return config.site.avatar;
        }

        // 3. GitHub direct user avatar endpoint
        if (username) {
            return `https://github.com/${username}.png`;
        }

        // 4. Fallback to favicon
        return toRelativeUrl(config?.site?.favicon || 'assets/favicon.ico');
    }

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
        const defaultAvatarUrl = getAvatarUrl(config);
        const fallbackIcon = toRelativeUrl(config?.site?.favicon || 'assets/favicon.ico');

        // Preserve already populated avatar if present
        const existingAvatarImg = headerEl.querySelector('#header-avatar img');
        const currentAvatarSrc = (existingAvatarImg && existingAvatarImg.src && !existingAvatarImg.src.endsWith(fallbackIcon))
            ? existingAvatarImg.src
            : defaultAvatarUrl;

        headerEl.innerHTML = `
            <nav class="nav-content">
                <div class="nav-brand">
                    <a href="${homeUrl}">
                        <span id="header-avatar" class="nav-logo"><img src="${currentAvatarSrc}" alt="${config.site.name}" onerror="if(this.src!=='${fallbackIcon}')this.src='${fallbackIcon}';"></span>
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
                const defaultAvatarUrl = getAvatarUrl(config);
                const fallbackIcon = toRelativeUrl(config?.site?.favicon || 'assets/favicon.ico');
                sidebarEl.innerHTML = `
                    <div id="profile-avatar" class="profile-avatar"><img src="${defaultAvatarUrl}" alt="${config.site.name}" onerror="if(this.src!=='${fallbackIcon}')this.src='${fallbackIcon}';"></div>
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
            const currentHref = faviconEl.getAttribute('href');
            if (!currentHref || (!currentHref.includes('github') && !currentHref.includes('avatars'))) {
                faviconEl.setAttribute('href', toRelativeUrl(config.site.favicon || 'assets/favicon.ico'));
            }
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
        earlyLayoutCheck();
        const config = await getPortfolioConfig();
        // Immediately apply structural layout (header and sidebar) so sidebar does not flash while awaiting ads snippet
        const { layout } = resolvePageLayout(config);
        applyLayout(config, null);
        if (layout.ads) {
            const adsHtml = await getAdsSnippet(config);
            if (adsHtml) {
                if (layout.footer) {
                    renderFooter(config, adsHtml);
                } else {
                    renderStandaloneAds(adsHtml);
                }
            }
        }
        populateIdentity(config);
        return config;
    }

    // Export public API
    window.PortfolioFramework = {
        getRootPrefix,
        toRelativeUrl,
        getAvatarUrl,
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
