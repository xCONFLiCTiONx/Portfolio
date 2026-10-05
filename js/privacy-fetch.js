/**
 * Dynamic Privacy Policy Fetcher
 * Version: 27 (Repository Policy Discovery)
 */

async function initPrivacy() {
    const SELECTOR_ID = '#policy-select';
    const CONTENT_ID = '#policy-body';
    const selector = $(SELECTOR_ID);
    const content = $(CONTENT_ID);
    const copyBtn = $('#copyLinkBtn');

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

        // 2. DISCOVERY: Fetch all repositories for the user
        const fetchOptions = {
            headers: typeof getGithubHeaders === 'function' ? getGithubHeaders(token) : {},
            cache: 'no-cache'
        };

        const reposURL = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&page=1`;
        const repos = [];
        let nextPageUrl = reposURL;
        let reposResponse;
        while (nextPageUrl) {
            reposResponse = await fetch(nextPageUrl, fetchOptions);
            if (!reposResponse.ok) {
                selector.html(`<option value="" disabled selected>GitHub Error (${reposResponse.status})</option>`);
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

        // Inspect the complete Git tree without probing missing raw files.
        const foundPolicies = [];
        let nextRepo = 0;
        let failedRepoChecks = 0;
        const workers = Array.from({ length: Math.min(5, repos.length) }, async () => {
            while (nextRepo < repos.length) {
                const repo = repos[nextRepo++];
                const branch = repo.default_branch || 'main';
                const treeUrl = `https://api.github.com/repos/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(repo.name)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
                try {
                    const treeResponse = await fetch(treeUrl, fetchOptions);
                    if (!treeResponse.ok) {
                        failedRepoChecks += 1;
                        continue;
                    }
                    const treeData = await treeResponse.json();
                    if (treeData && treeData.truncated) {
                        failedRepoChecks += 1;
                        continue;
                    }
                    const privacyFile = treeData && Array.isArray(treeData.tree)
                        ? treeData.tree.find(item => item.path && item.path.toLowerCase() === 'privacy.md')
                        : null;
                    if (privacyFile) {
                        foundPolicies.push({
                            name: repo.name,
                            url: `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${branch}/${privacyFile.path}`,
                            slug: repo.name.toLowerCase()
                        });
                    }
                } catch (error) {
                    failedRepoChecks += 1;
                }
            }
        });
        await Promise.all(workers);
        foundPolicies.sort((a, b) => a.name.localeCompare(b.name));

        if (foundPolicies.length === 0) {
            const message = failedRepoChecks
                ? `Could not inspect ${failedRepoChecks} repositories. Check GitHub API rate limits or network access.`
                : 'No root privacy.md found in any repository.';
            selector.html(`<option value="" disabled selected>${message}</option>`);
            return;
        }

        const selectorLabel = failedRepoChecks
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