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
        let username = 'xCONFLiCTiONx'; // Default fallback
        let repo = 'Privacy-Policies'; // Default fallback

        // 1. Load configuration from manifest
        try {
            const response = await fetch(`${MANIFEST_URL}?t=${new Date().getTime()}`, { cache: 'no-store' });
            if (response.ok) {
                const manifest = await response.json();
                if (manifest.github_username) username = manifest.github_username;
                if (manifest.privacy_policy_repo) repo = manifest.privacy_policy_repo;
            }
        } catch (e) {
            console.warn('Manifest load failed, using defaults.');
        }

        const selector = $(SELECTOR_ID);
        const content = $(CONTENT_ID);

        // 2. Fetch list of Markdown files from GitHub API
        try {
            const apiURL = `https://api.github.com/repos/${username}/${repo}/contents?t=${new Date().getTime()}`;
            const response = await fetch(apiURL, { cache: 'no-store' });

            if (response.ok) {
                const files = await response.json();
                const mdFiles = files.filter(file => file.name.endsWith('.md') && file.name.toLowerCase() !== 'readme.md');

                if (mdFiles.length === 0) {
                    selector.html('<option value="" disabled selected>No policies found in repository.</option>');
                    return;
                }

                // Populate selector
                let options = '<option value="" disabled selected>-- Select a Project Policy --</option>';
                mdFiles.forEach(file => {
                    const displayName = formatFileName(file.name);
                    options += `<option value="${file.download_url}">${displayName}</option>`;
                });
                selector.html(options);

            } else {
                selector.html('<option value="" disabled selected>Error loading policies list.</option>');
            }
        } catch (e) {
            selector.html('<option value="" disabled selected>Connection error.</option>');
        }

        // 3. Handle selection change
        selector.on('change', async function() {
            const downloadUrl = $(this).val();
            if (!downloadUrl) return;

            content.html('<div class="repo-loader"><i class="im im-spinner im-spin"></i> Loading policy...</div>');

            try {
                const response = await fetch(downloadUrl, { cache: 'no-store' });
                if (response.ok) {
                    const markdown = await response.json(); // GitHub API raw content if fetched via API, but here we use download_url
                    // wait, download_url gives raw text, but fetch returns a Response.
                    const text = await response.text();
                    content.html(marked.parse(text));

                    // Smooth scroll to content
                    $('html, body').animate({
                        scrollTop: content.offset().top - 100
                    }, 400);
                } else {
                    content.html('<p class="error">Failed to load policy content.</p>');
                }
            } catch (e) {
                content.html('<p class="error">Error fetching policy.</p>');
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

    $(document).ready(initPrivacy);

})(jQuery);
