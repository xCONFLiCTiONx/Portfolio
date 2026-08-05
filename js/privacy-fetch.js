/**
 * Dynamic Privacy Policy Fetcher
 * Strictly fetches list and content from GitHub API.
 * Version: 13
 */

(function($) {
    "use strict";

    const SELECTOR_ID = '#policySelector';
    const CONTENT_ID = '#policy-content';

    async function initPrivacy() {
        const config = await getPortfolioConfig();
        const username = config.github_username || 'xCONFLiCTiONx';
        const repo = config.privacy_policy_repo || 'Privacy-Policies';
        const headers = getGithubHeaders(config);

        const urlParams = new URLSearchParams(window.location.search);
        const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();

        const selector = $(SELECTOR_ID);
        const content = $(CONTENT_ID);
        const copyBtn = $('#copyPolicyLink');

        if (!selector.length) return;

        // 1. Setup Change Listener
        selector.off('change').on('change', async function() {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (!downloadUrl) return;

            window.history.pushState({ path: selectedSlug }, '', '?p=' + selectedSlug);
            content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy content...</div>');

            try {
                const response = await fetch(downloadUrl, { headers, cache: 'no-store' });
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
                content.html('<p class="error">Network error while fetching policy.</p>');
            }
        });

        // 2. Fetch file list from GitHub
        try {
            const apiURL = `https://api.github.com/repos/${username}/${repo}/contents?t=${new Date().getTime()}`;
            const response = await fetch(apiURL, { headers, cache: 'no-store' });

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
                    const url = file.download_url || `https://raw.githubusercontent.com/${username}/${repo}/main/${file.name}`;
                    const isSelected = targetPolicy && (slug === targetPolicy);

                    options += `<option value="${url}" data-slug="${slug}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                });
                selector.html(options);

                if (targetPolicy && selector.val()) {
                    selector.trigger('change');
                }

            } else {
                selector.html(`<option value="" disabled selected>GitHub API Error (${response.status})</option>`);
                if (response.status === 403) {
                    content.html('<p class="error">GitHub API Rate Limit reached. Please use a GitHub Token in site.webmanifest.</p>');
                }
            }
        } catch (e) {
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
