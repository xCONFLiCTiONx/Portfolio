/**
 * Dynamic Privacy Policy Fetcher
 * Optimized for local and public viewing.
 * Version: 15
 */

(function($) {
    "use strict";

    const SELECTOR_ID = '#policySelector';
    const CONTENT_ID = '#policy-content';

    async function initPrivacy() {
        const selector = $(SELECTOR_ID);
        const content = $(CONTENT_ID);
        const copyBtn = $('#copyPolicyLink');

        function setStatus(msg, isError = false) {
            content.html(`<div class="status-msg ${isError ? 'error' : ''}">${msg}</div>`);
        }

        setStatus('Step 1: Loading configuration...');

        // 1. Get shared config
        const config = await getPortfolioConfig();
        const username = config.github_username || 'xCONFLiCTiONx';
        const repo = config.privacy_policy_repo || 'Privacy-Policies';
        const token = config.github_token;

        const urlParams = new URLSearchParams(window.location.search);
        const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();

        if (!selector.length) return;

        // 2. Setup Change Listener (Handles fetching content)
        selector.off('change').on('change', async function() {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (!downloadUrl) return;

            window.history.pushState({ path: selectedSlug }, '', '?p=' + selectedSlug);
            setStatus('<i class="im im-spinner im-spin"></i> Loading policy content...');

            try {
                // Fetch content - No auth header to avoid CORS blocks on raw content
                const response = await fetch(downloadUrl, { cache: 'no-store' });
                if (response.ok) {
                    const text = await response.text();
                    if (typeof marked !== 'undefined') {
                        content.html(marked.parse(text));
                    } else {
                        content.html('<pre style="white-space: pre-wrap;">' + text + '</pre>');
                    }
                    $('html, body').animate({ scrollTop: content.offset().top - 100 }, 400);
                } else {
                    setStatus(`Error: Could not load the policy text (HTTP ${response.status}).`, true);
                }
            } catch (e) {
                setStatus('Network error while fetching policy text.', true);
            }
        });

        // 3. Fetch file list from GitHub
        setStatus(`Step 2: Requesting policy list from ${username}/${repo}...`);

        try {
            const apiURL = `https://api.github.com/repos/${username}/${repo}/contents?t=${new Date().getTime()}`;

            // For the file list, only add token if it exists (avoids CORS preflight issues for unauthenticated)
            const headers = { 'Accept': 'application/vnd.github.v3+json' };
            if (token) headers['Authorization'] = `token ${token}`;

            const response = await fetch(apiURL, { headers });

            if (response.ok) {
                const files = await response.json();
                const mdFiles = files.filter(file =>
                    file.name.endsWith('.md') &&
                    file.name.toLowerCase() !== 'readme.md'
                );

                if (mdFiles.length === 0) {
                    setStatus('Success: No .md files found in repository.', false);
                    selector.html('<option value="" disabled selected>No policies found.</option>');
                    return;
                }

                let options = '<option value="" disabled selected>-- Select a Project Policy --</option>';
                mdFiles.forEach(file => {
                    const slug = file.name.replace('.md', '').toLowerCase();
                    const displayName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    // Construct robust raw URL
                    const url = `https://raw.githubusercontent.com/${username}/${repo}/refs/heads/main/${file.name}`;

                    options += `<option value="${url}" data-slug="${slug}" ${targetPolicy === slug ? 'selected' : ''}>${displayName}</option>`;
                });

                selector.html(options);
                setStatus('Select a policy from the dropdown above to view details.');

                // Auto-trigger if deep-linked
                if (targetPolicy && selector.val()) {
                    selector.trigger('change');
                }

            } else {
                if (response.status === 403) {
                    setStatus('GitHub API Rate Limit Reached. If you have a token, add it to site.webmanifest.', true);
                } else {
                    setStatus(`GitHub API Error (HTTP ${response.status}). Is the repo name correct?`, true);
                }
                selector.html(`<option value="" disabled selected>API Error (${response.status})</option>`);
            }
        } catch (e) {
            setStatus('Connection error. Check your internet or browser security settings.', true);
        }

        // 4. Copy link button
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
