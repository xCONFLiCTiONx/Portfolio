/**
 * Dynamic Privacy Policy Fetcher
 * Fetches Markdown policies from a specified GitHub repository.
 */

(function($) {
    "use strict";

    const MANIFEST_URL = 'site.webmanifest';
    const SELECTOR_ID = '#policySelector';
    const CONTENT_ID = '#policy-content';

    async function initPrivacy() {
        console.log('Privacy Fetcher: Initializing...');
        let username = 'xCONFLiCTiONx'; // Default fallback
        let repo = 'Privacy-Policies'; // Default fallback

        // 0. Parse URL parameters for deep linking
        const urlParams = new URLSearchParams(window.location.search);
        const targetPolicy = (urlParams.get('p') || urlParams.get('policy') || '').toLowerCase();
        let autoSelectedUrl = null;

        const selector = $(SELECTOR_ID);
        const content = $(CONTENT_ID);
        const copyBtn = $('#copyPolicyLink');

        // 1. Load configuration from manifest
        try {
            const manifestFetch = await fetch(`${MANIFEST_URL}?t=${new Date().getTime()}`, { cache: 'no-store' });
            if (manifestFetch.ok) {
                const manifest = await manifestFetch.json();
                if (manifest.github_username) username = manifest.github_username;
                if (manifest.privacy_policy_repo) repo = manifest.privacy_policy_repo;
                console.log('Privacy Fetcher: Config loaded from manifest:', { username, repo });
            }
        } catch (e) {
            console.warn('Privacy Fetcher: Manifest load failed, using defaults.', e);
        }

        if (!selector.length) {
            console.error('Privacy Fetcher: Selector element not found!');
            return;
        }

        // 2. Fetch list of Markdown files from GitHub API
        try {
            const apiURL = `https://api.github.com/repos/${username}/${repo}/contents?t=${new Date().getTime()}`;
            console.log('Privacy Fetcher: Fetching file list from:', apiURL);

            const response = await fetch(apiURL, { cache: 'no-store' });

            if (response.ok) {
                const files = await response.json();
                console.log('Privacy Fetcher: Files found:', files.length);

                const mdFiles = files.filter(file =>
                    file.name.endsWith('.md') &&
                    file.name.toLowerCase() !== 'readme.md'
                );

                if (mdFiles.length === 0) {
                    selector.html('<option value="" disabled selected>No policies found in repository.</option>');
                    return;
                }

                // Populate selector
                let options = '<option value="" disabled selected>-- Select a Project Policy --</option>';
                mdFiles.forEach(file => {
                    const displayName = formatFileName(file.name);
                    const fileBaseName = file.name.replace('.md', '').toLowerCase();

                    // Use download_url if available, fallback to a constructed raw URL
                    const url = file.download_url || `https://raw.githubusercontent.com/${username}/${repo}/main/${file.name}`;

                    const isSelected = targetPolicy && (fileBaseName === targetPolicy || displayName.toLowerCase() === targetPolicy.replace(/-/g, ' '));
                    if (isSelected) autoSelectedUrl = url;

                    options += `<option value="${url}" data-slug="${fileBaseName}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                });
                selector.html(options);
                console.log('Privacy Fetcher: Dropdown populated.');

                // 4. Auto-trigger if deep-linked
                if (autoSelectedUrl) {
                    console.log('Privacy Fetcher: Deep link detected for:', targetPolicy);
                    selector.trigger('change');
                }

            } else {
                console.error('Privacy Fetcher: GitHub API returned error:', response.status);
                selector.html('<option value="" disabled selected>Error loading policies (HTTP ' + response.status + ')</option>');
            }
        } catch (e) {
            console.error('Privacy Fetcher: Network error while listing policies:', e);
            selector.html('<option value="" disabled selected>Connection error. Check console.</option>');
        }

        // 3. Handle selection change
        selector.off('change').on('change', async function() {
            const downloadUrl = $(this).val();
            const selectedSlug = $(this).find(':selected').data('slug');
            if (!downloadUrl) return;

            // Update URL for deep linking
            if (selectedSlug) {
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?p=' + selectedSlug;
                window.history.pushState({ path: newUrl }, '', newUrl);
            }

            console.log('Privacy Fetcher: Loading content from:', downloadUrl);
            content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy...</div>');

            try {
                const response = await fetch(downloadUrl, { cache: 'no-store' });
                if (response.ok) {
                    const text = await response.text();
                    console.log('Privacy Fetcher: Content received.');

                    if (typeof marked !== 'undefined') {
                        content.html(marked.parse(text));
                    } else {
                        console.error('Privacy Fetcher: Marked.js not found!');
                        content.html('<pre style="white-space: pre-wrap;">' + text + '</pre>');
                    }

                    // Smooth scroll to content
                    $('html, body').animate({
                        scrollTop: content.offset().top - 100
                    }, 400);
                } else {
                    console.error('Privacy Fetcher: Failed to fetch policy content:', response.status);
                    content.html('<p class="error">Failed to load policy content (HTTP ' + response.status + ').</p>');
                }
            } catch (e) {
                console.error('Privacy Fetcher: Error fetching policy text:', e);
                content.html('<p class="error">Error fetching policy. Check your connection.</p>');
            }
        });

        // 5. Handle copy link button
        copyBtn.on('click', async function() {
            const currentUrl = window.location.href;
            const originalHtml = copyBtn.html();

            try {
                await navigator.clipboard.writeText(currentUrl);

                // Visual feedback
                copyBtn.addClass('copied').html('<i class="im im-check-mark"></i> Copied!');

                setTimeout(() => {
                    copyBtn.removeClass('copied').html(originalHtml);
                }, 2000);
            } catch (err) {
                console.error('Failed to copy URL:', err);
            }
        });
    }

    /**
     * Formats filenames (e.g., 'call-guard-shield.md') to readable titles ('Call Guard Shield')
     */
    function formatFileName(name) {
        return name
            .replace('.md', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Initialize
    $(document).ready(function() {
        initPrivacy();
    });

})(jQuery);
