/**
 * Dynamic Privacy Policy Fetcher
 * Fetches Markdown policies from a specified GitHub repository.
 */

(function($) {
    "use strict";

    const SELECTOR_ID = '#policySelector';
    const CONTENT_ID = '#policy-content';

    async function initPrivacy() {
        console.log('Privacy Fetcher: Initializing...');

        // 1. Get shared config from github-fetch.js
        const config = await getPortfolioConfig();
        const username = config.github_username || 'xCONFLiCTiONx';
        const repo = config.privacy_policy_repo || 'Privacy-Policies';

        // 0. Parse URL parameters for deep linking
        const urlParams = new URLSearchParams(window.location.search);
        const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();
        let autoSelectedUrl = null;

        const selector = $(SELECTOR_ID);
        const content = $(CONTENT_ID);
        const copyBtn = $('#copyPolicyLink');

        if (!selector.length) {
            console.error('Privacy Fetcher: Selector element not found!');
            return;
        }

        // 2. Setup listener BEFORE fetching data
        selector.off('change').on('change', async function() {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (!downloadUrl) return;

            if (selectedSlug) {
                window.history.pushState({ path: selectedSlug }, '', '?p=' + selectedSlug);
            }

            console.log('Privacy Fetcher: Loading content from:', downloadUrl);
            content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy...</div>');

            try {
                const response = await fetch(downloadUrl, { cache: 'no-store' });
                if (response.status === 403) {
                    content.html('<p class="error">GitHub Rate Limit Exceeded. <br> Please try again in an hour or view the repository directly.</p>');
                    return;
                }
                if (response.ok) {
                    const text = await response.text();
                    if (typeof marked !== 'undefined') {
                        content.html(marked.parse(text));
                    } else {
                        content.html('<pre style="white-space: pre-wrap;">' + text + '</pre>');
                    }
                    $('html, body').animate({ scrollTop: content.offset().top - 100 }, 400);
                } else {
                    content.html('<p class="error">Failed to load policy content (HTTP ' + response.status + ').</p>');
                }
            } catch (e) {
                content.html('<p class="error">Error fetching policy. Check your connection.</p>');
            }
        });

        // 3. Populate policy list (Try manifest first to save API call)
        if (config.policies && Array.isArray(config.policies)) {
            console.log('Privacy Fetcher: Using policies from manifest.');
            renderPolicyOptions(config.policies, username, repo, selector, targetPolicy);
            handleAutoTrigger(targetPolicy, selector);
        } else {
            // Fallback: Fetch from GitHub API
            await fetchFromGitHubAPI(username, repo, selector, targetPolicy);
            handleAutoTrigger(targetPolicy, selector);
        }

        // 5. Handle copy link button
        copyBtn.off('click').on('click', async function() {
            const currentUrl = window.location.href;
            const originalHtml = copyBtn.html();
            try {
                await navigator.clipboard.writeText(currentUrl);
                copyBtn.addClass('copied').html('<i class="im im-check-mark"></i> Copied!');
                setTimeout(() => { copyBtn.removeClass('copied').html(originalHtml); }, 2000);
            } catch (err) { console.error('Failed to copy URL:', err); }
        });
    }

    function renderPolicyOptions(slugs, username, repo, selector, targetPolicy) {
        let options = '<option value="" disabled selected>-- Select a Project Policy --</option>';
        slugs.forEach(slug => {
            const displayName = formatFileName(slug);
            const url = `https://raw.githubusercontent.com/${username}/${repo}/main/${slug}.md`;
            const isSelected = targetPolicy && (slug.toLowerCase() === targetPolicy);
            options += `<option value="${url}" data-slug="${slug}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
        });
        selector.html(options);
    }

    async function fetchFromGitHubAPI(username, repo, selector, targetPolicy) {
        try {
            const apiURL = `https://api.github.com/repos/${username}/${repo}/contents`;
            const response = await fetch(apiURL);

            if (response.status === 403) {
                selector.html('<option value="" disabled selected>API Rate Limit Exceeded. Try again later.</option>');
                return;
            }

            if (response.ok) {
                const files = await response.json();
                const mdFiles = files.filter(file => file.name.endsWith('.md') && file.name.toLowerCase() !== 'readme.md');

                let options = '<option value="" disabled selected>-- Select a Project Policy --</option>';
                mdFiles.forEach(file => {
                    const displayName = formatFileName(file.name);
                    const slug = file.name.replace('.md', '').toLowerCase();
                    const url = file.download_url || `https://raw.githubusercontent.com/${username}/${repo}/main/${file.name}`;
                    const isSelected = targetPolicy && (slug === targetPolicy);
                    options += `<option value="${url}" data-slug="${slug}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                });
                selector.html(options);
            }
        } catch (e) {
            selector.html('<option value="" disabled selected>Connection error.</option>');
        }
    }

    function handleAutoTrigger(targetPolicy, selector) {
        if (targetPolicy && selector.val()) {
            selector.trigger('change');
        }
    }

    function formatFileName(name) {
        return name
            .replace('.md', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    $(document).ready(initPrivacy);

})(jQuery);
