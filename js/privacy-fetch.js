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

        const selector = $(SELECTOR_ID);
        const content = $(CONTENT_ID);

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
                    // Use download_url if available, fallback to a constructed raw URL
                    const url = file.download_url || `https://raw.githubusercontent.com/${username}/${repo}/main/${file.name}`;
                    options += `<option value="${url}">${displayName}</option>`;
                });
                selector.html(options);
                console.log('Privacy Fetcher: Dropdown populated.');

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
            if (!downloadUrl) return;

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
