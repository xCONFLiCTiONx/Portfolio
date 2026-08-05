/**
 * Dynamic Privacy Policy Fetcher
 * Strictly fetches list and content from GitHub API.
 * Version: 16
 */

(function($) {
    "use strict";

    const SELECTOR_ID = '#policySelector';
    const CONTENT_ID = '#policy-content';

    async function initPrivacy() {
        const config = await getPortfolioConfig();
        const username = config.github_username || 'xCONFLiCTiONx';
        const repo = config.privacy_policy_repo || 'Privacy-Policies';
        const token = config.github_token;

        const selector = $(SELECTOR_ID);
        const content = $(CONTENT_ID);
        const copyBtn = $('#copyPolicyLink');

        if (!selector.length) return;

        // Simple options for unauthenticated fetch to avoid CORS blocks
        const fetchOptions = token ? { headers: { 'Authorization': `token ${token}` } } : {};

        // 1. Setup Change Listener
        selector.off('change').on('change', async function() {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (!downloadUrl) return;

            window.history.pushState({ path: selectedSlug }, '', '?p=' + selectedSlug);
            content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy content...</div>');

            try {
                // Fetch content - Never use auth header for raw content servers
                const response = await fetch(downloadUrl);
                if (response.ok) {
                    const text = await response.text();
                    if (typeof marked !== 'undefined') {
                        content.html(marked.parse(text));
                    } else {
                        content.html('<pre style="white-space: pre-wrap;">' + text + '</pre>');
                    }
                    $('html, body').animate({ scrollTop: content.offset().top - 100 }, 400);
                } else {
                    content.html(`<p class="error">Error: Could not load the policy file (HTTP ${response.status}).</p>`);
                }
            } catch (e) {
                content.html('<p class="error">Network error while fetching policy content.</p>');
            }
        });

        // 2. Fetch file list from GitHub
        try {
            const apiURL = `https://api.github.com/repos/${username}/${repo}/contents`;
            const response = await fetch(apiURL, fetchOptions);

            if (response.ok) {
                const files = await response.json();
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
                    const url = `https://raw.githubusercontent.com/${username}/${repo}/refs/heads/main/${file.name}`;

                    const urlParams = new URLSearchParams(window.location.search);
                    const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();
                    const isSelected = targetPolicy === slug;

                    options += `<option value="${url}" data-slug="${slug}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                });
                selector.html(options);

                if (selector.val()) {
                    selector.trigger('change');
                }

            } else {
                selector.html(`<option value="" disabled selected>GitHub Error (${response.status})</option>`);
                if (response.status === 403) {
                    content.html('<p class="error">GitHub API Limit Reached. (403 Forbidden)</p>');
                }
            }
        } catch (e) {
            selector.html('<option value="" disabled selected>CORS or Network Error</option>');
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
