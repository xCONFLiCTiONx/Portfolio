/**
 * Dynamic Privacy Policy Fetcher
 * Version: 23 (Robust Discovery & Heartbeat)
 */

console.log('[DEBUG] PRIVACY-FETCH: Script File Loaded');

async function initPrivacy() {
    console.log('[DEBUG] Privacy: Initializing...');

    // Internal constants
    const SELECTOR_ID = '#policySelector';
    const CONTENT_ID = '#policy-content';
    const selector = $(SELECTOR_ID);
    const content = $(CONTENT_ID);
    const copyBtn = $('#copyPolicyLink');

    if (!selector.length) {
        console.error('[DEBUG] Privacy: Selector element not found!');
        return;
    }

    try {
        // 1. Get shared config from github-fetch.js
        const config = await getPortfolioConfig();
        const username = config.github_username || 'xCONFLiCTiONx';
        const repo = config.privacy_policy_repo || 'Privacy-Policies';
        const token = config.github_token;
        console.log('[DEBUG] Privacy: Config loaded:', { username, repo });

        const urlParams = new URLSearchParams(window.location.search);
        const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();

        // 2. Setup Change Listener
        selector.off('change').on('change', async function() {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (!downloadUrl) return;

            window.history.pushState({ path: selectedSlug }, '', '?p=' + selectedSlug);
            content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy content...</div>');

            try {
                console.log('[DEBUG] Privacy: Fetching content from:', downloadUrl);
                const response = await fetch(downloadUrl, { cache: 'no-cache' });
                if (response.ok) {
                    const text = await response.text();
                    console.log('[DEBUG] Privacy: Content received.');
                    if (typeof marked !== 'undefined') {
                        content.html(marked.parse(text));
                    } else {
                        content.html('<pre style="white-space: pre-wrap;">' + text + '</pre>');
                    }
                    $('html, body').animate({ scrollTop: content.offset().top - 100 }, 400);
                } else {
                    console.error('[DEBUG] Privacy: Content fetch failed:', response.status);
                    content.html(`<p class="error">Error: Could not load text (HTTP ${response.status}).</p>`);
                }
            } catch (e) {
                console.error('[DEBUG] Privacy: Content network error:', e);
                content.html('<p class="error">Network error while fetching policy.</p>');
            }
        });

        // 3. Fetch file list from GitHub
        console.log('[DEBUG] Privacy: Requesting file list from API...');
        const apiURL = `https://api.github.com/repos/${username}/${repo}/contents`;
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (token) headers['Authorization'] = `token ${token}`;

        const response = await fetch(apiURL, { headers, cache: 'no-cache' });
        console.log('[DEBUG] Privacy: API Status:', response.status);

        if (response.ok) {
            const files = await response.json();
            console.log('[DEBUG] Privacy: Files received:', files);

            const mdFiles = files.filter(file =>
                file.name.endsWith('.md') &&
                file.name.toLowerCase() !== 'readme.md'
            );

            if (mdFiles.length === 0) {
                console.warn('[DEBUG] Privacy: No .md files found.');
                selector.html('<option value="" disabled selected>No policies found.</option>');
                return;
            }

            let options = '<option value="" disabled selected>-- Select a Project Policy --</option>';
            mdFiles.forEach(file => {
                const slug = file.name.replace('.md', '').toLowerCase();
                const displayName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                // Use the API's download_url for robustness
                const url = file.download_url;
                const isSelected = targetPolicy === slug;

                options += `<option value="${url}" data-slug="${slug}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
            });
            selector.html(options);
            console.log('[DEBUG] Privacy: Dropdown populated.');

            if (selector.val()) {
                console.log('[DEBUG] Privacy: Auto-triggering deep link load.');
                selector.trigger('change');
            }

        } else {
            console.error('[DEBUG] Privacy: List fetch failed:', response.status);
            selector.html(`<option value="" disabled selected>GitHub Error (${response.status})</option>`);
            if (response.status === 403) {
                content.html('<p class="error">GitHub API Access Restricted (403). Please add a token to site.webmanifest.</p>');
            }
        }
    } catch (e) {
        console.error('[DEBUG] Privacy: Silent Crash during init!', e);
        selector.html('<option value="" disabled selected>Initialization Error</option>');
    }

    // 4. Handle copy link button
    copyBtn.off('click').on('click', async function() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            const originalHtml = $(this).html();
            $(this).addClass('copied').html('<i class="im im-check-mark"></i> Copied!');
            setTimeout(() => { $(this).removeClass('copied').html(originalHtml); }, 2000);
        } catch (err) { console.error('Copy failed', err); }
    });
}

// Ensure the script starts immediately regardless of jQuery state
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initPrivacy);
} else {
    initPrivacy();
}
