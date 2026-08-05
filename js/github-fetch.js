/**
 * Dynamic GitHub Data Fetcher
 * Boots from shared config and fetches profile/repositories from GitHub.
 * Version: 13
 */

const MANIFEST_PLACEHOLDER_ID = 'manifest-placeholder';
const FAVICON_ID = 'favicon-js';
const REPO_CONTAINER_ID = 'github-repos';
const AVATAR_CONTAINER_ID = 'profile-avatar';
const HEADER_AVATAR_ID = 'header-avatar';
const METADATA_CONTAINER_ID = 'profile-metadata';
const BIO_CONTAINER_ID = 'profile-bio';
const HANDLE_CONTAINER_ID = 'profile-handle';

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
            const response = await fetch(`site.webmanifest?t=${new Date().getTime()}`, { cache: 'no-store' });
            if (response.ok) {
                window.PortfolioConfig = await response.json();
                return window.PortfolioConfig;
            }
        } catch (error) {
            console.warn('Config: Manifest load failed, using defaults.');
        }
        window.PortfolioConfig = { github_username: DEFAULT_USERNAME };
        return window.PortfolioConfig;
    })();

    return configPromise;
}

/**
 * Returns headers for GitHub API requests, including token if available.
 */
function getGithubHeaders(config) {
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (config && config.github_token) {
        headers['Authorization'] = `token ${config.github_token}`;
    }
    return headers;
}

async function initPortfolio() {
    const config = await getPortfolioConfig();
    const username = config.github_username || DEFAULT_USERNAME;
    const headers = getGithubHeaders(config);

    try {
        // 1. Fetch User Data
        const userResponse = await fetch(`https://api.github.com/users/${username}?t=${new Date().getTime()}`, {
            headers,
            cache: 'no-store'
        });

        if (userResponse.status === 403) {
            handleRateLimit(username);
            return;
        }

        if (!userResponse.ok) throw new Error('Failed to fetch user profile');

        const userData = await userResponse.json();
        populateProfile(userData, username);

        // 2. Fetch Repositories
        const repoContainer = document.getElementById(REPO_CONTAINER_ID);
        if (repoContainer) {
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100&t=${new Date().getTime()}`, {
                headers,
                cache: 'no-store'
            });
            if (reposResponse.ok) {
                const repos = await reposResponse.json();
                renderRepos(repoContainer, repos);
            } else if (reposResponse.status === 403) {
                repoContainer.innerHTML = `<div class="repo-loader">GitHub API Rate Limit Exceeded.</div>`;
            }
        }

    } catch (error) {
        console.error('Portfolio Error:', error);
        document.querySelectorAll('.user-name-js').forEach(el => el.textContent = username);
    }
}

function handleRateLimit(username) {
    const repoContainer = document.getElementById(REPO_CONTAINER_ID);
    if (repoContainer) {
        repoContainer.innerHTML = `<div class="repo-loader">GitHub API Rate Limit Exceeded. <br> Please try again in an hour or <a href="https://github.com/${username}" target="_blank">view on GitHub</a>.</div>`;
    }
    document.querySelectorAll('.user-name-js').forEach(el => el.textContent = username);
}

function populateProfile(data, username) {
    const openGithub = () => window.open(`https://github.com/${username}`, '_blank');
    const ids = [AVATAR_CONTAINER_ID, 'profile-name', HANDLE_CONTAINER_ID, BIO_CONTAINER_ID];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onclick = openGithub;
    });

    document.querySelectorAll('.user-name-js').forEach(el => el.textContent = data.name || username);
    const handleEl = document.getElementById(HANDLE_CONTAINER_ID);
    if (handleEl) handleEl.textContent = data.login || username;
    const bioEl = document.getElementById(BIO_CONTAINER_ID);
    if (bioEl) bioEl.textContent = data.bio || 'Building tools for freedom & productivity.';

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
    if (repos.length === 0) {
        container.innerHTML = '<div class="repo-loader">No public repositories found.</div>';
        return;
    }

    repos.forEach(repo => {
        const div = document.createElement('div');
        div.className = 'repo-item';
        const langColor = LANG_COLORS[repo.language] || '#8b949e';
        const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const sshUrl = repo.clone_url.replace('https://github.com/', 'git@github.com:');
        const cliUrl = `gh repo clone ${repo.full_name}`;

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
                        <button class="clone-box__tab" onclick="switchCloneTab(this, 'cli', '${cliUrl}')">CLI</button>
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

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.repo-actions')) document.querySelectorAll('.repo-clone-box').forEach(b => b.classList.remove('active'));
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
    } catch (err) { console.error('Failed to copy!', err); }
}

document.addEventListener('DOMContentLoaded', initPortfolio);
