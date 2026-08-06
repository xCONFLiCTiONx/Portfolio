/**
 * Dynamic GitHub Data Fetcher
 * Version: 23
 */

console.log('[DEBUG] GITHUB-FETCH: Script File Loaded');

const MANIFEST_URL = 'site.webmanifest';
const REPO_CONTAINER_ID = 'github-repos';
const AVATAR_CONTAINER_ID = 'profile-avatar';
const HEADER_AVATAR_ID = 'header-avatar';
const HANDLE_CONTAINER_ID = 'profile-handle';
const BIO_CONTAINER_ID = 'profile-bio';
const METADATA_CONTAINER_ID = 'profile-metadata';
const FAVICON_ID = 'favicon-js';

const LANG_COLORS = {
    'C#': '#178600', 'HTML': '#e34c26', 'CSS': '#563d7c', 'JavaScript': '#f1e05a',
    'Kotlin': '#A97BFF', 'Java': '#b07219', 'Python': '#3572A5', 'Shell': '#89e051'
};

const DEFAULT_USERNAME = 'xCONFLiCTiONx';

// Shared Configuration
window.PortfolioConfig = null;
let configPromise = null;

async function getPortfolioConfig() {
    if (window.PortfolioConfig) return window.PortfolioConfig;
    if (configPromise) return configPromise;

    configPromise = (async () => {
        try {
            const response = await fetch(MANIFEST_URL, { cache: 'no-cache' });
            if (response.ok) {
                window.PortfolioConfig = await response.json();
                return window.PortfolioConfig;
            }
        } catch (error) {
            console.warn('Config: Failed to load manifest from server.');
        }
        window.PortfolioConfig = {
            github_username: DEFAULT_USERNAME,
            privacy_policy_repo: 'Privacy-Policies',
            github_token: null
        };
        return window.PortfolioConfig;
    })();

    return configPromise;
}

// Explicitly export to window for other scripts
window.getPortfolioConfig = getPortfolioConfig;

/**
 * Returns official GitHub headers
 */
function getGithubHeaders(token) {
    const headers = {
        'Accept': 'application/vnd.github.v3+json'
    };
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }
    return headers;
}
window.getGithubHeaders = getGithubHeaders;

async function initPortfolio() {
    const config = await getPortfolioConfig();
    const username = config.github_username || DEFAULT_USERNAME;
    const token = config.github_token;

    const fetchOptions = {
        headers: getGithubHeaders(token),
        cache: 'no-cache'
    };

    try {
        const userURL = `https://api.github.com/users/${username}`;
        const userResponse = await fetch(userURL, fetchOptions);
        if (userResponse.ok) {
            const userData = await userResponse.json();
            populateProfile(userData, username);
        } else {
            document.querySelectorAll('.user-name-js').forEach(el => el.textContent = username);
        }

        const repoContainer = document.getElementById(REPO_CONTAINER_ID);
        if (repoContainer) {
            const reposURL = `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`;
            const reposResponse = await fetch(reposURL, fetchOptions);
            if (reposResponse.ok) {
                const repos = await reposResponse.json();
                renderRepos(repoContainer, repos);
            }
        }

        // 3. Inject Dynamic Configuration
        const githubLink = document.getElementById('contact-github-js');
        if (githubLink) {
            githubLink.href = `https://github.com/${username}`;
        }

        const metaDesc = document.getElementById('meta-description-js');
        if (metaDesc) {
            metaDesc.content = `Software Developer Portfolio for ${userData.name || username} - Building tools for freedom & productivity.`;
        }

    } catch (error) {
        console.error('Portfolio: Connection Error', error);
    }
}

function populateProfile(data, username) {
    const openGithub = () => window.open(`https://github.com/${username}`, '_blank');
    const ids = [AVATAR_CONTAINER_ID, 'profile-name', HANDLE_CONTAINER_ID, BIO_CONTAINER_ID];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.onclick = openGithub;
            el.style.cursor = 'pointer';
        }
    });

    document.querySelectorAll('.user-name-js').forEach(el => el.textContent = data.name || username);
    if (document.getElementById(HANDLE_CONTAINER_ID)) document.getElementById(HANDLE_CONTAINER_ID).textContent = data.login || username;
    if (document.getElementById(BIO_CONTAINER_ID)) document.getElementById(BIO_CONTAINER_ID).textContent = data.bio || 'Building tools for freedom & productivity.';

    const avatarContainer = document.getElementById(AVATAR_CONTAINER_ID);
    const headerAvatar = document.getElementById(HEADER_AVATAR_ID);
    const favicon = document.getElementById(FAVICON_ID);

    if (data.avatar_url) {
        const imgHtml = `<img src="${data.avatar_url}" alt="${data.name || username}">`;
        if (avatarContainer) avatarContainer.innerHTML = imgHtml;
        if (headerAvatar) headerAvatar.innerHTML = imgHtml;
        if (favicon) favicon.setAttribute('href', data.avatar_url);
    }

    const metadataContainer = document.getElementById(METADATA_CONTAINER_ID);
    if (metadataContainer) renderMetadata(metadataContainer, data);
}

function renderMetadata(container, data) {
    let html = '';
    if (data.location) html += `<li><i class="im im-location"></i> <span>${data.location}</span></li>`;
    html += `<li><i class="im im-users"></i> <span><strong>${data.followers}</strong> followers &middot; <strong>${data.following}</strong> following</span></li>`;
    if (data.blog) {
        const url = data.blog.startsWith('http') ? data.blog : `https://${data.blog}`;
        html += `<li><i class="im im-link"></i> <a href="${url}" target="_blank">${data.blog.replace(/^https?:\/\//, '')}</a></li>`;
    }
    container.innerHTML = html;
}

function renderRepos(container, repos) {
    container.innerHTML = '';
    repos.forEach(repo => {
        const div = document.createElement('div');
        div.className = 'repo-item';
        const langColor = LANG_COLORS[repo.language] || '#8b949e';
        const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const sshUrl = repo.clone_url.replace('https://github.com/', 'git@github.com:');

        div.innerHTML = `
            <div class="repo-item__header"><a href="${repo.html_url}" target="_blank" class="repo-item__name">${repo.name}</a><span class="repo-item__badge">Public</span></div>
            ${repo.description ? `<p class="repo-item__description">${repo.description}</p>` : ''}
            <div class="repo-actions">
                <button class="repo-code-btn" onclick="toggleCloneBox(this)">Code <i class="im im-angle-down"></i></button>
                <div class="repo-clone-box">
                    <div class="clone-box__header"><i class="im im-code"></i> Clone</div>
                    <div class="clone-box__tabs">
                        <button class="clone-box__tab active" onclick="switchCloneTab(this, 'https', '${repo.clone_url}')">HTTPS</button>
                        <button class="clone-box__tab" onclick="switchCloneTab(this, 'ssh', '${sshUrl}')">SSH</button>
                    </div>
                    <div class="clone-box__url-container">
                        <input class="clone-box__input" type="text" value="${repo.clone_url}" readonly>
                        <button class="clone-box__copy-btn" onclick="copyCloneUrl(this)"><i class="im im-copy"></i></button>
                    </div>
                </div>
            </div>
            <div class="repo-item__footer">
                ${repo.language ? `<div class="repo-item__lang"><span class="repo-item__lang-dot" style="background-color: ${langColor}"></span><span>${repo.language}</span></div>` : ''}
                <div><i class="im im-star"></i><span>${repo.stargazers_count}</span></div>
                <div><i class="im im-share"></i><span>${repo.forks_count}</span></div>
                <div><span>Updated on ${updatedDate}</span></div>
            </div>
        `;
        container.appendChild(div);
    });
}

function toggleCloneBox(btn) {
    const box = btn.nextElementSibling;
    const isActive = box.classList.contains('active');
    document.querySelectorAll('.repo-clone-box').forEach(b => b.classList.remove('active'));
    if (!isActive) box.classList.add('active');
}

function switchCloneTab(tabBtn, type, url) {
    const box = tabBtn.closest('.repo-clone-box');
    box.querySelectorAll('.clone-box__tab').forEach(t => t.classList.remove('active'));
    tabBtn.classList.add('active');
    box.querySelector('.clone-box__input').value = url;
}

async function copyCloneUrl(btn) {
    const input = btn.previousElementSibling;
    try {
        await navigator.clipboard.writeText(input.value);
        const icon = btn.querySelector('i');
        icon.className = 'im im-check-mark';
        setTimeout(() => { icon.className = 'im im-copy'; }, 2000);
    } catch (err) { console.error('Copy failed', err); }
}

document.addEventListener('DOMContentLoaded', initPortfolio);
