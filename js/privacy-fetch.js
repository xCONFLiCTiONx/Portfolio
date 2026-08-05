/**
 * Dynamic Privacy Policy Fetcher
 * Strictly fetches list and content from GitHub API.
 * Version: 18
 */

(function($) {
    "use strict";

    const SELECTOR_ID = '#policySelector';
    const CONTENT_ID = '#policy-content';

    async function initPrivacy() {
        console.log('Privacy: Initializing dynamic loader...');
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
         * Use token only if present. Naked fetch is safer for local file security.
         */
        function getFetchOptions(url) {
            const options = { cache: 'no-cache' };
            if (token && url.includes('api.github.com')) {
                options.headers = {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${token}`
                };
            }
            return options;
        }

        // 1. Setup Change Listener
        selector.off('change').on('change', async function() {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (!downloadUrl) return;

            window.history.pushState({ path: selectedSlug }, '', '?p=' + selectedSlug);
            content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy content...</div>');

            try {
                // Fetch content - No auth header for raw content
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
                    console.error('Privacy: Policy text fetch failed:', response.status);
                    content.html(`<p class="error">Error: Could not load the policy text (HTTP ${response.status}).</p>`);
                }
            } catch (e) {
                console.error('Privacy: Network error while fetching policy:', e);
                content.html('<p class="error">Network error. Please check your connection.</p>');
            }
        });

        // 2. Fetch file list from GitHub
        try {
            const apiURL = `https://api.github.com/repos/${username}/${repo}/contents`;
            const response = await fetch(apiURL, getFetchOptions(apiURL));

            if (response.ok) {
                const files = await response.json();
                const mdFiles = files.filter(file =>
                    file.name.endsWith('.md') &&
                    file.name.toLowerCase() !== 'readme.md'
                );

                if (mdFiles.length === 0) {
                    selector.html('<option value="" disabled selected>No policies found.</option>');
                    return;
                }

                let options = '<option value="" disabled selected>-- Select a Project Policy --</option>';
                mdFiles.forEach(file => {
                    const slug = file.name.replace('.md', '').toLowerCase();
                    const displayName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    // Prefer official download_url, fallback to raw link
                    const url = file.download_url || `https://raw.githubusercontent.com/${username}/${repo}/main/${file.name}`;
                    const isSelected = targetPolicy === slug;

                    options += `<option value="${url}" data-slug="${slug}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                });
                selector.html(options);

                // Auto-trigger if deep-linked
                if (selector.val()) {
                    selector.trigger('change');
                }

            } else {
                console.error('Privacy: API List Error:', response.status);
                selector.html(`<option value="" disabled selected>API Error (${response.status})</option>`);
                if (response.status === 403) {
                    content.html('<p class="error">GitHub API Access Restricted (403). <br> This usually happens when browsing local files. Try viewing the site on a web server or add a token to site.webmanifest.</p>');
                }
            }
        } catch (e) {
            console.error('Privacy: API Connection Error:', e);
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
