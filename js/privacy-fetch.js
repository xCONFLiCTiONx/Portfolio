/**
 * Dynamic Privacy Policy Fetcher
 * Version: 30 (Low-Request Policy Discovery)
 */

async function initPrivacy() {
    const SELECTOR_ID = '#policy-select';
    const CONTENT_ID = '#policy-body';
    const selector = $(SELECTOR_ID);
    const content = $(CONTENT_ID);
    const copyBtn = $('#copyLinkBtn');
    const CATALOG_CACHE_MS = 24 * 60 * 60 * 1000;

    if (!selector.length) return;

    try {
        const config = window.PortfolioFramework ? await window.PortfolioFramework.getConfig() : (window.getPortfolioConfig ? await window.getPortfolioConfig() : {});
        const username = (config.github && config.github.username) || config.github_username || 'xCONFLiCTiONx';
        const token = config.github ? config.github.token : config.github_token;

        const urlParams = new URLSearchParams(window.location.search);
        const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();

        const thisProjectPolicy = {
            name: 'Portfolio',
            url: (window.PortfolioFramework && window.PortfolioFramework.toRelativeUrl) ? window.PortfolioFramework.toRelativeUrl('PRIVACY.md') : '../PRIVACY.md',
            slug: 'portfolio'
        };

        async function loadPolicy(downloadUrl, selectedSlug, updateHistory = true) {
            if (!downloadUrl) return;
            if (updateHistory && selectedSlug) {
                window.history.pushState({ path: selectedSlug }, '', '?p=' + selectedSlug);
            }
            try {
                const response = await fetch(downloadUrl);
                if (response.ok) {
                    const text = await response.text();
                    if (typeof marked !== 'undefined') {
                        content.html(marked.parse(text));
                    } else {
                        content.html('<pre style="white-space: pre-wrap;">' + text + '</pre>');
                    }
                } else {
                    content.html(`<p class="error">Error: Could not load text (HTTP ${response.status}).</p>`);
                }
            } catch (e) {
                content.html('<p class="error">Network error while fetching policy.</p>');
            }
        }

        // Setup Change Listener
        selector.off('change').on('change', function () {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (downloadUrl) {
                content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy content...</div>');
                loadPolicy(downloadUrl, selectedSlug, true);
                $('html, body').animate({ scrollTop: content.offset().top - 100 }, 400);
            }
        });

        // Immediately load this project's privacy policy by default if no query param or 'portfolio'
        if (!targetPolicy || targetPolicy === 'portfolio') {
            selector.html(`<option value="${thisProjectPolicy.url}" data-slug="portfolio" selected>Portfolio</option>`);
            loadPolicy(thisProjectPolicy.url, thisProjectPolicy.slug, false);
        } else {
            selector.html(`<option value="" disabled selected>Searching for ${targetPolicy} policy...</option>`);
        }

        // Reuse the repository catalog briefly to avoid repeated GitHub API calls.
        const cacheKey = `privacy-policy-catalog:${username.toLowerCase()}`;
        let cachedCatalog = null;
        let staleCatalog = null;
        try {
            const stored = JSON.parse(localStorage.getItem(cacheKey) || 'null');
            if (stored && Array.isArray(stored.policies)) {
                staleCatalog = stored.policies;
                if (Date.now() - stored.savedAt < CATALOG_CACHE_MS) {
                    cachedCatalog = stored.policies;
                }
            }
        } catch (error) {
            console.warn('Privacy: Could not read cached policy catalog.', error);
        }

        // DISCOVERY: Fetch repository names once, then probe raw files.
        const fetchOptions = {
            headers: typeof getGithubHeaders === 'function' ? getGithubHeaders(token) : {},
            cache: 'default'
        };

        let foundPolicies = cachedCatalog;
        let failedRepoChecks = 0;
        let usingCachedCatalog = cachedCatalog !== null;
        if (foundPolicies === null) {
            const repos = [];
            let nextPageUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&page=1`;
            let reposResponse;
            while (nextPageUrl) {
                reposResponse = await fetch(nextPageUrl, fetchOptions);
                if (!reposResponse.ok) {
                    if (staleCatalog !== null) {
                        foundPolicies = staleCatalog;
                        usingCachedCatalog = true;
                        break;
                    }
                    const rateLimitRemaining = reposResponse.headers.get('X-RateLimit-Remaining');
                    const detail = reposResponse.status === 403 && rateLimitRemaining === '0'
                        ? 'GitHub API rate limit reached. Please try again after it resets.'
                        : `GitHub Error (${reposResponse.status})`;
                    if (!targetPolicy || targetPolicy === 'portfolio') {
                        selector.append(`<option value="" disabled>${detail}</option>`);
                    } else {
                        selector.html(`<option value="" disabled selected>${detail}</option>`);
                    }
                    return;
                }
                const pageRepos = await reposResponse.json();
                if (!Array.isArray(pageRepos)) {
                    throw new Error('GitHub returned an invalid repository list.');
                }
                repos.push(...pageRepos);
                const linkHeader = reposResponse.headers.get('Link') || '';
                const nextLink = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                nextPageUrl = nextLink ? nextLink[1] : '';
            }

            if (foundPolicies === null) {
                foundPolicies = [];
                let nextRepo = 0;
                const workers = Array.from({ length: Math.min(3, repos.length) }, async () => {
                    while (nextRepo < repos.length) {
                        const repo = repos[nextRepo++];
                        const owner = repo.owner && repo.owner.login ? repo.owner.login : username;
                        const branch = (repo.default_branch || 'main')
                            .split('/')
                            .map(encodeURIComponent)
                            .join('/');
                        const privacyNames = ['privacy.md', 'PRIVACY.md', 'Privacy.md', 'Privacy.MD', 'PRIVACY.MD'];
                        try {
                            for (const privacyName of privacyNames) {
                                const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}/${branch}/${privacyName}`;
                                const response = await fetch(rawUrl, { method: 'HEAD', cache: 'default' });
                                if (response.ok) {
                                    foundPolicies.push({
                                        name: repo.name,
                                        url: rawUrl,
                                        slug: repo.name.toLowerCase()
                                    });
                                    break;
                                }
                                if (response.status !== 404) {
                                    failedRepoChecks += 1;
                                    break;
                                }
                            }
                        } catch (error) {
                            failedRepoChecks += 1;
                        }
                    }
                });
                await Promise.all(workers);
                foundPolicies.sort((a, b) => a.name.localeCompare(b.name));
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        savedAt: Date.now(),
                        policies: foundPolicies
                    }));
                } catch (error) {
                    console.warn('Privacy: Could not cache policy catalog.', error);
                }
            }
        }

        // Ensure this project's policy is always present at the top of policy list
        const policyList = foundPolicies ? [...foundPolicies] : [];
        const existingPortfolioIndex = policyList.findIndex(p => p.slug === 'portfolio');
        if (existingPortfolioIndex >= 0) {
            policyList.splice(existingPortfolioIndex, 1);
        }
        policyList.unshift(thisProjectPolicy);

        const activeSlug = targetPolicy || 'portfolio';
        selector.empty();
        policyList.forEach(policy => {
            const isSelected = activeSlug === policy.slug;
            const option = $('<option>', {
                value: policy.url,
                text: policy.name,
                selected: isSelected
            }).attr('data-slug', policy.slug);
            selector.append(option);
        });

        // If target policy was specified and not 'portfolio', load it now
        if (targetPolicy && targetPolicy !== 'portfolio') {
            const matchedPolicy = policyList.find(p => p.slug === targetPolicy);
            if (matchedPolicy) {
                loadPolicy(matchedPolicy.url, matchedPolicy.slug, false);
            } else {
                content.html(`<p class="error">Privacy policy for "${targetPolicy}" was not found.</p>`);
            }
        }
    } catch (e) {
        console.error('[DEBUG] Privacy: Initialization error', e);
        selector.html('<option value="" disabled selected>Could not load privacy policies. Check the console for details.</option>');
    }

    // Handle copy link button
    copyBtn.off('click').on('click', async function () {
        try {
            await navigator.clipboard.writeText(window.location.href);
            const originalHtml = $(this).html();
            $(this).addClass('copied').html('<i class="im im-check-mark"></i> Copied!');
            setTimeout(() => { $(this).removeClass('copied').html(originalHtml); }, 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    });
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initPrivacy);
} else {
    initPrivacy();
}
