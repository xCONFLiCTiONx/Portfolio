/**
 * Dynamic Privacy Policy Fetcher
 * Version: 24 (Folder-Based Discovery)
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
        const repo = config.privacy_policy_repo || 'Privacy-Policies';
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

        // 2. RECURSIVE DISCOVERY: Fetch file tree from GitHub
        // Using the git/trees API with recursive=1 to find privacy.md in folders
        const apiURL = `https://api.github.com/repos/${username}/${repo}/git/trees/main?recursive=1`;
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (token) headers['Authorization'] = `token ${token}`;

        console.log('[DEBUG] Privacy: Fetching recursive tree...');
        const response = await fetch(apiURL, { headers, cache: 'no-cache' });

        if (response.ok) {
            const data = await response.json();

            // Filter for privacy.md files within folders
            const policyEntries = data.tree.filter(item =>
                item.type === 'blob' &&
                item.path.toLowerCase().endsWith('/privacy.md')
            );

            if (policyEntries.length === 0) {
                selector.html('<option value="" disabled selected>No policies found in repository.</option>');
                return;
            }

            let options = '<option value="" disabled selected>-- Select a Project Policy --</option>';
            policyEntries.forEach(item => {
                // Extract project name from folder path (e.g., "Call Guard Shield/privacy.md" -> "Call Guard Shield")
                const pathParts = item.path.split('/');
                const projectName = pathParts[pathParts.length - 2];
                const slug = projectName.toLowerCase().replace(/\s+/g, '-');

                // Construct the raw URL
                const url = `https://raw.githubusercontent.com/${username}/${repo}/refs/heads/main/${encodeURIComponent(item.path)}`;
                const isSelected = targetPolicy === slug || targetPolicy === projectName.toLowerCase();

                options += `<option value="${url}" data-slug="${slug}" ${isSelected ? 'selected' : ''}>${projectName}</option>`;
            });
            selector.html(options);

            if (selector.val()) {
                selector.trigger('change');
            }

        } else {
            selector.html(`<option value="" disabled selected>GitHub Error (${response.status})</option>`);
            if (response.status === 403) {
                content.html('<p class="error">GitHub API Rate Limit reached. Please add a token to site.webmanifest.</p>');
            }
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
