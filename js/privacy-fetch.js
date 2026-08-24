/**
 * Dynamic Privacy Policy Fetcher
 * Version: 25 (Per-Repo Discovery)
 */

console.log('[DEBUG] PRIVACY-FETCH: Script File Loaded');

async function initPrivacy() {
    console.log('[DEBUG] Privacy: Initializing...');

    const SELECTOR_ID = '#policySelector';
    const CONTENT_ID = '#policy-content';
    const selector = $(SELECTOR_ID);
    const content = $(CONTENT_ID);
    const copyBtn = $('#copyPolicyLink');

    if (!selector.length) return;

    try {
        const config = await getPortfolioConfig();
        const username = config.github_username || 'xCONFLiCTiONx';
        const token = config.github_token;

        const urlParams = new URLSearchParams(window.location.search);
        const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();

        // 1. Setup Change Listener
        selector.off('change').on('change', async function() {
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

        console.log('[DEBUG] Privacy: Fetching user repositories...');
        const reposURL = `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`;
        const reposResponse = await fetch(reposURL, fetchOptions);

        if (reposResponse.ok) {
            const repos = await reposResponse.json();

            // Filter out forks if desired, or keep them. Let's keep them for now.
            // We need to check which repos have a privacy.md
            // To avoid hitting rate limits with dozens of API calls, we'll try to check the raw content URL with a HEAD request

            const policyCheckPromises = repos.map(async (repo) => {
                const branch = repo.default_branch || 'main';
                const rawUrl = `https://raw.githubusercontent.com/${username}/${repo.name}/${branch}/privacy.md`;

                try {
                    const check = await fetch(rawUrl, { method: 'HEAD', cache: 'no-cache' });
                    if (check.ok) {
                        return {
                            name: repo.name,
                            url: rawUrl,
                            slug: repo.name.toLowerCase()
                        };
                    }
                } catch (e) {
                    // Fail silently for individual repo checks
                }
                return null;
            });

            const foundPolicies = (await Promise.all(policyCheckPromises)).filter(p => p !== null);

            if (foundPolicies.length === 0) {
                selector.html('<option value="" disabled selected>No privacy.md found in any repository.</option>');
                return;
            }

            let options = '<option value="" disabled selected>-- Select a Project Policy --</option>';
            foundPolicies.forEach(policy => {
                const isSelected = targetPolicy === policy.slug;
                options += `<option value="${policy.url}" data-slug="${policy.slug}" ${isSelected ? 'selected' : ''}>${policy.name}</option>`;
            });
            selector.html(options);

            if (selector.val()) {
                selector.trigger('change');
            }

        } else {
            selector.html(`<option value="" disabled selected>GitHub Error (${reposResponse.status})</option>`);
        }
    } catch (e) {
        console.error('[DEBUG] Privacy: Initialization error', e);
        selector.html('<option value="" disabled selected>Initialization Error</option>');
    }

    // 3. Handle copy link button
    copyBtn.off('click').on('click', async function() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            const originalHtml = $(this).html();
            $(this).addClass('copied').html('<i class="im im-check-mark"></i> Copied!');
            setTimeout(() => { $(this).removeClass('copied').html(originalHtml); }, 2000);
        } catch (err) { console.error('Copy failed', err); }
    });
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initPrivacy);
} else {
    initPrivacy();
}
