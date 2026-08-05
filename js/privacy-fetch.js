/**
 * Dynamic Privacy Policy Fetcher
 * Version: 22 (DEBUG MODE)
 */

(function($) {
    "use strict";

    const SELECTOR_ID = '#policySelector';
    const CONTENT_ID = '#policy-content';

    async function initPrivacy() {
        console.log('[DEBUG] Privacy: Initializing...');

        const selector = $(SELECTOR_ID);
        const content = $(CONTENT_ID);
        const copyBtn = $('#copyPolicyLink');

        if (!selector.length) {
            console.error('[DEBUG] Privacy: Selector element not found in DOM!');
            return;
        }

        // 1. Get shared config
        const config = await getPortfolioConfig();
        const username = config.github_username || 'xCONFLiCTiONx';
        const repo = config.privacy_policy_repo || 'Privacy-Policies';
        const token = config.github_token;
        console.log('[DEBUG] Privacy: Configuration loaded:', { username, repo, hasToken: !!token });

        const urlParams = new URLSearchParams(window.location.search);
        const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();

        // 2. Setup Change Listener
        selector.off('change').on('change', async function() {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (!downloadUrl) return;

            console.log('[DEBUG] Privacy: Policy selected:', selectedSlug);
            window.history.pushState({ path: selectedSlug }, '', '?p=' + selectedSlug);
            content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy content...</div>');

            try {
                console.log('[DEBUG] Privacy: Fetching content from:', downloadUrl);
                const response = await fetch(downloadUrl, { cache: 'no-cache' });
                if (response.ok) {
                    const text = await response.text();
                    console.log('[DEBUG] Privacy: Content received, length:', text.length);
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
                console.error('[DEBUG] Privacy: Network error during content fetch:', e);
                content.html('<p class="error">Network error while fetching policy content.</p>');
            }
        });

        // 3. Load Policy List from GitHub API
        try {
            const apiURL = `https://api.github.com/repos/${username}/${repo}/contents`;
            console.log('[DEBUG] Privacy: Requesting file list from API:', apiURL);

            const options = token ? { headers: { 'Authorization': `token ${token}` } } : {};
            const response = await fetch(apiURL, options);

            console.log('[DEBUG] Privacy: API Response received. Status:', response.status);

            if (response.ok) {
                const files = await response.json();
                console.log('[DEBUG] Privacy: Raw files from GitHub:', files);

                const mdFiles = files.filter(file =>
                    file.name.endsWith('.md') &&
                    file.name.toLowerCase() !== 'readme.md'
                );
                console.log('[DEBUG] Privacy: Filtered Markdown files:', mdFiles);

                if (mdFiles.length === 0) {
                    console.warn('[DEBUG] Privacy: No .md files found in the list.');
                    selector.html('<option value="" disabled selected>No policies found in repository.</option>');
                    return;
                }

                let optionsHtml = '<option value="" disabled selected>-- Select a Project Policy --</option>';
                mdFiles.forEach(file => {
                    const slug = file.name.replace('.md', '').toLowerCase();
                    const displayName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    const url = `https://raw.githubusercontent.com/${username}/${repo}/refs/heads/main/${file.name}`;
                    const isSelected = targetPolicy === slug;

                    optionsHtml += `<option value="${url}" data-slug="${slug}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                });

                selector.html(optionsHtml);
                console.log('[DEBUG] Privacy: Dropdown populated with', mdFiles.length, 'options.');

                if (selector.val()) {
                    console.log('[DEBUG] Privacy: Auto-triggering load for deep link.');
                    selector.trigger('change');
                }

            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('[DEBUG] Privacy: API list request failed:', response.status, errorData);
                selector.html(`<option value="" disabled selected>GitHub Error (${response.status})</option>`);
                if (response.status === 403) {
                    content.html('<p class="error">GitHub API Rate Limit Reached. (403 Forbidden)</p>');
                }
            }
        } catch (e) {
            console.error('[DEBUG] Privacy: Connection error in initPrivacy:', e);
            selector.html('<option value="" disabled selected>API Connection Error</option>');
        }

        // 4. Copy Link Button
        copyBtn.off('click').on('click', async function() {
            try {
                await navigator.clipboard.writeText(window.location.href);
                const originalHtml = $(this).html();
                $(this).addClass('copied').html('<i class="im im-check-mark"></i> Copied!');
                setTimeout(() => { $(this).removeClass('copied').html(originalHtml); }, 2000);
            } catch (err) { console.error('[DEBUG] Privacy: Copy failed', err); }
        });
    }

    $(document).ready(initPrivacy);

})(jQuery);
