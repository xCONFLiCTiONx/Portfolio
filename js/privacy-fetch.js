/**
 * Dynamic Privacy Policy Fetcher
 * Version: 29 (Rate-Limit Resistant Policy Discovery)
 */

async function initPrivacy() {
    const SELECTOR_ID = '#policy-select';
    const CONTENT_ID = '#policy-body';
    const selector = $(SELECTOR_ID);
    const content = $(CONTENT_ID);
    const copyBtn = $('#copyLinkBtn');
    const CATALOG_CACHE_MS = 6 * 60 * 60 * 1000;

    if (!selector.length) return;

    try {
        const config = window.PortfolioFramework ? await window.PortfolioFramework.getConfig() : (window.getPortfolioConfig ? await window.getPortfolioConfig() : {});
        const username = (config.github && config.github.username) || config.github_username || 'xCONFLiCTiONx';
        const token = config.github ? config.github.token : config.github_token;

        const urlParams = new URLSearchParams(window.location.search);
        const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();

        // 1. Setup Change Listener
        selector.off('change').on('change', async function () {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (!downloadUrl) return;

            window.history.pushState({ path: selectedSlug }, '', '?p=' + selectedSlug);
            content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy content...</div>');

            try {
                const response = await fetch(downloadUrl, { cache: 'no-cache' });
                if (response.ok) {
                    const text = await response.text();
                    if (typeof marked !== 'undefined') {
                        content.html(marked.parse(text));
                    } else {
                        content.html('<pre style="white-space: pre-wrap;">' + text + '</pre>');
                    }
                    $('html, body').animate({ scrollTop: content.offset().top - 100 }, 400);
                } else {
                    content.html(`<p class="error">Error: Could not load text (HTTP ${response.status}).</p>`);
                }
            } catch (e) {
                content.html('<p class="error">Network error while fetching policy.</p>');
            }
        });

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

        // 2. DISCOVERY: Fetch repository names once, then probe raw files.
        const fetchOptions = {
            headers: typeof getGithubHeaders === 'function' ? getGithubHeaders(token) : {},
            cache: 'no-cache'
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
                    selector.html(`<option value="" disabled selected>${detail}</option>`);
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
                const workers = Array.from({ length: Math.min(8, repos.length) }, async () => {
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
                                const response = await fetch(rawUrl, { method: 'HEAD', cache: 'no-cache' });
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

        if (foundPolicies.length === 0) {
            const message = failedRepoChecks
                ? `Could not check ${failedRepoChecks} repositories. Some results may be missing.`
                : 'No root privacy.md found in any repository.';
            selector.html(`<option value="" disabled selected>${message}</option>`);
            return;
        }

        const selectorLabel = usingCachedCatalog
            ? '-- Showing cached policy list --'
            : failedRepoChecks
                ? `-- ${foundPolicies.length} policies found; ${failedRepoChecks} repositories could not be checked --`
                : '-- Select a Project Policy --';
        selector.empty().append($('<option>', {
            value: '',
            text: selectorLabel,
            disabled: true,
            selected: true
        }));
        foundPolicies.forEach(policy => {
            const isSelected = targetPolicy === policy.slug;
            const option = $('<option>', {
                value: policy.url,
                text: policy.name,
                selected: isSelected
            }).attr('data-slug', policy.slug);
            selector.append(option);
        });

        if (selector.val()) {
            selector.trigger('change');
        }
    } catch (e) {
        console.error('[DEBUG] Privacy: Initialization error', e);
        selector.html('<option value="" disabled selected>Could not load privacy policies. Check the console for details.</option>');
    }

    // 3. Handle copy link button
    copyBtn.off('click').on('click', async function () {
        try {
            await navigator.clipboard.writeText(window.location.href);
            const originalHtml = $(this).html(); $(this).addClass('copied').html('<i class="im im-check-mark"></i> Copied!');
            setTimeout(() => { $(this).removeClass('copied').html(originalHtml); }, 2000);
        } catch (err) { console.error('Copy failed', err); }
    });
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initPrivacy);
} else {
    initPrivacy();
}