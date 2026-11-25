/**
 * Dynamic Privacy Policy & License Viewer
 * Version: 31 (All Repositories + On-Demand Privacy & License Fetching)
 */

async function initPrivacy() {
    const selector = document.getElementById('policy-select');
    const content = document.getElementById('policy-body');
    const metaBar = document.getElementById('policy-meta-bar');
    const repoCountItem = document.getElementById('policy-repo-count');
    const copyBtn = document.getElementById('copyLinkBtn');
    const tabBtns = Array.from(document.querySelectorAll('.doc-tab-btn'));

    if (!selector || !content) return;

    const REPOS_CACHE_MS = 6 * 60 * 60 * 1000;
    const docCache = new Map();

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    try {
        const config = window.PortfolioFramework
            ? await window.PortfolioFramework.getConfig()
            : (window.getPortfolioConfig ? await window.getPortfolioConfig() : {});
        const username = (config.github && config.github.username) || config.github_username || 'xCONFLiCTiONx';
        const token = config.github ? config.github.token : config.github_token;

        const urlParams = new URLSearchParams(window.location.search);
        const initialSlug = (urlParams.get('p') || urlParams.get('policy') || urlParams.get('repo') || 'portfolio').trim().toLowerCase();
        const initialDocParam = (urlParams.get('doc') || urlParams.get('type') || 'privacy').trim().toLowerCase();
        let activeDocType = initialDocParam === 'license' ? 'license' : 'privacy';

        const localPortfolioEntry = {
            name: 'Portfolio',
            slug: 'portfolio',
            owner: username,
            branch: 'main',
            htmlUrl: `https://github.com/${encodeURIComponent(username)}/Portfolio`,
            licenseSpdx: 'GPL-3.0',
            licenseName: 'GNU General Public License v3.0',
            localPrivacyUrl: (window.PortfolioFramework && window.PortfolioFramework.toRelativeUrl)
                ? window.PortfolioFramework.toRelativeUrl('PRIVACY.md')
                : '../PRIVACY.md',
            localLicenseUrl: (window.PortfolioFramework && window.PortfolioFramework.toRelativeUrl)
                ? window.PortfolioFramework.toRelativeUrl('LICENSE')
                : '../LICENSE'
        };

        let repoEntries = [localPortfolioEntry];
        let activeRepo = localPortfolioEntry;

        function setTabUI(docType) {
            activeDocType = docType === 'license' ? 'license' : 'privacy';
            tabBtns.forEach(btn => {
                const isActive = btn.dataset.doc === activeDocType;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
        }

        function updateUrl(slug, docType, push = true) {
            if (!push) return;
            const params = new URLSearchParams();
            params.set('p', slug);
            if (docType === 'license') params.set('doc', 'license');
            const nextUrl = `?${params.toString()}`;
            window.history.pushState({ slug, docType }, '', nextUrl);
        }

        function renderMetaBar(repo, rawUrl) {
            if (!metaBar) return;
            const licenseLabel = repo.licenseSpdx && repo.licenseSpdx !== 'NOASSERTION'
                ? repo.licenseSpdx
                : (repo.licenseName || 'See LICENSE');
            const rawLinkHtml = rawUrl
                ? `<a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener noreferrer">Raw File ↗</a>`
                : '';
            metaBar.innerHTML = `
                <div class="policy-meta-left">
                    <strong style="color:#f0f6fc;">${escapeHtml(repo.name)}</strong>
                    <span class="policy-badge">${escapeHtml(licenseLabel)}</span>
                </div>
                <div class="policy-meta-links">
                    ${rawLinkHtml}
                    <a href="${escapeHtml(repo.htmlUrl)}" target="_blank" rel="noopener noreferrer">View on GitHub ↗</a>
                </div>
            `;
            metaBar.style.display = 'flex';
        }

        async function fetchFirstExisting(urls) {
            for (const url of urls) {
                try {
                    const res = await fetch(url, { cache: 'default' });
                    if (res.ok) {
                        const text = await res.text();
                        return { url, text };
                    }
                } catch (_) {
                    // Try next candidate
                }
            }
            return null;
        }

        async function loadDocument(repo, docType, pushHistory = true) {
            if (!repo) return;
            activeRepo = repo;
            setTabUI(docType);
            updateUrl(repo.slug, activeDocType, pushHistory);

            const cacheKey = `${repo.slug}:${activeDocType}`;
            if (docCache.has(cacheKey)) {
                const cached = docCache.get(cacheKey);
                renderMetaBar(repo, cached.url);
                content.innerHTML = cached.html;
                return;
            }

            content.innerHTML = `<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading ${activeDocType === 'license' ? 'license' : 'privacy policy'} for ${escapeHtml(repo.name)}...</div>`;
            renderMetaBar(repo, null);

            const owner = encodeURIComponent(repo.owner || username);
            const name = encodeURIComponent(repo.name);
            const branch = (repo.branch || 'main').split('/').map(encodeURIComponent).join('/');
            const rawBase = `https://raw.githubusercontent.com/${owner}/${name}/${branch}`;

            let candidates = [];
            if (activeDocType === 'license') {
                if (repo.localLicenseUrl) candidates.push(repo.localLicenseUrl);
                candidates.push(
                    `${rawBase}/LICENSE`,
                    `${rawBase}/LICENSE.md`,
                    `${rawBase}/LICENSE.txt`,
                    `${rawBase}/license`,
                    `${rawBase}/COPYING`
                );
            } else {
                if (repo.localPrivacyUrl) candidates.push(repo.localPrivacyUrl);
                candidates.push(
                    `${rawBase}/PRIVACY.md`,
                    `${rawBase}/privacy.md`,
                    `${rawBase}/Privacy.md`,
                    `${rawBase}/PRIVACY.MD`,
                    `${rawBase}/docs/PRIVACY.md`
                );
            }

            const result = await fetchFirstExisting(candidates);
            let html = '';

            if (result) {
                const isMarkdown = /\.md$/i.test(result.url);
                if (isMarkdown && typeof marked !== 'undefined') {
                    html = marked.parse(result.text);
                } else {
                    html = `<pre class="license-pre">${escapeHtml(result.text)}</pre>`;
                }
                renderMetaBar(repo, result.url);
            } else if (activeDocType === 'privacy') {
                html = `
                    <div class="policy-notice">
                        <strong style="color:#f0f6fc;">Zero-Telemetry Default Policy — ${escapeHtml(repo.name)}</strong>
                        <p style="margin:0.8rem 0 0;color:#c9d1d9;">
                            This repository does not define a separate custom <code>PRIVACY.md</code>. Like all xCONFLiCTiONx projects, it follows a strict local-first, zero-telemetry standard: no analytics, no tracking beacons, and no selling or sharing of user data.
                        </p>
                    </div>
                    <p>
                        You can inspect the full source code directly on
                        <a href="${escapeHtml(repo.htmlUrl)}" target="_blank" rel="noopener noreferrer">GitHub (${escapeHtml(repo.name)}) ↗</a>
                        or switch to the <strong>License</strong> tab above to view its software license.
                    </p>
                `;
                renderMetaBar(repo, null);
            } else {
                const spdxNote = repo.licenseSpdx && repo.licenseSpdx !== 'NOASSERTION'
                    ? `GitHub reports this repository under <strong>${escapeHtml(repo.licenseSpdx)}</strong>.`
                    : 'No standard root <code>LICENSE</code> file was found on the default branch.';
                html = `
                    <div class="policy-notice">
                        <strong style="color:#f0f6fc;">License Info — ${escapeHtml(repo.name)}</strong>
                        <p style="margin:0.8rem 0 0;color:#c9d1d9;">${spdxNote}</p>
                    </div>
                    <p>
                        View repository details on
                        <a href="${escapeHtml(repo.htmlUrl)}" target="_blank" rel="noopener noreferrer">GitHub (${escapeHtml(repo.name)}) ↗</a>.
                    </p>
                `;
                renderMetaBar(repo, null);
            }

            docCache.set(cacheKey, { url: result ? result.url : null, html });
            content.innerHTML = html;
        }

        async function fetchAllPublicRepos() {
            const sharedCacheKey = `github-repos:${username.toLowerCase()}`;
            if (!token) {
                try {
                    const cached = JSON.parse(localStorage.getItem(sharedCacheKey) || 'null');
                    if (cached && cached.savedAt && Date.now() - cached.savedAt < REPOS_CACHE_MS && Array.isArray(cached.data) && cached.data.length > 0) {
                        return cached.data;
                    }
                } catch (_) {}
            }

            const fetchOptions = {
                headers: typeof getGithubHeaders === 'function' ? getGithubHeaders(token) : { Accept: 'application/vnd.github.v3+json' },
                cache: 'default'
            };

            const allRepos = [];
            let nextPageUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&page=1`;

            while (nextPageUrl) {
                const res = await fetch(nextPageUrl, fetchOptions);
                if (!res.ok) {
                    throw new Error(`GitHub API ${res.status}`);
                }
                const page = await res.json();
                if (!Array.isArray(page)) break;
                allRepos.push(...page);

                const linkHeader = res.headers.get('Link') || '';
                const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                nextPageUrl = nextMatch ? nextMatch[1] : '';
            }

            if (!token && allRepos.length > 0) {
                try {
                    localStorage.setItem(sharedCacheKey, JSON.stringify({ savedAt: Date.now(), data: allRepos }));
                } catch (_) {}
            }
            return allRepos;
        }

        function renderSelectOptions(selectedSlug) {
            selector.innerHTML = '';
            repoEntries.forEach(entry => {
                const opt = document.createElement('option');
                opt.value = entry.slug;
                const licTag = entry.licenseSpdx && entry.licenseSpdx !== 'NOASSERTION' ? ` (${entry.licenseSpdx})` : '';
                opt.textContent = `${entry.name}${licTag}`;
                if (entry.slug === selectedSlug) opt.selected = true;
                selector.appendChild(opt);
            });
            if (repoCountItem) {
                repoCountItem.style.display = '';
                const span = repoCountItem.querySelector('span');
                if (span) span.textContent = `${repoEntries.length} Repositories Listed`;
            }
        }

        // Load Portfolio immediately if it's the target so the page is never blank
        setTabUI(activeDocType);
        if (initialSlug === 'portfolio') {
            renderSelectOptions('portfolio');
            loadDocument(localPortfolioEntry, activeDocType, false);
        }

        // Wire UI controls
        selector.addEventListener('change', () => {
            const match = repoEntries.find(r => r.slug === selector.value);
            if (match) loadDocument(match, activeDocType, true);
        });

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const nextDoc = btn.dataset.doc === 'license' ? 'license' : 'privacy';
                if (nextDoc !== activeDocType) {
                    loadDocument(activeRepo, nextDoc, true);
                }
            });
        });

        window.addEventListener('popstate', () => {
            const params = new URLSearchParams(window.location.search);
            const slug = (params.get('p') || params.get('policy') || params.get('repo') || 'portfolio').trim().toLowerCase();
            const doc = (params.get('doc') || params.get('type') || 'privacy').trim().toLowerCase();
            const match = repoEntries.find(r => r.slug === slug) || localPortfolioEntry;
            selector.value = match.slug;
            loadDocument(match, doc === 'license' ? 'license' : 'privacy', false);
        });

        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    const orig = copyBtn.innerHTML;
                    copyBtn.classList.add('copied');
                    copyBtn.innerHTML = '<i class="im im-check-mark"></i> Copied!';
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.innerHTML = orig;
                    }, 2000);
                } catch (err) {
                    console.error('Copy failed', err);
                }
            });
        }

        // Populate full repository list from GitHub
        try {
            const repos = await fetchAllPublicRepos();
            const mapped = repos.map(r => {
                const slug = r.name.toLowerCase();
                const isPortfolio = slug === 'portfolio';
                return {
                    name: r.name,
                    slug,
                    owner: (r.owner && r.owner.login) || username,
                    branch: r.default_branch || 'main',
                    htmlUrl: r.html_url || `https://github.com/${encodeURIComponent(username)}/${encodeURIComponent(r.name)}`,
                    licenseSpdx: (r.license && r.license.spdx_id) || '',
                    licenseName: (r.license && r.license.name) || '',
                    localPrivacyUrl: isPortfolio ? localPortfolioEntry.localPrivacyUrl : null,
                    localLicenseUrl: isPortfolio ? localPortfolioEntry.localLicenseUrl : null
                };
            });

            mapped.sort((a, b) => a.name.localeCompare(b.name));
            const portfolioIdx = mapped.findIndex(r => r.slug === 'portfolio');
            const pinnedPortfolio = portfolioIdx >= 0 ? mapped.splice(portfolioIdx, 1)[0] : localPortfolioEntry;
            repoEntries = [pinnedPortfolio, ...mapped];

            const matched = repoEntries.find(r => r.slug === initialSlug) || pinnedPortfolio;
            renderSelectOptions(matched.slug);

            if (initialSlug !== 'portfolio' || matched.slug !== 'portfolio') {
                loadDocument(matched, activeDocType, false);
            } else {
                renderMetaBar(matched, activeDocType === 'license' ? matched.localLicenseUrl : matched.localPrivacyUrl);
            }
        } catch (err) {
            console.warn('Privacy/License: Could not load full repo list from GitHub.', err);
            renderSelectOptions('portfolio');
            if (initialSlug !== 'portfolio') {
                loadDocument(localPortfolioEntry, activeDocType, false);
            }
        }
    } catch (e) {
        console.error('Privacy/License initialization error:', e);
        content.innerHTML = '<p class="error">Could not initialize privacy &amp; license viewer.</p>';
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initPrivacy);
} else {
    initPrivacy();
}
