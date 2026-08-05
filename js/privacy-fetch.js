/**
 * Dynamic Privacy Policy Fetcher
 * Strictly fetches list and content from GitHub API.
 * Version: 14
 */

(function($) {
    "use strict";

    const SELECTOR_ID = '#policySelector';
    const CONTENT_ID = '#policy-content';

    async function initPrivacy() {
        console.log('Privacy: Initializing...');
        const config = await getPortfolioConfig();
        const username = config.github_username || 'xCONFLiCTiONx';
        const repo = config.privacy_policy_repo || 'Privacy-Policies';
        const token = config.github_token;

        const urlParams = new URLSearchParams(window.location.search);
        const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();

        const selector = $(SELECTOR_ID);
        const content = $(CONTENT_ID);
        const copyBtn = $('#copyPolicyLink');

        if (!selector.length) return;

        /**
         * Helper to get headers based on target URL
         */
        function getHeaders(url) {
            const headers = { 'Accept': 'application/vnd.github.v3+json' };
            // Only send token to API endpoint, never to raw content servers
            if (token && url.includes('api.github.com')) {
                headers['Authorization'] = `token ${token}`;
            }
            return headers;
        }

        // 1. Setup Change Listener
        selector.off('change').on('change', async function() {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (!downloadUrl) return;

            window.history.pushState({ path: selectedSlug }, '', '?p=' + selectedSlug);
            content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy content...</div>');

            try {
                console.log('Privacy: Fetching policy content from:', downloadUrl);
                const response = await fetch(downloadUrl, {
                    headers: getHeaders(downloadUrl),
                    cache: 'no-store'
                });

                if (response.ok) {
                    const text = await response.text();
                    console.log('Privacy: Content received.');
                    if (typeof marked !== 'undefined') {
                        content.html(marked.parse(text));
                    } else {
                        content.html('<pre style="white-space: pre-wrap;">' + text + '</pre>');
                    }
                    $('html, body').animate({ scrollTop: content.offset().top - 100 }, 400);
                } else {
                    console.error('Privacy: Failed to load policy content:', response.status);
                    content.html(`<p class="error">Error: Could not load the policy file (HTTP ${response.status}).</p>`);
                }
            } catch (e) {
                console.error('Privacy: Network error while fetching policy:', e);
                content.html('<p class="error">Network error while fetching policy.</p>');
            }
        });

        // 2. Fetch file list from GitHub
        try {
            const apiURL = `https://api.github.com/repos/${username}/${repo}/contents?t=${new Date().getTime()}`;
            console.log('Privacy: Requesting file list from GitHub:', apiURL);
            const response = await fetch(apiURL, {
                headers: getHeaders(apiURL),
                cache: 'no-store'
            });

            if (response.ok) {
                const files = await response.json();
                console.log('Privacy: Files found:', files.length);
                const mdFiles = files.filter(file =>
                    file.name.endsWith('.md') &&
                    file.name.toLowerCase() !== 'readme.md'
                );

                if (mdFiles.length === 0) {
                    selector.html('<option value="" disabled selected>No Markdown policies found.</option>');
                    return;
                }

                let options = '<option value="" disabled selected>-- Select a Project Policy --</option>';
                mdFiles.forEach(file => {
                    const slug = file.name.replace('.md', '').toLowerCase();
                    const displayName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    const url = file.download_url || `https://raw.githubusercontent.com/${username}/${repo}/main/${file.name}`;
                    const isSelected = targetPolicy && (slug === targetPolicy);

                    options += `<option value="${url}" data-slug="${slug}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                });
                selector.html(options);

                if (targetPolicy && selector.val()) {
                    console.log('Privacy: Triggering auto-load for:', targetPolicy);
                    selector.trigger('change');
                }

            } else {
                console.error('Privacy: GitHub API responded with error:', response.status);
                selector.html(`<option value="" disabled selected>GitHub API Error (${response.status})</option>`);
                if (response.status === 403) {
                    content.html('<p class="error">GitHub API Rate Limit reached. Please ensure your token in site.webmanifest is correct.</p>');
                }
            }
        } catch (e) {
            console.error('Privacy: Failed to connect to GitHub API:', e);
            selector.html('<option value="" disabled selected>Connection error.</option>');
        }

        // 3. Handle copy link button
        copyBtn.off('click').on('click', async function() {
            try {
                await navigator.clipboard.writeText(window.location.href);
                const originalHtml = copyBtn.html();
                copyBtn.addClass('copied').html('<i class="im im-check-mark"></i> Copied!');
                setTimeout(() => { copyBtn.removeClass('copied').html(originalHtml); }, 2000);
            } catch (err) { console.error('Copy failed', err); }
        });
    }

    $(document).ready(initPrivacy);

})(jQuery);
