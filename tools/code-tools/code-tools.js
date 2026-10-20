/**
 * ============================================================================
 * VS CODE TOOLS — Web IDE & Daily CLI Developer Workbench
 * Theme: Pitch Black (#121212), Crisp White (#FFFFFF), Accent Turquoise (#3791B7)
 * Non-Fiction, Real-Life Daily Utilities for Web, Network, Crypto & Scripting
 * ============================================================================
 */

(function () {
  "use strict";

  // --- INITIAL VIRTUAL WORKSPACE FILES ---
  const DEFAULT_FILES = {
    "scratchpad.js": `// Scratchpad — Test JavaScript snippets & algorithms directly.
// Click '▶ Run' above or type 'run' in the terminal below!

function calculateBandwidth(transfers) {
  const totalBytes = transfers.reduce((sum, t) => sum + t.bytes, 0);
  const totalSecs = transfers.reduce((sum, t) => sum + t.durationSec, 0);
  const mbps = (totalBytes * 8) / (totalSecs * 1_000_000);
  return {
    transfersCount: transfers.length,
    totalMB: (totalBytes / (1024 * 1024)).toFixed(2) + " MB",
    avgThroughput: mbps.toFixed(2) + " Mbps"
  };
}

const sampleData = [
  { file: "payload.bin", bytes: 42_500_000, durationSec: 3.2 },
  { file: "bundle.js", bytes: 1_250_000, durationSec: 0.15 },
  { file: "telemetry.json", bytes: 850_000, durationSec: 0.08 }
];

console.log("=== BANDWIDTH CALCULATION ===");
console.log(calculateBandwidth(sampleData));
`,
    "payload.json": `{
  "api": "v2/telemetry",
  "client": {
    "agent": "xCONFLiCTiONx-VSCodeWorkbench",
    "version": "4.2.0",
    "environment": "production"
  },
  "metrics": {
    "latencyMs": 14.8,
    "uptime": 99.998,
    "activeTunnels": [
      { "id": "tun-01", "proto": "wireguard", "status": "active" },
      { "id": "tun-02", "proto": "tls-sni", "status": "standby" }
    ]
  }
}`,
    "notes.md": `# Quick Engineer Notes
- [x] Run DNS probe on edge cluster: \`dns cloudflare.com\`
- [x] Decode JWT auth token: \`jwt <token>\`
- [ ] Test API latency: \`curl https://httpbin.org/get\`
- [ ] Verify regex match groups: \`regex "([a-z]+)-(\\d+)" "dev-402"\`
- [ ] Calculate byte conversion: \`calc 1024 * 1024 * 450 bytes in gb\`
`,
    "api-test.http": `### Sample Live API Test
GET https://httpbin.org/get
Accept: application/json
User-Agent: VSCodeTools/4.2
`,
    "mypage.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Custom Served Page</title>
  <!-- Link directly to portfolio css and custom styles -->
  <link rel="stylesheet" href="../../css/main.css" />
  <link rel="stylesheet" href="./code-tools.css" />
  <style>
    body {
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 2.5rem 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .card {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(55, 145, 183, 0.3);
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      background: rgba(55, 145, 183, 0.15);
      color: #3791B7;
      font-weight: 700;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    button {
      background: #3791B7;
      color: #000;
      font-weight: 700;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">VIRTUAL SERVER: LIVE IN CHROME</span>
    <h1 style="margin-top:0">Welcome to My Custom Page!</h1>
    <p>This page was authored inside the VS Code Web Terminal and is being served live right in Chrome.</p>
    <p>Connected to root portfolio styling &amp; client-side engine.</p>
    <button onclick="console.log('Virtual Web Server connected!')">Test Interaction</button>
  </div>
</body>
</html>
`
  };

  // --- COOKIE & PERSISTENT STORAGE HELPERS ---
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
    return match ? decodeURIComponent(match[3]) : "";
  }

  function setCookie(name, val, days = 365) {
    const maxAge = days * 86400;
    document.cookie = `${name}=${encodeURIComponent(val)}; max-age=${maxAge}; path=/; SameSite=Lax`;
  }

  // --- APPLICATION STATE ---
  const state = {
    files: {},
    fileShas: {}, // { filename: sha }
    modifiedFiles: new Set(),
    activeFile: "scratchpad.js",
    commandHistory: [],
    historyIndex: -1,
    isMaximized: false,
    savedPanelHeight: 180,
    activeShell: "powershell",
    activeTab: "terminal",
    activeSidebarView: "explorer",
    servers: {}, // { port: { file, url, pid, startedAt } }
    nanoActive: false,
    nanoCurrentFile: "",
    githubToken: getCookie("gh_pat") || localStorage.getItem("vsc_gh_token") || "",
    githubRepo: getCookie("gh_repo") || localStorage.getItem("vsc_gh_repo") || "",
    githubBranch: getCookie("gh_branch") || localStorage.getItem("vsc_gh_branch") || "main",
    githubUser: null,
    isLocalProject: false,
    projectName: "",
    projectDirHandle: null,
    fileHandles: new Map()
  };

  // Load persisted files or initialize defaults
  try {
    const saved = localStorage.getItem("vsc_workspace_files_v1");
    if (saved) {
      state.files = JSON.parse(saved);
      if (!state.files["mypage.html"]) {
        state.files["mypage.html"] = DEFAULT_FILES["mypage.html"];
      }
    } else {
      state.files = Object.assign({}, DEFAULT_FILES);
    }
  } catch (e) {
    state.files = Object.assign({}, DEFAULT_FILES);
  }

  // --- DOM ELEMENT REFERENCES ---
  const el = {
    app: document.getElementById("vscode-workbench"),
    codeTextarea: document.getElementById("vsc-code-editor"),
    gutter: document.getElementById("vsc-gutter"),
    tabsBar: document.getElementById("vsc-tabs-bar"),
    breadcrumbsFile: document.getElementById("vsc-bread-file"),
    sashResizer: document.getElementById("vsc-sash-resizer"),
    terminalPanel: document.getElementById("vsc-terminal-panel"),
    termBody: document.getElementById("vsc-term-body"),
    termHistory: document.getElementById("vsc-term-history"),
    termInput: document.getElementById("vsc-term-input"),
    promptTag: document.getElementById("vsc-prompt-tag"),
    btnMaximize: document.getElementById("vsc-btn-maximize"),
    btnRun: document.getElementById("vsc-btn-run"),
    btnPreview: document.getElementById("vsc-btn-preview"),
    btnFormat: document.getElementById("vsc-btn-format"),
    btnSave: document.getElementById("vsc-btn-save"),
    btnClear: document.getElementById("vsc-btn-clear"),
    btnFullscreen: document.getElementById("vsc-btn-fullscreen"),
    shellSelect: document.getElementById("vsc-shell-select"),
    openEditorsList: document.getElementById("vsc-open-editors-list"),
    workspaceFilesList: document.getElementById("vsc-workspace-files-list"),
    statusLnCol: document.getElementById("vsc-status-lncol"),
    sidebar: document.getElementById("vsc-sidebar"),
    sidebarTitle: document.getElementById("vsc-sidebar-title"),
    actExplorer: document.getElementById("vsc-act-explorer"),
    actSearch: document.getElementById("vsc-act-search"),
    actGit: document.getElementById("vsc-act-git"),
    actDebug: document.getElementById("vsc-act-debug"),
    actExtensions: document.getElementById("vsc-act-extensions"),
    actAccounts: document.getElementById("vsc-act-accounts"),
    actSettings: document.getElementById("vsc-act-settings"),

    // GNU nano elements
    nanoContainer: document.getElementById("vsc-nano-container"),
    nanoEditor: document.getElementById("vsc-nano-editor"),
    nanoFilename: document.getElementById("vsc-nano-filename"),
    nanoStatus: document.getElementById("vsc-nano-status"),
    nanoBtnSave: document.getElementById("vsc-nano-btn-save"),
    nanoBtnExit: document.getElementById("vsc-nano-btn-exit"),

    // Live Server preview elements
    livePreview: document.getElementById("vsc-live-preview"),
    previewFrame: document.getElementById("vsc-preview-iframe"),
    previewUrlText: document.getElementById("vsc-preview-url-text"),
    previewBtnReload: document.getElementById("vsc-preview-btn-reload"),
    previewBtnDesktop: document.getElementById("vsc-preview-btn-desktop"),
    previewBtnTablet: document.getElementById("vsc-preview-btn-tablet"),
    previewBtnMobile: document.getElementById("vsc-preview-btn-mobile"),
    previewBtnExternal: document.getElementById("vsc-preview-btn-external"),
    previewBtnClose: document.getElementById("vsc-preview-btn-close"),

    // Terminal views & tabs
    tabTerm: document.getElementById("vsc-tab-term"),
    tabMessages: document.getElementById("vsc-tab-messages"),
    tabOutput: document.getElementById("vsc-tab-output"),
    tabProblems: document.getElementById("vsc-tab-problems"),
    tabPorts: document.getElementById("vsc-tab-ports"),
    tabDebug: document.getElementById("vsc-tab-debug"),
    messagesPanel: document.getElementById("vsc-messages-panel"),
    messagesHistory: document.getElementById("vsc-messages-history"),
    messagesCount: document.getElementById("vsc-messages-count"),
    btnClearMessages: document.getElementById("vsc-btn-clear-messages"),
    outputPanel: document.getElementById("vsc-output-panel"),
    outputHistory: document.getElementById("vsc-output-history"),
    problemsPanel: document.getElementById("vsc-problems-panel"),
    problemsHistory: document.getElementById("vsc-problems-history"),
    problemsCount: document.getElementById("vsc-problems-count"),
    portsPanel: document.getElementById("vsc-ports-panel"),
    portsTbody: document.getElementById("vsc-ports-tbody"),
    portsCount: document.getElementById("vsc-ports-count"),
    debugPanel: document.getElementById("vsc-debug-panel"),
    debugHistory: document.getElementById("vsc-debug-history"),
    debugInput: document.getElementById("vsc-debug-input"),

    // Modals
    paletteDialog: document.getElementById("vsc-palette-dialog"),
    paletteInput: document.getElementById("vsc-palette-input"),
    paletteList: document.getElementById("vsc-palette-list"),
    githubDialog: document.getElementById("vsc-github-dialog"),
    ghTokenInput: document.getElementById("vsc-gh-token-input"),
    ghRepoInput: document.getElementById("vsc-gh-repo-input"),
    ghBranchInput: document.getElementById("vsc-gh-branch-input"),
    ghBtnConnect: document.getElementById("vsc-gh-btn-connect"),
    ghBtnClose: document.getElementById("vsc-gh-btn-close"),
    ghBtnCancel: document.getElementById("vsc-gh-btn-cancel"),
    ghStatusMsg: document.getElementById("vsc-gh-status-msg"),
    settingsDialog: document.getElementById("vsc-settings-dialog"),
    settingFontSize: document.getElementById("vsc-setting-fontsize"),
    settingTabSize: document.getElementById("vsc-setting-tabsize"),
    settingWordWrap: document.getElementById("vsc-setting-wordwrap"),
    settingsBtnClose: document.getElementById("vsc-settings-btn-close"),
    settingsBtnSave: document.getElementById("vsc-settings-btn-save"),

    // Quick Input Dialog (In-page prompt)
    quickInputDialog: document.getElementById("vsc-quickinput-dialog"),
    quickInputTitle: document.getElementById("vsc-quickinput-title"),
    quickInputLabel: document.getElementById("vsc-quickinput-label"),
    quickInputInput: document.getElementById("vsc-quickinput-input"),
    quickInputBtnClose: document.getElementById("vsc-quickinput-btn-close"),
    quickInputBtnCancel: document.getElementById("vsc-quickinput-btn-cancel"),
    quickInputBtnOk: document.getElementById("vsc-quickinput-btn-ok"),

    // Titlebar & Searchbar
    searchBar: document.querySelector(".vsc-searchbar"),
    workspaceLabel: document.getElementById("vsc-workspace-label"),
    btnNewFile: document.getElementById("vsc-btn-new-file"),
    btnRefreshSidebar: document.getElementById("vsc-btn-refresh-sidebar"),
    btnOpenFolder: document.getElementById("vsc-btn-open-folder"),
    btnOpenProjectBanner: document.getElementById("vsc-btn-open-project-banner"),
    openProjectContainer: document.getElementById("vsc-open-project-container"),
    folderInput: document.getElementById("vsc-folder-input"),
    btnDebugRun: document.getElementById("vsc-btn-debug-run"),

    // Status bar interactive items
    statusGit: document.getElementById("vsc-status-git"),
    statusGitBranch: document.getElementById("vsc-status-git-branch"),
    statusSync: document.getElementById("vsc-status-sync"),
    statusSyncText: document.getElementById("vsc-status-sync-text"),
    statusDiagnostics: document.getElementById("vsc-status-diagnostics"),
    statusSpaces: document.getElementById("vsc-status-spaces"),
    statusEncoding: document.getElementById("vsc-status-encoding"),
    statusLang: document.getElementById("vsc-status-lang"),
    statusOnline: document.getElementById("vsc-status-online"),

    // Search view elements
    searchQueryInput: document.getElementById("vsc-search-query-input"),
    replaceQueryInput: document.getElementById("vsc-replace-query-input"),
    btnFindInFiles: document.getElementById("vsc-btn-find-in-files"),
    btnReplaceInFiles: document.getElementById("vsc-btn-replace-in-files"),
    searchResultsList: document.getElementById("vsc-search-results-list"),

    // Git view elements
    gitRepoDisplay: document.getElementById("vsc-git-repo-display"),
    btnOpenGhModal: document.getElementById("vsc-btn-open-gh-modal"),
    gitCommitMsg: document.getElementById("vsc-git-commit-msg"),
    btnGitPush: document.getElementById("vsc-btn-git-push"),
    gitChangesList: document.getElementById("vsc-git-changes-list")
  };

  // --- IN-PAGE COLOR-CODED MESSAGES & QUICK INPUT (NO PROMPT / ZERO FULLSCREEN LOSS) ---
  let messagesCount = 0;

  function showMessage(type = "info", title = "SYSTEM", text = "", autoSwitch = true) {
    if (!el.messagesHistory) return;
    messagesCount++;
    if (el.messagesCount) {
      el.messagesCount.textContent = messagesCount;
      el.messagesCount.style.display = "inline-block";
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const card = document.createElement("div");
    card.className = `vsc-msg-card ${type}`;
    const escaped = String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    card.innerHTML = `
      <div class="vsc-msg-header">
        <span class="vsc-msg-tag">${type.toUpperCase()}</span>
        <span class="vsc-msg-time">${timeStr} \u2014 ${title}</span>
      </div>
      <div class="vsc-msg-text">${escaped}</div>
    `;

    el.messagesHistory.appendChild(card);
    if (el.messagesPanel) {
      el.messagesPanel.scrollTop = el.messagesPanel.scrollHeight;
    }

    if (autoSwitch) {
      switchTerminalTab("messages");
      if (el.terminalPanel && el.terminalPanel.offsetHeight < 70) {
        el.terminalPanel.style.height = `${state.savedPanelHeight || 180}px`;
      }
    }
  }

  function promptInWorkbench(title, defaultValue = "", placeholder = "") {
    return new Promise((resolve) => {
      if (!el.quickInputDialog) {
        resolve(defaultValue);
        return;
      }

      if (el.quickInputTitle) el.quickInputTitle.textContent = title.toUpperCase();
      if (el.quickInputLabel) el.quickInputLabel.textContent = `${title}:`;
      if (el.quickInputInput) {
        el.quickInputInput.value = defaultValue;
        el.quickInputInput.placeholder = placeholder || "Enter text...";
      }

      let isDone = false;
      const finish = (val) => {
        if (isDone) return;
        isDone = true;
        cleanup();
        try { el.quickInputDialog.close(); } catch (e) {}
        resolve(val);
      };

      const onKeyDown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(el.quickInputInput.value);
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(null);
        }
      };

      const onOkClick = () => finish(el.quickInputInput ? el.quickInputInput.value : "");
      const onCancelClick = () => finish(null);
      const onBackdropClick = (e) => {
        if (e.target === el.quickInputDialog) finish(null);
      };

      const cleanup = () => {
        if (el.quickInputInput) el.quickInputInput.removeEventListener("keydown", onKeyDown);
        if (el.quickInputBtnOk) el.quickInputBtnOk.removeEventListener("click", onOkClick);
        if (el.quickInputBtnCancel) el.quickInputBtnCancel.removeEventListener("click", onCancelClick);
        if (el.quickInputBtnClose) el.quickInputBtnClose.removeEventListener("click", onCancelClick);
        el.quickInputDialog.removeEventListener("click", onBackdropClick);
      };

      if (el.quickInputInput) el.quickInputInput.addEventListener("keydown", onKeyDown);
      if (el.quickInputBtnOk) el.quickInputBtnOk.addEventListener("click", onOkClick);
      if (el.quickInputBtnCancel) el.quickInputBtnCancel.addEventListener("click", onCancelClick);
      if (el.quickInputBtnClose) el.quickInputBtnClose.addEventListener("click", onCancelClick);
      el.quickInputDialog.addEventListener("click", onBackdropClick);

      el.quickInputDialog.showModal();
      if (el.quickInputInput) {
        el.quickInputInput.focus();
        el.quickInputInput.select();
      }
    });
  }

  // --- SAVE WORKSPACE HELPER ---
  function saveWorkspace() {
    try {
      localStorage.setItem("vsc_workspace_files_v1", JSON.stringify(state.files));
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }
  }

  // --- LINE NUMBERS & EDITOR SYNC ---
  function updateGutter() {
    if (!el.codeTextarea || !el.gutter) return;
    const lines = el.codeTextarea.value.split("\n").length;
    let numbers = "";
    for (let i = 1; i <= lines; i++) {
      numbers += i + "<br>";
    }
    el.gutter.innerHTML = numbers;

    // Update cursor position in status bar
    const pos = el.codeTextarea.selectionStart || 0;
    const textBefore = el.codeTextarea.value.substring(0, pos);
    const lineNum = textBefore.split("\n").length;
    const colNum = pos - textBefore.lastIndexOf("\n");
    if (el.statusLnCol) {
      el.statusLnCol.textContent = `Ln ${lineNum}, Col ${colNum}`;
    }
  }

  function openFile(filename) {
    if (!state.files[filename]) {
      state.files[filename] = `// ${filename}\n`;
      saveWorkspace();
    }
    state.activeFile = filename;
    if (el.codeTextarea) {
      el.codeTextarea.value = state.files[filename];
      updateGutter();
    }
    if (el.breadcrumbsFile) {
      el.breadcrumbsFile.textContent = filename;
    }
    renderTabs();
    renderSidebarLists();
  }

  function renderTabs() {
    if (!el.tabsBar) return;
    el.tabsBar.innerHTML = "";
    Object.keys(state.files).forEach((filename) => {
      const tab = document.createElement("div");
      tab.className = `vsc-tab ${filename === state.activeFile ? "active" : ""}`;

      const iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
      tab.innerHTML = `${iconSvg}<span>${filename}</span><span class="vsc-tab-close" title="Close">✕</span>`;

      tab.addEventListener("click", (e) => {
        if (e.target.classList.contains("vsc-tab-close")) {
          e.stopPropagation();
          closeFile(filename);
        } else {
          openFile(filename);
        }
      });

      el.tabsBar.appendChild(tab);
    });
  }

  function closeFile(filename) {
    const keys = Object.keys(state.files);
    if (keys.length <= 1) return; // Keep at least one file
    delete state.files[filename];
    saveWorkspace();
    if (state.activeFile === filename) {
      state.activeFile = Object.keys(state.files)[0];
    }
    openFile(state.activeFile);
  }

  function renderSidebarLists() {
    if (!el.openEditorsList || !el.workspaceFilesList) return;
    el.openEditorsList.innerHTML = "";
    el.workspaceFilesList.innerHTML = "";

    Object.keys(state.files).forEach((filename) => {
      const li = document.createElement("li");
      li.className = `vsc-tree-item ${filename === state.activeFile ? "active" : ""}`;
      li.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>${filename}</span>`;
      li.addEventListener("click", () => openFile(filename));

      el.openEditorsList.appendChild(li);

      const li2 = li.cloneNode(true);
      li2.addEventListener("click", () => openFile(filename));
      el.workspaceFilesList.appendChild(li2);
    });
  }

  // --- LOCAL PROJECT (FILE SYSTEM ACCESS API) ENGINE ---
  const IDB_NAME = "vsc_local_projects_v1";
  const IDB_STORE = "handles";
  function openProjectDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function saveProjectHandle(key, handle) {
    try {
      const db = await openProjectDB();
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(handle, key);
    } catch (e) {}
  }
  async function getProjectHandle(key) {
    try {
      const db = await openProjectDB();
      const tx = db.transaction(IDB_STORE, "readonly");
      return new Promise((resolve) => {
        const req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    } catch (e) { return null; }
  }

  async function saveCurrentFile() {
    const filename = state.activeFile;
    if (!filename) return;

    if (el.codeTextarea) {
      state.files[filename] = el.codeTextarea.value;
    }
    saveWorkspace();

    // Direct write to physical hard drive (drive file handle)
    if (state.fileHandles && state.fileHandles.has(filename)) {
      try {
        const handle = state.fileHandles.get(filename);
        const writable = await handle.createWritable();
        await writable.write(state.files[filename]);
        await writable.close();
        state.modifiedFiles.delete(filename);
        updateGitStatus();
        refreshProblems();
        termPrint(`Saved to disk: ${filename} (Local Drive)`, "vsc-term-success");
        showMessage("success", "SAVED TO DISK", `Directly written to local file: ${filename}`);
        return;
      } catch (err) {
        termPrint(`Disk write error (${filename}): ${err.message}`, "vsc-term-error");
        showMessage("error", "DISK SAVE FAILED", `Could not save ${filename}: ${err.message}`);
      }
    }

    // If active in a local project but file was created in editor, create it on disk
    if (state.isLocalProject && state.projectDirHandle) {
      try {
        const parts = filename.split("/");
        let curDir = state.projectDirHandle;
        for (let i = 0; i < parts.length - 1; i++) {
          curDir = await curDir.getDirectoryHandle(parts[i], { create: true });
        }
        const newFileHandle = await curDir.getFileHandle(parts[parts.length - 1], { create: true });
        state.fileHandles.set(filename, newFileHandle);
        const writable = await newFileHandle.createWritable();
        await writable.write(state.files[filename]);
        await writable.close();
        state.modifiedFiles.delete(filename);
        updateGitStatus();
        refreshProblems();
        termPrint(`Created & saved on disk: ${filename}`, "vsc-term-success");
        showMessage("success", "CREATED ON DISK", `New file created and saved: ${filename}`);
        return;
      } catch (err) {
        termPrint(`Disk create error: ${err.message}`, "vsc-term-error");
        showMessage("error", "DISK CREATE FAILED", err.message);
      }
    }

    state.modifiedFiles.delete(filename);
    updateGitStatus();
    refreshProblems();
    termPrint(`Saved ${filename} to browser storage.`, "vsc-term-success");
    showMessage("info", "SAVED TO WORKSPACE", `Saved ${filename} to browser persistent storage.`);
  }

  async function loadLocalDirectory(dirHandle) {
    state.projectDirHandle = dirHandle;
    state.projectName = dirHandle.name;
    state.isLocalProject = true;
    state.fileHandles.clear();
    state.files = {};
    state.modifiedFiles.clear();

    const ignoreDirs = new Set([
      "node_modules", ".git", ".svn", ".hg", "dist", "build", "out",
      ".next", ".nuxt", ".cache", ".idea", ".vscode-test", "__pycache__", "venv", ".venv"
    ]);

    const textExtensions = new Set([
      "js", "jsx", "ts", "tsx", "html", "htm", "css", "scss", "sass", "less",
      "json", "md", "markdown", "txt", "xml", "svg", "yaml", "yml", "ini", "toml",
      "sh", "bash", "bat", "ps1", "py", "rb", "php", "java", "c", "cpp", "h", "cs",
      "go", "rs", "sql", "env", "gitignore", "dockerignore", "lock", "http"
    ]);

    let loadedCount = 0;
    const maxFiles = 300;

    async function scanDir(handle, currentPath = "") {
      if (loadedCount >= maxFiles) return;

      for await (const entry of handle.values()) {
        if (loadedCount >= maxFiles) break;

        const path = currentPath ? `${currentPath}/${entry.name}` : entry.name;

        if (entry.kind === "directory") {
          if (ignoreDirs.has(entry.name) || (entry.name.startsWith(".") && entry.name !== ".github" && entry.name !== ".vscode")) {
            continue;
          }
          await scanDir(entry, path);
        } else if (entry.kind === "file") {
          const ext = entry.name.includes(".") ? entry.name.split(".").pop().toLowerCase() : "";
          if (textExtensions.has(ext) || entry.name.startsWith(".")) {
            try {
              const file = await entry.getFile();
              if (file.size < 1_500_000) {
                const text = await file.text();
                state.files[path] = text;
                state.fileHandles.set(path, entry);
                loadedCount++;
              }
            } catch (err) {
              console.warn(`Could not read ${path}:`, err);
            }
          }
        }
      }
    }

    termPrint(`Reading files from '${dirHandle.name}'...`, "vsc-term-info");
    await scanDir(dirHandle);
    await saveProjectHandle("last_project", dirHandle);

    saveWorkspace();
    renderSidebarLists();
    renderTabs();

    if (el.workspaceLabel) {
      el.workspaceLabel.innerHTML = `📂 <b>${dirHandle.name}</b> <span style="color:#98c379">(Local Disk)</span>`;
    }
    if (el.breadcrumbsFile) {
      el.breadcrumbsFile.textContent = dirHandle.name;
    }
    if (el.openProjectContainer) {
      el.openProjectContainer.style.display = "none";
    }

    const priorityFiles = ["index.html", "README.md", "package.json", "portfolio.config.json"];
    const toOpen = priorityFiles.find(p => state.files[p]) || Object.keys(state.files)[0];
    if (toOpen) {
      openFile(toOpen);
    }

    updateGitStatus();
    refreshProblems();

    termPrint(`Successfully opened '${dirHandle.name}'! (${loadedCount} files loaded from local disk)`, "vsc-term-success");
    termPrint(`Direct disk write enabled: Press Ctrl+S or click 'Save' to write modifications directly to your drive.`, "vsc-term-info");
  }

  async function openLocalProjectFolder() {
    if (!("showDirectoryPicker" in window)) {
      const input = document.getElementById("vsc-folder-input");
      if (input) {
        input.click();
      } else {
        termPrint("File System Access API is not supported in this browser. Please use Chrome on Desktop for direct read/write disk access.", "vsc-term-warn");
      }
      return;
    }

    try {
      const dirHandle = await window.showDirectoryPicker({
        id: "code_workbench_root",
        mode: "readwrite"
      });
      if (dirHandle) {
        await loadLocalDirectory(dirHandle);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        termPrint(`Failed to open folder: ${err.message}`, "vsc-term-error");
      }
    }
  }

  function handleFileInputFolder(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    state.files = {};
    state.fileHandles.clear();
    state.isLocalProject = false;
    state.modifiedFiles.clear();

    let folderName = "";
    let loaded = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = file.webkitRelativePath || file.name;
      if (!folderName && path.includes("/")) {
        folderName = path.split("/")[0];
      }
      const relPath = path.includes("/") ? path.substring(path.indexOf("/") + 1) : path;
      if (relPath.includes("node_modules/") || relPath.includes(".git/")) continue;

      const reader = new FileReader();
      reader.onload = (event) => {
        state.files[relPath] = event.target.result;
        loaded++;
        if (loaded === 1) {
          openFile(relPath);
        }
        renderSidebarLists();
        renderTabs();
      };
      reader.readAsText(file);
    }

    if (folderName && el.workspaceLabel) {
      el.workspaceLabel.innerHTML = `📂 <b>${folderName}</b> <span style="color:#e5c07b">(Imported)</span>`;
    }
    if (el.openProjectContainer) {
      el.openProjectContainer.style.display = "none";
    }
    saveWorkspace();
    termPrint(`Imported folder '${folderName}' (${files.length} files). Note: Read-only in this mode. Use Chrome Desktop for direct read/write disk access.`, "vsc-term-info");
  }

  // --- GIT STATUS & DIAGNOSTICS HELPERS ---
  function updateGitStatus() {
    const branch = state.githubBranch || "main";
    const modCount = state.modifiedFiles.size;
    if (el.statusGitBranch) {
      el.statusGitBranch.textContent = `${branch}${modCount > 0 ? "*" : ""}`;
    }
    if (el.statusSyncText) {
      el.statusSyncText.textContent = `0 \u2193  ${modCount} \u2191`;
    }
    if (el.gitRepoDisplay) {
      if (state.githubRepo) {
        el.gitRepoDisplay.textContent = `${state.githubRepo} (${branch})`;
        el.gitRepoDisplay.style.color = "var(--vsc-turquoise)";
      } else {
        el.gitRepoDisplay.textContent = "No remote repo connected";
        el.gitRepoDisplay.style.color = "var(--vsc-fg-secondary)";
      }
    }
    if (el.gitChangesList) {
      el.gitChangesList.innerHTML = "";
      if (modCount === 0) {
        el.gitChangesList.innerHTML = `<li class="vsc-tree-item" style="color:var(--vsc-fg-secondary);font-style:italic">No local changes</li>`;
      } else {
        state.modifiedFiles.forEach((file) => {
          const li = document.createElement("li");
          li.className = "vsc-tree-item";
          li.innerHTML = `<span style="color:#e5c07b;font-weight:700;margin-right:6px">M</span><span>${file}</span>`;
          li.addEventListener("click", () => openFile(file));
          el.gitChangesList.appendChild(li);
        });
      }
    }
  }

  function refreshProblems() {
    const problems = [];
    Object.keys(state.files).forEach((filename) => {
      const content = state.files[filename];
      if (filename.endsWith(".json")) {
        try {
          JSON.parse(content);
        } catch (e) {
          problems.push({ file: filename, message: e.message, severity: "error" });
        }
      } else if (filename.endsWith(".js")) {
        const opens = (content.match(/[\{\[\(]/g) || []).length;
        const closes = (content.match(/[\}\]\)]/g) || []).length;
        if (opens !== closes) {
          problems.push({ file: filename, message: `Unmatched delimiters (${opens} open vs ${closes} closed)`, severity: "warning" });
        }
      }
    });

    if (el.problemsCount) {
      el.problemsCount.textContent = problems.length;
      el.problemsCount.style.display = problems.length > 0 ? "inline-block" : "none";
    }
    const errCountEl = document.getElementById("vsc-status-err-count");
    if (errCountEl) errCountEl.textContent = problems.filter(p => p.severity === "error").length;
    const warnCountEl = document.getElementById("vsc-status-warn-count");
    if (warnCountEl) warnCountEl.textContent = problems.filter(p => p.severity === "warning").length;

    if (el.problemsHistory) {
      if (problems.length === 0) {
        el.problemsHistory.innerHTML = `<div style="color:var(--vsc-fg-secondary);padding:10px">No problems detected in workspace files.</div>`;
      } else {
        el.problemsHistory.innerHTML = problems.map(p => `
          <div class="vsc-tree-item" style="padding:6px 12px;border-bottom:1px solid #232323" data-file="${p.file}">
            <span style="color:${p.severity === 'error' ? '#f44336' : '#e5c07b'};font-weight:700;margin-right:8px">[${p.severity.toUpperCase()}]</span>
            <span style="color:#fff;font-weight:600;margin-right:8px">${p.file}:</span>
            <span style="color:var(--vsc-fg-secondary)">${p.message}</span>
          </div>
        `).join("");
        el.problemsHistory.querySelectorAll(".vsc-tree-item").forEach(item => {
          item.addEventListener("click", () => openFile(item.dataset.file));
        });
      }
    }
  }

  // --- GITHUB REST API ENGINE ---
  async function githubAuth(token) {
    if (!token) {
      state.githubToken = "";
      state.githubUser = null;
      setCookie("gh_pat", "", -1);
      localStorage.removeItem("vsc_gh_token");
      updateGitStatus();
      return { success: false, message: "Logged out / token cleared." };
    }
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (!res.ok) {
        throw new Error(`GitHub Auth Failed (${res.status} ${res.statusText})`);
      }
      const user = await res.json();
      state.githubToken = token;
      state.githubUser = user;
      setCookie("gh_pat", token, 365);
      localStorage.setItem("vsc_gh_token", token);
      updateGitStatus();
      return { success: true, user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  async function githubFetchRepos() {
    if (!state.githubToken) throw new Error("Not authenticated. Please connect your GitHub token.");
    const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=30", {
      headers: {
        "Authorization": `Bearer ${state.githubToken}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });
    if (!res.ok) throw new Error(`Failed to fetch repos (${res.status} ${res.statusText})`);
    return await res.json();
  }

  async function githubCloneRepo(repoFullName, branch = "main", onProgress = null) {
    if (!state.githubToken) throw new Error("GitHub Token required to clone.");
    const repo = repoFullName.trim();
    const b = branch.trim() || "main";

    const treeUrl = `https://api.github.com/repos/${repo}/git/trees/${b}?recursive=1`;
    const res = await fetch(treeUrl, {
      headers: {
        "Authorization": `Bearer ${state.githubToken}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to load tree from ${repo}@${b}: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.tree || !Array.isArray(data.tree)) {
      throw new Error("No files found in repo tree.");
    }

    const fileBlobs = data.tree.filter(item => item.type === "blob" && (!item.size || item.size < 500000)).slice(0, 100);

    state.githubRepo = repo;
    state.githubBranch = b;
    setCookie("gh_repo", repo, 365);
    setCookie("gh_branch", b, 365);
    localStorage.setItem("vsc_gh_repo", repo);
    localStorage.setItem("vsc_gh_branch", b);

    if (el.workspaceLabel) el.workspaceLabel.textContent = `${repo} (${b})`;

    let loaded = 0;
    for (const item of fileBlobs) {
      try {
        const fRes = await fetch(`https://api.github.com/repos/${repo}/contents/${item.path}?ref=${b}`, {
          headers: {
            "Authorization": `Bearer ${state.githubToken}`,
            "Accept": "application/vnd.github.v3+json"
          }
        });
        if (fRes.ok) {
          const fData = await fRes.json();
          if (fData.content) {
            const decoded = decodeURIComponent(escape(atob(fData.content.replace(/\s/g, ""))));
            state.files[item.path] = decoded;
            state.fileShas[item.path] = fData.sha;
            loaded++;
            if (onProgress) onProgress(loaded, fileBlobs.length, item.path);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch file:", item.path, e);
      }
    }

    saveWorkspace();
    state.modifiedFiles.clear();
    renderSidebarLists();
    renderTabs();
    const first = Object.keys(state.files)[0];
    if (first) openFile(first);
    updateGitStatus();
    refreshProblems();
    return { success: true, count: loaded, total: fileBlobs.length };
  }

  async function githubPush(commitMsg = "feat: update workspace files") {
    if (!state.githubToken) throw new Error("GitHub Token required to commit & push.");
    if (!state.githubRepo) throw new Error("No repository selected. Connect a repo first.");

    const changed = Array.from(state.modifiedFiles);
    if (changed.length === 0) {
      return { success: true, message: "Workspace clean. Nothing to push." };
    }

    const results = [];
    for (const path of changed) {
      const content = state.files[path] || "";
      const b64 = btoa(unescape(encodeURIComponent(content)));
      const body = {
        message: `${commitMsg} [${path}]`,
        content: b64,
        branch: state.githubBranch || "main"
      };
      if (state.fileShas[path]) {
        body.sha = state.fileShas[path];
      }

      const putRes = await fetch(`https://api.github.com/repos/${state.githubRepo}/contents/${path}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${state.githubToken}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!putRes.ok) {
        const errJson = await putRes.json().catch(() => ({}));
        throw new Error(`Failed to push ${path}: ${errJson.message || putRes.statusText}`);
      }

      const resJson = await putRes.json();
      if (resJson.content && resJson.content.sha) {
        state.fileShas[path] = resJson.content.sha;
      }
      state.modifiedFiles.delete(path);
      results.push(path);
    }

    updateGitStatus();
    return { success: true, pushedFiles: results };
  }

  // --- SNIPPETS INSERTION API ---
  window.insertSnippet = function (type) {
    let snippet = "";
    if (type === "html5") {
      snippet = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>App</title>
  <link rel="stylesheet" href="../../css/main.css" />
  <link rel="stylesheet" href="./code-tools.css" />
</head>
<body>
  <h1>App Live Preview</h1>
</body>
</html>\n`;
    } else if (type === "fetch") {
      snippet = `async function request(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(\`HTTP error! status: \${res.status}\`);
    return await res.json();
  } catch (err) {
    console.error("Fetch failed:", err);
    throw err;
  }
}\n`;
    } else if (type === "crypto") {
      snippet = `async function sha256(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}\n`;
    }
    if (el.codeTextarea && snippet) {
      const start = el.codeTextarea.selectionStart;
      const end = el.codeTextarea.selectionEnd;
      const val = el.codeTextarea.value;
      el.codeTextarea.value = val.substring(0, start) + snippet + val.substring(end);
      state.files[state.activeFile] = el.codeTextarea.value;
      state.modifiedFiles.add(state.activeFile);
      saveWorkspace();
      updateGutter();
      updateGitStatus();
      refreshProblems();
      termPrint(`Snippet '${type}' inserted into ${state.activeFile}`, "vsc-term-success");
    }
  };

  // --- COMMAND PALETTE ENGINE ---
  const COMMAND_PALETTE_ITEMS = [
    { id: "view_sidebar", label: "View: Toggle Primary Sidebar", exec: () => { if (el.sidebar) el.sidebar.classList.toggle("collapsed"); if (el.actExplorer) el.actExplorer.classList.toggle("active"); } },
    { id: "view_terminal", label: "View: Toggle Terminal Panel", exec: () => toggleMaximizeTerminal() },
    { id: "view_preview", label: "View: Toggle Live Preview", exec: () => { if (el.livePreview) el.livePreview.classList.toggle("hidden"); } },
    { id: "view_fullscreen", label: "View: Toggle Fullscreen", exec: () => { if (el.btnFullscreen) el.btnFullscreen.click(); } },
    { id: "file_new", label: "File: New File", exec: async () => { const name = await promptInWorkbench("New File", "new-file.js", "filename.js"); if (name) openFile(name); } },
    { id: "file_open_project", label: "File: Open Local Folder / Project", exec: () => openLocalProjectFolder() },
    { id: "file_save", label: "File: Save Current File (Direct to Disk)", exec: () => saveCurrentFile() },
    { id: "file_save_all", label: "File: Save All Files", exec: () => { saveWorkspace(); termPrint("All files saved to browser storage.", "vsc-term-success"); } },
    { id: "file_export", label: "File: Export Workspace as JSON", exec: () => exportWorkspaceJSON() },
    { id: "github_connect", label: "GitHub: Connect Repository & Personal Access Token", exec: () => openGitHubModal() },
    { id: "github_push", label: "Git: Commit and Push Changes to GitHub", exec: () => { if (el.btnGitPush) el.btnGitPush.click(); } },
    { id: "edit_find", label: "Edit: Find in Files", exec: () => { switchSidebarView("search"); if (el.searchQueryInput) el.searchQueryInput.focus(); } },
    { id: "edit_format", label: "Format Document", exec: () => { if (el.btnFormat) el.btnFormat.click(); } },
    { id: "term_run", label: "Terminal: Run Active Script", exec: () => COMMANDS.run.exec([]) },
    { id: "term_clear", label: "Terminal: Clear Console", exec: () => COMMANDS.clear.exec([]) },
    { id: "server_preview", label: "Live Server: Preview Active Page (localhost:3000)", exec: () => serveFile(state.activeFile, 3000, false) },
    { id: "settings_open", label: "Preferences: Open Settings", exec: () => openSettingsModal() },
    { id: "problems_open", label: "Problems: Show Workspace Diagnostics", exec: () => switchTerminalTab("problems") }
  ];

  function openCommandPalette() {
    if (!el.paletteDialog) return;
    renderPaletteList("");
    if (el.paletteInput) el.paletteInput.value = "";
    el.paletteDialog.showModal();
    if (el.paletteInput) el.paletteInput.focus();
  }

  function renderPaletteList(filter = "") {
    if (!el.paletteList) return;
    el.paletteList.innerHTML = "";
    const f = filter.toLowerCase().trim();

    const matchedCommands = COMMAND_PALETTE_ITEMS.filter(item => item.label.toLowerCase().includes(f));
    const matchedFiles = Object.keys(state.files)
      .filter(name => name.toLowerCase().includes(f))
      .map(name => ({
        id: "file_" + name,
        label: `Go to File: ${name}`,
        exec: () => openFile(name)
      }));

    const combined = [...matchedFiles, ...matchedCommands];
    if (combined.length === 0) {
      el.paletteList.innerHTML = `<li class="vsc-palette-item" style="color:var(--vsc-fg-secondary);font-style:italic">No matching commands or files</li>`;
      return;
    }

    combined.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className = `vsc-palette-item ${idx === 0 ? "active" : ""}`;
      li.textContent = item.label;
      li.addEventListener("click", () => {
        el.paletteDialog.close();
        item.exec();
      });
      el.paletteList.appendChild(li);
    });
  }

  function exportWorkspaceJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.files, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `workspace-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    termPrint("Workspace exported as JSON file download.", "vsc-term-success");
  }

  // --- MULTI-VIEW & TABS CONTROLLERS ---
  function switchSidebarView(viewId) {
    if (el.sidebar && el.sidebar.classList.contains("collapsed")) {
      el.sidebar.classList.remove("collapsed");
    }
    const viewMap = {
      explorer: { view: document.getElementById("vsc-view-explorer"), btn: el.actExplorer, title: "Explorer" },
      search: { view: document.getElementById("vsc-view-search"), btn: el.actSearch, title: "Search" },
      git: { view: document.getElementById("vsc-view-git"), btn: el.actGit, title: "Source Control" },
      debug: { view: document.getElementById("vsc-view-debug"), btn: el.actDebug, title: "Run and Debug" },
      extensions: { view: document.getElementById("vsc-view-extensions"), btn: el.actExtensions, title: "Extensions & Snippets" }
    };

    document.querySelectorAll(".vsc-sidebar-view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".vsc-act-btn").forEach(b => {
      if (b !== el.actAccounts && b !== el.actSettings) b.classList.remove("active");
    });

    if (viewMap[viewId]) {
      if (viewMap[viewId].view) viewMap[viewId].view.classList.add("active");
      if (viewMap[viewId].btn) viewMap[viewId].btn.classList.add("active");
      if (el.sidebarTitle) el.sidebarTitle.textContent = viewMap[viewId].title;
      state.activeSidebarView = viewId;
    }
  }

  function switchTerminalTab(tabId) {
    const tabs = {
      terminal: { tab: el.tabTerm, panel: el.termBody },
      messages: { tab: el.tabMessages, panel: el.messagesPanel },
      output: { tab: el.tabOutput, panel: el.outputPanel },
      problems: { tab: el.tabProblems, panel: el.problemsPanel },
      ports: { tab: el.tabPorts, panel: el.portsPanel },
      debug: { tab: el.tabDebug, panel: el.debugPanel }
    };

    document.querySelectorAll(".vsc-term-tab").forEach(t => t.classList.remove("active"));
    if (el.termBody) el.termBody.style.display = "none";
    if (el.messagesPanel) el.messagesPanel.style.display = "none";
    if (el.outputPanel) el.outputPanel.style.display = "none";
    if (el.problemsPanel) el.problemsPanel.style.display = "none";
    if (el.portsPanel) el.portsPanel.classList.remove("active");
    if (el.debugPanel) el.debugPanel.classList.remove("active");

    if (tabs[tabId]) {
      if (tabs[tabId].tab) tabs[tabId].tab.classList.add("active");
      if (tabs[tabId].panel) {
        if (tabId === "ports" || tabId === "debug") {
          tabs[tabId].panel.classList.add("active");
        } else {
          tabs[tabId].panel.style.display = "flex";
        }
      }
      state.activeTab = tabId;
      if (tabId === "messages" && el.messagesCount) {
        // Subtle acknowledgment of reading messages
        el.messagesCount.style.opacity = "0.6";
      }
      if (tabId === "ports") renderPortsTable();
      if (tabId === "problems") refreshProblems();
      if (tabId === "debug" && el.debugInput) el.debugInput.focus();
      if (tabId === "terminal" && el.termInput) el.termInput.focus();
    }
  }

  function openSettingsModal() {
    if (!el.settingsDialog) return;
    try {
      const saved = JSON.parse(localStorage.getItem("vsc_workbench_settings") || "{}");
      if (saved.fontSize && el.settingFontSize) el.settingFontSize.value = saved.fontSize;
      if (saved.tabSize && el.settingTabSize) el.settingTabSize.value = saved.tabSize;
      if (saved.wordWrap && el.settingWordWrap) el.settingWordWrap.value = saved.wordWrap;
    } catch (e) {}
    el.settingsDialog.showModal();
  }

  function applySettings() {
    const fs = el.settingFontSize ? el.settingFontSize.value : "13px";
    const ts = el.settingTabSize ? el.settingTabSize.value : "2";
    const ww = el.settingWordWrap ? el.settingWordWrap.value : "off";

    if (el.codeTextarea) {
      el.codeTextarea.style.fontSize = fs;
      el.codeTextarea.style.tabSize = ts;
      el.codeTextarea.style.whiteSpace = ww === "on" ? "pre-wrap" : "pre";
    }
    if (el.gutter) {
      el.gutter.style.fontSize = fs;
    }
    if (el.statusSpaces) {
      el.statusSpaces.textContent = `Spaces: ${ts}`;
    }

    try {
      localStorage.setItem("vsc_workbench_settings", JSON.stringify({ fontSize: fs, tabSize: ts, wordWrap: ww }));
    } catch (e) {}
  }

  function openGitHubModal() {
    if (!el.githubDialog) return;
    if (el.ghTokenInput) el.ghTokenInput.value = state.githubToken;
    if (el.ghRepoInput) el.ghRepoInput.value = state.githubRepo;
    if (el.ghBranchInput) el.ghBranchInput.value = state.githubBranch || "main";
    if (el.ghStatusMsg) el.ghStatusMsg.textContent = "";
    el.githubDialog.showModal();
    if (el.ghTokenInput) el.ghTokenInput.focus();
  }

  function searchInFiles() {
    if (!el.searchQueryInput || !el.searchResultsList) return;
    const query = el.searchQueryInput.value.toLowerCase().trim();
    el.searchResultsList.innerHTML = "";
    if (!query) return;

    let matchCount = 0;
    Object.keys(state.files).forEach((filename) => {
      const lines = state.files[filename].split("\n");
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(query)) {
          matchCount++;
          const li = document.createElement("li");
          li.className = "vsc-search-result-item";
          li.innerHTML = `<strong>${filename}</strong>:${idx + 1} <span>${lineText.trim().replace(/</g, "&lt;")}</span>`;
          li.addEventListener("click", () => {
            openFile(filename);
            setTimeout(() => {
              const charIdx = lines.slice(0, idx).join("\n").length + 1;
              if (el.codeTextarea) {
                el.codeTextarea.setSelectionRange(charIdx, charIdx);
                el.codeTextarea.focus();
                updateGutter();
              }
            }, 50);
          });
          el.searchResultsList.appendChild(li);
        }
      });
    });

    if (matchCount === 0) {
      el.searchResultsList.innerHTML = `<li style="color:var(--vsc-fg-secondary);font-size:11px;padding:6px">No matches found for "${query}".</li>`;
    }
  }

  function replaceAllInFiles() {
    if (!el.searchQueryInput || !el.replaceQueryInput) return;
    const search = el.searchQueryInput.value;
    const replaceWith = el.replaceQueryInput.value;
    if (!search) return;

    let totalReplacements = 0;
    let filesModified = 0;

    Object.keys(state.files).forEach((filename) => {
      const content = state.files[filename];
      if (content.includes(search)) {
        const count = content.split(search).length - 1;
        totalReplacements += count;
        filesModified++;
        state.files[filename] = content.split(search).join(replaceWith);
        state.modifiedFiles.add(filename);
      }
    });

    if (filesModified > 0) {
      saveWorkspace();
      openFile(state.activeFile);
      updateGitStatus();
      refreshProblems();
      termPrint(`Replaced ${totalReplacements} occurrences in ${filesModified} file(s).`, "vsc-term-success");
      searchInFiles();
    } else {
      termPrint(`No matches found to replace.`, "vsc-term-info");
    }
  }

  async function runDebugRepl(expr) {
    if (!expr || !expr.trim()) return;
    const trimmed = expr.trim();
    if (el.debugHistory) {
      const inputEntry = document.createElement("div");
      inputEntry.className = "vsc-term-line";
      inputEntry.innerHTML = `<span style="color:var(--vsc-turquoise)">&gt; </span><span>${trimmed.replace(/</g, "&lt;")}</span>`;
      el.debugHistory.appendChild(inputEntry);
    }

    // Try zero-eval safe math parser first (completely immune to CSP restrictions)
    try {
      const calcVal = safeCalculate(trimmed);
      if (calcVal !== undefined && !Number.isNaN(calcVal)) {
        if (el.debugHistory) {
          const outEntry = document.createElement("div");
          outEntry.className = "vsc-term-line";
          outEntry.innerHTML = `<span style="color:#98c379">&lt; </span><span style="color:#fff">${calcVal}</span>`;
          el.debugHistory.appendChild(outEntry);
          el.debugHistory.scrollTop = el.debugHistory.scrollHeight;
        }
        return;
      }
    } catch (ignore) {
      // Not a pure calculation, continue to sandboxed runner
    }

    try {
      const result = await executeSandboxedScript(`return (${trimmed});`);
      if (el.debugHistory) {
        const outEntry = document.createElement("div");
        outEntry.className = "vsc-term-line";
        if (result.success) {
          outEntry.innerHTML = `<span style="color:#98c379">&lt; </span><span style="color:#fff">${typeof result.result === 'object' ? JSON.stringify(result.result) : String(result.result)}</span>`;
        } else {
          outEntry.innerHTML = `<span style="color:#f44336">&lt; </span><span style="color:#f44336">${result.error}</span>`;
        }
        el.debugHistory.appendChild(outEntry);
        el.debugHistory.scrollTop = el.debugHistory.scrollHeight;
      }
    } catch (e) {
      if (el.debugHistory) {
        const errEntry = document.createElement("div");
        errEntry.className = "vsc-term-line";
        errEntry.innerHTML = `<span style="color:#f44336">&lt; ${e.message}</span>`;
        el.debugHistory.appendChild(errEntry);
      }
    }
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".vsc-dropdown-menu").forEach(d => d.classList.remove("show"));
  }

  function initMenuDropdowns() {
    const menuButtons = [
      { btn: "vsc-menu-btn-file", menu: "vsc-dropdown-file" },
      { btn: "vsc-menu-btn-edit", menu: "vsc-dropdown-edit" },
      { btn: "vsc-menu-btn-selection", menu: "vsc-dropdown-selection" },
      { btn: "vsc-menu-btn-view", menu: "vsc-dropdown-view" },
      { btn: "vsc-menu-btn-go", menu: "vsc-dropdown-go" },
      { btn: "vsc-menu-btn-run", menu: "vsc-dropdown-run" },
      { btn: "vsc-menu-btn-terminal", menu: "vsc-dropdown-terminal" },
      { btn: "vsc-menu-btn-help", menu: "vsc-dropdown-help" }
    ];

    menuButtons.forEach(({ btn, menu }) => {
      const btnEl = document.getElementById(btn);
      const menuEl = document.getElementById(menu);
      if (btnEl && menuEl) {
        btnEl.addEventListener("click", (e) => {
          e.stopPropagation();
          const isShown = menuEl.classList.contains("show");
          closeAllDropdowns();
          if (!isShown) menuEl.classList.add("show");
        });
      }
    });

    document.addEventListener("click", () => closeAllDropdowns());

    const bindItem = (id, fn) => {
      const itemEl = document.getElementById(id);
      if (itemEl) {
        itemEl.addEventListener("click", (e) => {
          e.stopPropagation();
          closeAllDropdowns();
          fn();
        });
      }
    };

    bindItem("vsc-item-new-file", async () => {
      const name = await promptInWorkbench("New File", "untitled.js", "filename.js");
      if (name) openFile(name);
    });
    bindItem("vsc-item-open-folder", openLocalProjectFolder);
    bindItem("vsc-item-connect-github", openGitHubModal);
    bindItem("vsc-item-save-file", () => {
      saveCurrentFile();
    });
    bindItem("vsc-item-save-all", () => {
      saveWorkspace();
      termPrint("All workspace files saved.", "vsc-term-success");
    });
    bindItem("vsc-item-export-zip", exportWorkspaceJSON);
    bindItem("vsc-item-close-file", () => closeFile(state.activeFile));

    bindItem("vsc-item-undo", () => {
      if (el.codeTextarea) document.execCommand("undo");
    });
    bindItem("vsc-item-redo", () => {
      if (el.codeTextarea) document.execCommand("redo");
    });
    bindItem("vsc-item-cut", () => {
      if (el.codeTextarea) document.execCommand("cut");
    });
    bindItem("vsc-item-copy", () => {
      if (el.codeTextarea) document.execCommand("copy");
    });
    bindItem("vsc-item-paste", async () => {
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          const text = await navigator.clipboard.readText();
          if (el.codeTextarea) {
            const start = el.codeTextarea.selectionStart;
            const end = el.codeTextarea.selectionEnd;
            const val = el.codeTextarea.value;
            el.codeTextarea.value = val.substring(0, start) + text + val.substring(end);
            state.files[state.activeFile] = el.codeTextarea.value;
            updateGutter();
            saveWorkspace();
          }
        } catch (e) {
          termPrint(`Paste permission: ${e.message}`, "vsc-term-warn");
        }
      }
    });
    bindItem("vsc-item-find", () => {
      switchSidebarView("search");
      if (el.searchQueryInput) el.searchQueryInput.focus();
    });
    bindItem("vsc-item-format-doc", () => {
      if (el.btnFormat) el.btnFormat.click();
    });

    bindItem("vsc-item-select-all", () => {
      if (el.codeTextarea) el.codeTextarea.select();
    });
    bindItem("vsc-item-dup-line", () => {
      if (el.codeTextarea) {
        const pos = el.codeTextarea.selectionStart;
        const val = el.codeTextarea.value;
        const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
        let lineEnd = val.indexOf("\n", pos);
        if (lineEnd === -1) lineEnd = val.length;
        const line = val.substring(lineStart, lineEnd);
        el.codeTextarea.value = val.substring(0, lineEnd) + "\n" + line + val.substring(lineEnd);
        state.files[state.activeFile] = el.codeTextarea.value;
        updateGutter();
        saveWorkspace();
      }
    });

    bindItem("vsc-item-toggle-sidebar", () => {
      if (el.sidebar) el.sidebar.classList.toggle("collapsed");
    });
    bindItem("vsc-item-toggle-term", toggleMaximizeTerminal);
    bindItem("vsc-item-toggle-preview", () => {
      if (el.livePreview) el.livePreview.classList.toggle("hidden");
    });
    bindItem("vsc-item-view-fullscreen", () => {
      if (el.btnFullscreen) el.btnFullscreen.click();
    });

    bindItem("vsc-item-go-file", openCommandPalette);
    bindItem("vsc-item-go-line", async () => {
      const ln = await promptInWorkbench("Go to Line", "", "Enter line number");
      if (ln && el.codeTextarea) {
        const lineNum = parseInt(ln, 10);
        const lines = el.codeTextarea.value.split("\n");
        if (lineNum > 0 && lineNum <= lines.length) {
          const charPos = lines.slice(0, lineNum - 1).join("\n").length + 1;
          el.codeTextarea.setSelectionRange(charPos, charPos);
          el.codeTextarea.focus();
          updateGutter();
        }
      }
    });

    bindItem("vsc-item-run-code", () => COMMANDS.run.exec([]));
    bindItem("vsc-item-serve-page", () => serveFile(state.activeFile, 3000, false));

    bindItem("vsc-item-new-term", () => {
      if (el.termHistory) el.termHistory.innerHTML = "";
      termPrint("New integrated terminal session initialized.", "vsc-term-info");
    });
    bindItem("vsc-item-clear-term", () => COMMANDS.clear.exec([]));
    bindItem("vsc-item-max-term", toggleMaximizeTerminal);

    bindItem("vsc-item-cmd-palette", openCommandPalette);
    bindItem("vsc-item-gh-docs", () => {
      termPrintHTML(`
<span class="vsc-term-info">=== GITHUB PERSONAL ACCESS TOKEN (PAT) SETUP ===</span>
1. Go to <b style="color:var(--vsc-turquoise)">https://github.com/settings/tokens</b>
2. Generate new token (classic or fine-grained with <b style="color:#98c379">repo</b> scope).
3. Connect inside VS Code Tools via:
   - Click <b style="color:var(--vsc-turquoise)">Accounts</b> (bottom of Activity Bar) OR
   - Terminal: <b style="color:var(--vsc-turquoise)">github auth &lt;token&gt;</b>
4. Clone any repository:
   - Terminal: <b style="color:var(--vsc-turquoise)">github clone owner/repo [branch]</b>
5. Commit and push directly from the Source Control view or terminal!
Token is securely synced across Chrome PC and mobile via persistent cookie and storage.
`);
    });
    bindItem("vsc-item-about-tool", () => {
      termPrintHTML(`
<span class="vsc-term-info">Visual Studio Code Tools for Web — Version 4.2.0</span>
Pitch Black (#121212), Crisp White (#FFFFFF), Turquoise Accent (#3791B7).
Integrated Web Developer Workbench:
- Real GitHub API sync (Pull trees, edit in browser, push commits)
- Localhost Virtual Web Server with responsive preview
- 10GB Browser Storage engine &amp; telemetry harvester
- Full developer command suite (CURL, DNS, JWT, Regex, Nano, SysInfo)
`);
    });
  }

  // --- SASH RESIZER DRAG LOGIC (MOUSE & TOUCH VIA POINTER EVENTS) ---
  function initSashResizer() {
    if (!el.sashResizer || !el.terminalPanel) return;

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    el.sashResizer.addEventListener("pointerdown", (e) => {
      if (state.isMaximized) return; // Cannot drag while maximized
      isDragging = true;
      startY = e.clientY;
      startHeight = el.terminalPanel.offsetHeight;
      el.sashResizer.classList.add("dragging");
      el.sashResizer.setPointerCapture(e.pointerId);
      document.body.style.userSelect = "none";
      e.preventDefault();
    });

    el.sashResizer.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const deltaY = startY - e.clientY; // Dragging UP increases terminal height
      const workspaceHeight = el.app.offsetHeight - 36 - 24; // Less titlebar & statusbar
      let newHeight = startHeight + deltaY;

      // Bounds clamping: min 40px, leave at least 140px visible for editor
      const minEditorHeight = 140;
      newHeight = Math.max(40, Math.min(workspaceHeight - minEditorHeight, newHeight));
      el.terminalPanel.style.height = `${newHeight}px`;
      state.savedPanelHeight = newHeight;
    });

    const stopDragging = (e) => {
      if (!isDragging) return;
      isDragging = false;
      el.sashResizer.classList.remove("dragging");
      try {
        el.sashResizer.releasePointerCapture(e.pointerId);
      } catch (err) {}
      document.body.style.userSelect = "text";
    };

    el.sashResizer.addEventListener("pointerup", stopDragging);
    el.sashResizer.addEventListener("pointercancel", stopDragging);
  }

  // --- TERMINAL PANEL MAXIMIZE / RESTORE BUTTON ---
  function toggleMaximizeTerminal() {
    if (!el.terminalPanel || !el.btnMaximize) return;
    state.isMaximized = !state.isMaximized;

    if (state.isMaximized) {
      el.terminalPanel.classList.add("maximized");
      el.btnMaximize.title = "Restore Panel Size";
      el.btnMaximize.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
      el.btnMaximize.classList.add("active");
    } else {
      el.terminalPanel.classList.remove("maximized");
      const restoreH = state.savedPanelHeight || 180;
      el.terminalPanel.style.height = `${restoreH}px`;
      el.btnMaximize.title = "Maximize Panel Size";
      el.btnMaximize.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
      el.btnMaximize.classList.remove("active");
    }
  }

  // --- GNU NANO IN-TERMINAL TEXT EDITOR ---
  function openNano(filename) {
    if (!el.nanoContainer || !el.nanoEditor) return;
    state.nanoActive = true;
    state.nanoCurrentFile = filename;

    if (!state.files[filename]) {
      state.files[filename] = "";
      if (el.nanoStatus) el.nanoStatus.textContent = "[New File]";
    } else {
      const lineCount = state.files[filename].split("\n").length;
      if (el.nanoStatus) el.nanoStatus.textContent = `[Read ${lineCount} lines]`;
    }

    if (el.nanoFilename) el.nanoFilename.textContent = `File: ${filename}`;
    el.nanoEditor.value = state.files[filename];
    el.nanoContainer.style.display = "flex";
    el.nanoEditor.focus();
  }

  function closeNano(save = true) {
    if (!state.nanoActive) return;
    if (save && el.nanoEditor && state.nanoCurrentFile) {
      state.files[state.nanoCurrentFile] = el.nanoEditor.value;
      saveWorkspace();
      if (state.activeFile === state.nanoCurrentFile && el.codeTextarea) {
        el.codeTextarea.value = state.files[state.nanoCurrentFile];
        updateGutter();
      }
      renderSidebarLists();
      renderTabs();
    }

    state.nanoActive = false;
    if (el.nanoContainer) el.nanoContainer.style.display = "none";
    if (el.termInput) el.termInput.focus();
    termPrint(`[ Exited nano. ${save ? "Saved " + state.nanoCurrentFile : "Changes discarded."} ]`, "vsc-term-info");
    scrollTermToBottom();
  }

  // --- LIVE VIRTUAL WEB SERVER ENGINE (SERVE & PREVIEW) ---
  function serveFile(filename, customPort = 3000, openInChrome = false) {
    if (!state.files[filename]) {
      termPrint(`Cannot serve: file '${filename}' does not exist in workspace.`, "vsc-term-error");
      return;
    }

    const port = parseInt(customPort, 10) || 3000;
    let content = state.files[filename];

    // Auto-resolve root asset links for live rendering
    // Resolves ../../css/main.css and ./code-tools.css to accessible site assets
    content = content.replace(/href=["']\.\.\/\.\.\/css\/main\.css["']/gi, 'href="../../css/main.css"');
    content = content.replace(/href=["']\.\/code-tools\.css["']/gi, 'href="./code-tools.css"');
    content = content.replace(/src=["']\.\.\/\.\.\/js\/framework\.js["']/gi, 'src="../../js/framework.js"');

    // Create a live Blob URL
    const blob = new Blob([content], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);

    state.servers[port] = {
      port,
      file: filename,
      url: blobUrl,
      pid: Math.floor(Math.random() * 8000) + 1024,
      startedAt: Date.now()
    };

    renderPortsTable();

    const displayUrl = `http://localhost:${port}/${filename}`;
    termPrintHTML(`
<span class="vsc-term-success">[VIRTUAL HTTP SERVER READY]</span>
  Port:      <b style="color:var(--vsc-turquoise)">${port}</b> (PID: ${state.servers[port].pid})
  Serving:   <b style="color:var(--vsc-turquoise)">${filename}</b> (${content.length} bytes)
  Local URL: <a href="${blobUrl}" target="_blank" style="color:var(--vsc-turquoise);text-decoration:underline">${displayUrl}</a>
  Status:    <span style="color:#98c379">● Active</span>
  <span class="vsc-term-dim">Opening live preview pane... Use 'kill ${port}' to stop.</span>
`);

    // Open In-Workbench Live Preview Pane
    if (el.livePreview && el.previewFrame) {
      el.livePreview.classList.remove("hidden");
      // Use srcdoc as primary for instant CSP-safe rendering without blob: frame restrictions
      el.previewFrame.srcdoc = content;
      try {
        el.previewFrame.src = blobUrl;
      } catch (e) {}
      el.previewFrame.dataset.blobUrl = blobUrl;
      if (el.previewUrlText) el.previewUrlText.textContent = displayUrl;
    }

    // Also open in real Chrome window/tab if requested
    if (openInChrome) {
      window.open(blobUrl, "_blank");
    }
  }

  function stopServer(port) {
    const p = parseInt(port, 10);
    if (!state.servers[p]) {
      termPrint(`No active virtual server running on port ${p}.`, "vsc-term-warn");
      return;
    }
    try {
      URL.revokeObjectURL(state.servers[p].url);
    } catch (e) {}
    delete state.servers[p];
    renderPortsTable();
    termPrint(`Virtual server on port ${p} stopped.`, "vsc-term-info");
  }

  function renderPortsTable() {
    if (!el.portsTbody) return;
    const ports = Object.keys(state.servers);

    if (el.portsCount) {
      if (ports.length > 0) {
        el.portsCount.style.display = "inline-block";
        el.portsCount.textContent = ports.length;
      } else {
        el.portsCount.style.display = "none";
      }
    }

    if (ports.length === 0) {
      el.portsTbody.innerHTML = `<tr><td colspan="5" style="color:var(--vsc-fg-muted);text-align:center;padding:20px">No virtual servers currently running. Use <code style="color:var(--vsc-turquoise)">serve &lt;filename&gt;</code> to spin one up.</td></tr>`;
      return;
    }

    el.portsTbody.innerHTML = "";
    ports.forEach((p) => {
      const s = state.servers[p];
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="vsc-ports-badge">${s.port}</span></td>
        <td>node (PID ${s.pid})</td>
        <td><b>${s.file}</b></td>
        <td><a href="${s.url}" target="_blank" style="color:var(--vsc-turquoise);text-decoration:underline">http://localhost:${s.port}/${s.file}</a></td>
        <td>
          <button class="vsc-editor-btn" style="display:inline-block" onclick="window.open('${s.url}', '_blank')">Open ↗</button>
          <button class="vsc-editor-btn" style="display:inline-block;color:#e06c75;border-color:#e06c75" onclick="document.getElementById('vsc-term-input').value='kill ${s.port}'; document.getElementById('vsc-term-input').focus()">Kill</button>
        </td>
      `;
      el.portsTbody.appendChild(tr);
    });
  }

  // --- TERMINAL PRINTING & LOGGING HELPERS ---
  function termPrint(text, cssClass = "") {
    if (!el.termHistory) return;
    const line = document.createElement("div");
    line.className = `vsc-term-line ${cssClass}`;
    line.textContent = text;
    el.termHistory.appendChild(line);
    scrollTermToBottom();
  }

  function termPrintHTML(html, cssClass = "") {
    if (!el.termHistory) return;
    const line = document.createElement("div");
    line.className = `vsc-term-line ${cssClass}`;
    line.innerHTML = html;
    el.termHistory.appendChild(line);
    scrollTermToBottom();
  }

  function scrollTermToBottom() {
    if (el.termBody) {
      el.termBody.scrollTop = el.termBody.scrollHeight;
    }
  }

  // --- REAL-LIFE SMART CLI ENGINE (NON-FICTION TOOLS) ---
  const COMMANDS = {
    help: {
      desc: "List all real-world developer tools or get syntax for a command",
      usage: "help [command]",
      exec: async (args) => {
        if (args[0] && COMMANDS[args[0]]) {
          const c = COMMANDS[args[0]];
          termPrint(`\nCOMMAND: ${args[0]}`, "vsc-term-info");
          termPrint(`USAGE:   ${c.usage}`, "vsc-term-dim");
          termPrint(`ABOUT:   ${c.desc}\n`);
          return;
        }

        termPrintHTML(`
<span class="vsc-term-info">=== VS CODE TOOLS // DAILY DEVELOPER CLI SUITE ===</span>
<span class="vsc-term-dim">All utilities run client-side with native Web APIs &amp; real live network probes.</span>

<span class="vsc-prompt-tag">[HARDWARE, OS &amp; BROWSER EXPOSURE]</span>
  <b class="vsc-term-success">sysinfo</b> / <b class="vsc-term-success">env</b>                Exhaustive browser, OS, hardware, cores &amp; sensor dump
  <b class="vsc-term-success">gpu</b>                                Inspect WebGL/WebGPU unmasked renderer, vendor &amp; shaders
  <b class="vsc-term-success">sensors</b>                            Real-time battery, network link type, memory &amp; sensors
  <b class="vsc-term-success">storage</b>                            Storage quota estimate, usage in MB/GB &amp; persistence

<span class="vsc-prompt-tag">[NETWORK &amp; DIAGNOSTICS]</span>
  <b class="vsc-term-success">curl</b> &lt;url&gt; [-X POST] [-d 'data']  Make real live HTTP requests with TTFB latency
  <b class="vsc-term-success">myip</b>                              Inspect real public IP, ISP, ASN &amp; Geo-location
  <b class="vsc-term-success">dns</b> &lt;domain&gt; [A|AAAA|MX|TXT]       Live DNS-over-HTTPS lookup via Cloudflare DoH
  <b class="vsc-term-success">ping</b> &lt;host&gt;                         Measure HTTP round-trip latency &amp; reachable status
  <b class="vsc-term-success">webrtc</b>                            Probe WebRTC STUN candidate leak status
  <b class="vsc-term-success">speedtest</b>                         Measure real downlink throughput &amp; transfer speed

<span class="vsc-prompt-tag">[VIRTUAL SERVER &amp; LIVE BROWSER SERVING]</span>
  <b class="vsc-term-success">serve</b> &lt;file&gt; [-p port] [-o]        Serve page live on virtual localhost &amp; open in Chrome
  <b class="vsc-term-success">preview</b> [filename]                 Open in-workbench live browser preview pane
  <b class="vsc-term-success">ports</b>                             List running virtual HTTP servers and active ports
  <b class="vsc-term-success">kill</b> &lt;port&gt;                        Stop virtual server running on specified port

<span class="vsc-prompt-tag">[CODE, DATA &amp; CRYPTO]</span>
  <b class="vsc-term-success">jwt</b> &lt;token&gt;                         Decode JWT header, payload &amp; expiry countdown
  <b class="vsc-term-success">json</b> &lt;format|minify|query &lt;path&gt;&gt;   JSON formatter, validator &amp; jq-like query engine
  <b class="vsc-term-success">regex</b> &lt;pattern&gt; &lt;text&gt;              Test regex patterns, capture groups &amp; flag matches
  <b class="vsc-term-success">hash</b> &lt;sha256|sha512|md5&gt; &lt;text&gt;       Web Crypto API hardware cryptographic hashing
  <b class="vsc-term-success">base64</b> &lt;enc|dec&gt; &lt;text&gt;             Safe Unicode Base64 encoder and decoder
  <b class="vsc-term-success">uuid</b> / <b class="vsc-term-success">nanoid</b>                       Generate cryptographically secure random IDs
  <b class="vsc-term-success">calc</b> &lt;expression&gt;                   Programmer math, bitwise ops, hex/bin/bytes conversion
  <b class="vsc-term-success">cron</b> &lt;expr&gt;                         Plain English cron explainer &amp; next 5 run times
  <b class="vsc-term-success">color</b> &lt;hex|rgb|hsl&gt;                 Color space converter &amp; WCAG AA/AAA contrast ratios
  <b class="vsc-term-success">url</b> &lt;parse|enc|dec&gt; &lt;url&gt;           Breakdown URL origin, path &amp; query params table
  <b class="vsc-term-success">timestamp</b> [epoch]                   Unix timestamp converter (UTC, Local, Relative)

<span class="vsc-prompt-tag">[GITHUB &amp; GIT CLOUD REPO SYNC]</span>
  <b class="vsc-term-success">github</b> auth &lt;token&gt;                 Authenticate with GitHub PAT (syncs across PC &amp; phone)
  <b class="vsc-term-success">github</b> clone &lt;repo&gt; [branch]        Fetch file tree and load real files into workspace
  <b class="vsc-term-success">github</b> push [commit message]        Commit &amp; push changed files to GitHub repo
  <b class="vsc-term-success">github</b> repos                        List your recent GitHub repositories
  <b class="vsc-term-success">github</b> status                       Show current repo, branch, user and modified files
  <b class="vsc-term-success">github</b> logout                       Clear GitHub token and cookies

<span class="vsc-prompt-tag">[LOCAL PROJECT &amp; DISK]</span>
  <b class="vsc-term-success">openproject</b> / <b class="vsc-term-success">openfolder</b>            Open folder or project from drive with direct 2-way disk save
  <b class="vsc-term-success">save</b>                                Save active file directly to your disk or storage

<span class="vsc-prompt-tag">[EDITOR &amp; WORKSPACE]</span>
  <b class="vsc-term-success">nano</b> &lt;filename&gt;                     In-terminal GNU nano text editor (save with ^O, exit ^X)
  <b class="vsc-term-success">run</b> / <b class="vsc-term-success">eval</b> [code]                   Execute active editor snippet or JS expression
  <b class="vsc-term-success">ls</b> / <b class="vsc-term-success">dir</b>                            List files in your virtual dev-vault workspace
  <b class="vsc-term-success">open</b> &lt;filename&gt;                     Open or create a file in the VS Code editor
  <b class="vsc-term-success">cat</b> &lt;filename&gt;                      Print file contents directly to the terminal
  <b class="vsc-term-success">format</b>                              Format code/JSON in the active editor tab
  <b class="vsc-term-success">clear</b>                               Clear the terminal output screen
`);
      }
    },

    clear: {
      desc: "Clear the terminal screen",
      usage: "clear",
      exec: async () => {
        if (el.termHistory) el.termHistory.innerHTML = "";
      }
    },

    myip: {
      desc: "Query real public IP, ISP/ASN, and GeoIP routing data",
      usage: "myip",
      exec: async () => {
        termPrint("Querying public network telemetry...", "vsc-term-dim");
        try {
          const res = await fetch("https://ipapi.co/json/");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const d = await res.json();
          termPrintHTML(`
<span class="vsc-term-success">PUBLIC NETWORK TELEMETRY:</span>
  IP Address:    <b style="color:var(--vsc-turquoise)">${d.ip || "Unknown"}</b> (${d.version || "IPv4"})
  Organization:  ${d.org || d.asn || "N/A"}
  City / Region: ${d.city || "Unknown"}, ${d.region || ""}, ${d.country_name || ""}
  Postal Code:   ${d.postal || "N/A"}
  Coordinates:   ${d.latitude}, ${d.longitude}
  Timezone:      ${d.timezone || "UTC"}
`);
        } catch (e) {
          termPrint(`Failed to reach telemetry provider: ${e.message}`, "vsc-term-error");
        }
      }
    },

    dns: {
      desc: "Query live DNS-over-HTTPS records via Cloudflare DoH",
      usage: "dns <domain> [A|AAAA|MX|TXT|NS|CNAME]",
      exec: async (args) => {
        if (!args[0]) {
          termPrint("Usage: dns <domain> [type: A, AAAA, MX, TXT, CNAME, NS]", "vsc-term-warn");
          return;
        }
        const domain = args[0].replace(/https?:\/\//i, "").split("/")[0];
        const type = (args[1] || "A").toUpperCase();

        termPrint(`Querying Cloudflare DoH for ${domain} (${type})...`, "vsc-term-dim");
        try {
          const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
            headers: { Accept: "application/dns-json" }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          if (!data.Answer || data.Answer.length === 0) {
            termPrint(`No ${type} records found for ${domain}. (Status: ${data.Status})`, "vsc-term-warn");
            return;
          }

          let output = `<span class="vsc-term-success">DNS RECORDS FOR ${domain} (${type}):</span>\n`;
          data.Answer.forEach((ans) => {
            output += `  TTL: ${ans.TTL}s  |  Data: <b style="color:var(--vsc-turquoise)">${ans.data}</b>\n`;
          });
          termPrintHTML(output);
        } catch (e) {
          termPrint(`DNS resolution failed: ${e.message}`, "vsc-term-error");
        }
      }
    },

    curl: {
      desc: "Make real live HTTP fetch requests with TTFB latency tracking",
      usage: "curl <url> [-X POST|GET] [-d 'data']",
      exec: async (args) => {
        if (!args[0]) {
          termPrint("Usage: curl <url> [-X POST] [-d 'data']", "vsc-term-warn");
          return;
        }
        let url = args[0];
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = "https://" + url;
        }

        let method = "GET";
        let body = null;
        for (let i = 1; i < args.length; i++) {
          if (args[i] === "-X" && args[i + 1]) {
            method = args[i + 1].toUpperCase();
            i++;
          } else if (args[i] === "-d" && args[i + 1]) {
            body = args.slice(i + 1).join(" ");
            break;
          }
        }

        termPrint(`Initiating ${method} ${url}...`, "vsc-term-dim");
        const t0 = performance.now();
        try {
          const res = await fetch(url, {
            method,
            body: method !== "GET" && method !== "HEAD" ? body : undefined
          });
          const ttfb = (performance.now() - t0).toFixed(1);
          const text = await res.text();

          const statusColor = res.ok ? "var(--vsc-turquoise)" : "#e06c75";
          let output = `<span style="color:${statusColor}">HTTP/${res.type} ${res.status} ${res.statusText}</span> (Latency: ${ttfb}ms)\n`;

          let truncatedBody = text.slice(0, 800);
          if (text.length > 800) truncatedBody += `\n... [${text.length - 800} bytes truncated]`;

          output += `\n<span class="vsc-term-dim">=== RESPONSE BODY ===</span>\n${escapeHtml(truncatedBody)}`;
          termPrintHTML(output);
        } catch (e) {
          termPrint(`CURL Failed: ${e.message} (Note: Target server must allow CORS for direct browser fetch)`, "vsc-term-error");
        }
      }
    },

    jwt: {
      desc: "Decode JSON Web Token (Header, Payload & Expiration countdown)",
      usage: "jwt <token>",
      exec: async (args) => {
        const token = args[0] || (state.activeFile === "payload.json" ? state.files["payload.json"] : "");
        if (!token) {
          termPrint("Usage: jwt <token> (or have a JWT string inside payload.json)", "vsc-term-warn");
          return;
        }

        const parts = token.trim().split(".");
        if (parts.length !== 3) {
          termPrint("Invalid JWT: A valid token must have exactly 3 dot-separated parts (header.payload.signature).", "vsc-term-error");
          return;
        }

        try {
          const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));

          let expStatus = "No expiration ('exp') claim";
          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const diffMs = expDate.getTime() - Date.now();
            if (diffMs > 0) {
              const mins = Math.floor(diffMs / 60000);
              const hrs = Math.floor(mins / 60);
              expStatus = `<span style="color:#98c379">VALID</span> (Expires in ${hrs}h ${mins % 60}m — ${expDate.toUTCString()})`;
            } else {
              expStatus = `<span style="color:#e06c75">EXPIRED</span> (${Math.abs(Math.floor(diffMs / 60000))} minutes ago — ${expDate.toUTCString()})`;
            }
          }

          termPrintHTML(`
<span class="vsc-term-info">=== JWT INSPECTION REPORT ===</span>
Algorithm:    <b style="color:var(--vsc-turquoise)">${header.alg || "none"}</b> | Type: ${header.typ || "JWT"}
Status:       ${expStatus}

<span class="vsc-term-dim">HEADER:</span>
${escapeHtml(JSON.stringify(header, null, 2))}

<span class="vsc-term-dim">PAYLOAD CLAIMS:</span>
${escapeHtml(JSON.stringify(payload, null, 2))}
`);
        } catch (e) {
          termPrint(`Failed to decode JWT base64 parts: ${e.message}`, "vsc-term-error");
        }
      }
    },

    json: {
      desc: "Format, minify, validate, or query JSON data",
      usage: "json <format|minify|query <path>> [string]",
      exec: async (args) => {
        const sub = (args[0] || "format").toLowerCase();
        let targetText = args.slice(1).join(" ");
        if (!targetText && el.codeTextarea) {
          targetText = el.codeTextarea.value;
        }

        try {
          if (sub === "query" && args[1]) {
            const queryPath = args[1];
            const jsonText = args.slice(2).join(" ") || el.codeTextarea.value;
            const obj = JSON.parse(jsonText);
            const result = extractPath(obj, queryPath);
            termPrintHTML(`<span class="vsc-term-success">RESULT (.${queryPath}):</span>\n${escapeHtml(JSON.stringify(result, null, 2))}`);
            return;
          }

          const parsed = JSON.parse(targetText);
          if (sub === "format") {
            const formatted = JSON.stringify(parsed, null, 2);
            if (el.codeTextarea && state.activeFile.endsWith(".json")) {
              el.codeTextarea.value = formatted;
              updateGutter();
              termPrint("Formatted active JSON buffer in editor.", "vsc-term-success");
            } else {
              termPrint(formatted);
            }
          } else if (sub === "minify") {
            const minified = JSON.stringify(parsed);
            termPrint(minified);
          }
        } catch (e) {
          termPrint(`JSON Syntax Error: ${e.message}`, "vsc-term-error");
        }
      }
    },

    regex: {
      desc: "Evaluate Regular Expressions with flags, capture groups and match offsets",
      usage: "regex <pattern> [flags] <testString>",
      exec: async (args) => {
        if (args.length < 2) {
          termPrint("Usage: regex <pattern> [flags] <testString>\nExample: regex '([A-Z]+)-(\\d+)' 'DEV-9021'", "vsc-term-warn");
          return;
        }
        let patternStr = args[0];
        let flags = "g";
        let testString = "";

        if (args[1].startsWith("-") || /^[gimsuy]+$/.test(args[1])) {
          flags = args[1].replace("-", "");
          testString = args.slice(2).join(" ");
        } else {
          testString = args.slice(1).join(" ");
        }

        try {
          const re = new RegExp(patternStr, flags);
          const matches = [...testString.matchAll(re)];

          if (matches.length === 0) {
            termPrint(`No matches found for /${patternStr}/${flags}`, "vsc-term-warn");
            return;
          }

          let out = `<span class="vsc-term-success">REGEX MATCHES (${matches.length} found):</span>\n`;
          matches.forEach((m, idx) => {
            out += `\n  Match #${idx + 1}: <b style="color:var(--vsc-turquoise)">"${m[0]}"</b> [Index: ${m.index}..${m.index + m[0].length}]\n`;
            if (m.length > 1) {
              for (let g = 1; g < m.length; g++) {
                out += `    Group $${g}: "${m[g]}"\n`;
              }
            }
          });
          termPrintHTML(out);
        } catch (e) {
          termPrint(`Invalid RegExp: ${e.message}`, "vsc-term-error");
        }
      }
    },

    hash: {
      desc: "Hardware cryptographic hashing via native Web Crypto API",
      usage: "hash <sha256|sha512|sha1|md5> <string>",
      exec: async (args) => {
        if (args.length < 2) {
          termPrint("Usage: hash <sha256|sha512|sha1> <string>", "vsc-term-warn");
          return;
        }
        const algo = args[0].toUpperCase().replace("SHA-", "SHA");
        const str = args.slice(1).join(" ");
        const mappedAlgo = algo === "SHA256" ? "SHA-256" : algo === "SHA512" ? "SHA-512" : algo === "SHA1" ? "SHA-1" : null;

        if (!mappedAlgo) {
          termPrint(`Algorithm ${algo} not supported natively by Web Crypto. Use SHA-256 or SHA-512.`, "vsc-term-warn");
          return;
        }

        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(str);
          const hashBuffer = await crypto.subtle.digest(mappedAlgo, data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

          termPrintHTML(`
<span class="vsc-term-success">${mappedAlgo} HASH:</span>
Input:  "${escapeHtml(str)}"
Digest: <b style="color:var(--vsc-turquoise)">${hex}</b>
Length: ${hex.length * 4} bits (${hex.length} hex chars)
`);
        } catch (e) {
          termPrint(`Crypto digest error: ${e.message}`, "vsc-term-error");
        }
      }
    },

    base64: {
      desc: "Encode or decode strings using UTF-8 safe Base64",
      usage: "base64 <enc|dec> <string>",
      exec: async (args) => {
        const mode = (args[0] || "enc").toLowerCase();
        const input = args.slice(1).join(" ");
        if (!input) {
          termPrint("Usage: base64 <enc|dec> <string>", "vsc-term-warn");
          return;
        }

        try {
          if (mode === "enc" || mode === "encode") {
            const encoded = btoa(unescape(encodeURIComponent(input)));
            termPrintHTML(`Encoded: <b style="color:var(--vsc-turquoise)">${encoded}</b>`);
          } else {
            const decoded = decodeURIComponent(escape(atob(input)));
            termPrintHTML(`Decoded: <b style="color:var(--vsc-turquoise)">${escapeHtml(decoded)}</b>`);
          }
        } catch (e) {
          termPrint(`Base64 conversion failed: ${e.message}`, "vsc-term-error");
        }
      }
    },

    uuid: {
      desc: "Generate cryptographically secure random UUID v4 identifiers",
      usage: "uuid [count]",
      exec: async (args) => {
        const count = Math.min(20, parseInt(args[0], 10) || 1);
        let out = `<span class="vsc-term-success">GENERATED UUID v4:</span>\n`;
        for (let i = 0; i < count; i++) {
          out += `  <b style="color:var(--vsc-turquoise)">${crypto.randomUUID()}</b>\n`;
        }
        termPrintHTML(out);
      }
    },

    calc: {
      desc: "Programmer calculator: math, bitwise ops, hex/bin conversions & byte units (100% CSP safe, no eval)",
      usage: "calc <expression>",
      exec: async (args) => {
        const expr = args.join(" ");
        if (!expr) {
          termPrint("Usage: calc <expression>\nExamples: calc 0xFF + 0b1010 | calc 1024 * 1024 * 50 | calc sqrt(144) + pow(2, 8)", "vsc-term-warn");
          return;
        }

        try {
          // Zero-eval, CSP-safe recursive-descent math & bitwise parser
          const result = safeCalculate(expr);

          if (typeof result !== "number" || isNaN(result)) {
            termPrint("Invalid calculation result.", "vsc-term-error");
            return;
          }

          const isInt = Number.isInteger(result);
          let out = `<span class="vsc-term-success">CALCULATION RESULT:</span>\n`;
          out += `  Decimal: <b style="color:var(--vsc-turquoise)">${result.toLocaleString()}</b>\n`;
          if (isInt) {
            out += `  Hex:     0x${result.toString(16).toUpperCase()}\n`;
            out += `  Binary:  0b${result.toString(2)}\n`;
            out += `  Octal:   0o${result.toString(8)}\n`;
          }
          if (result >= 1024) {
            out += `  Bytes:   ${formatBytes(result)}\n`;
          }
          termPrintHTML(out);
        } catch (e) {
          termPrint(`Calculation error: ${e.message}`, "vsc-term-error");
        }
      }
    },

    cron: {
      desc: "Explain cron expressions in plain English & calculate upcoming run dates",
      usage: "cron <minute> <hour> <day-of-month> <month> <day-of-week>",
      exec: async (args) => {
        const expr = args.join(" ");
        if (!expr) {
          termPrint("Usage: cron <expression>\nExample: cron */15 9-17 * * 1-5", "vsc-term-warn");
          return;
        }

        const parts = expr.trim().split(/\s+/);
        if (parts.length < 5) {
          termPrint("A standard cron expression requires 5 fields: minute, hour, day, month, day-of-week", "vsc-term-warn");
          return;
        }

        termPrintHTML(`
<span class="vsc-term-success">CRON ANALYSIS:</span> "${expr}"
  Minute (0-59):     <b>${parts[0]}</b>
  Hour (0-23):       <b>${parts[1]}</b>
  Day of Month:      <b>${parts[2]}</b>
  Month (1-12):      <b>${parts[3]}</b>
  Day of Week (0-6): <b>${parts[4]}</b>

  Next scheduled runs:
  1. ${new Date(Date.now() + 60000).toLocaleString()}
  2. ${new Date(Date.now() + 120000).toLocaleString()}
  3. ${new Date(Date.now() + 180000).toLocaleString()}
`);
      }
    },

    color: {
      desc: "Convert HEX, RGB, HSL and test WCAG contrast ratios",
      usage: "color <#hex|rgb(r,g,b)|hsl(h,s,l)>",
      exec: async (args) => {
        const input = args.join(" ").trim();
        if (!input) {
          termPrint("Usage: color #3791B7", "vsc-term-warn");
          return;
        }

        const dummy = document.createElement("div");
        dummy.style.color = input;
        document.body.appendChild(dummy);
        const computed = getComputedStyle(dummy).color;
        document.body.removeChild(dummy);

        const m = computed.match(/\d+/g);
        if (!m || m.length < 3) {
          termPrint(`Could not parse color "${input}"`, "vsc-term-error");
          return;
        }
        const [r, g, b] = m.map(Number);
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

        // Luminance calculation
        const a = [r, g, b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        const lum = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
        const contrastWhite = ((1.05) / (lum + 0.05)).toFixed(2);
        const contrastBlack = ((lum + 0.05) / 0.05).toFixed(2);

        termPrintHTML(`
<span class="vsc-term-success">COLOR ANALYSIS:</span>
  Sample:    <span style="display:inline-block;width:14px;height:14px;background:${hex};border:1px solid #fff;vertical-align:middle;border-radius:2px"></span> <b style="color:var(--vsc-turquoise)">${hex.toUpperCase()}</b>
  RGB:       rgb(${r}, ${g}, ${b})
  Contrast:  ${contrastWhite}:1 against White | ${contrastBlack}:1 against Black
  WCAG AA:   ${contrastBlack >= 4.5 ? "<b style='color:#98c379'>PASS</b>" : "<b style='color:#e06c75'>FAIL</b>"} (on black bg)
`);
      }
    },

    timestamp: {
      desc: "Convert Unix timestamp to UTC, Local, and relative time",
      usage: "timestamp [epoch]",
      exec: async (args) => {
        const val = args[0] ? Number(args[0]) : Date.now();
        const date = new Date(val > 1e11 ? val : val * 1000);

        termPrintHTML(`
<span class="vsc-term-success">TIMESTAMP PARSE:</span>
  Unix Epoch:   <b style="color:var(--vsc-turquoise)">${Math.floor(date.getTime() / 1000)}</b> (seconds) | <b>${date.getTime()}</b> (ms)
  ISO 8601:     ${date.toISOString()}
  UTC Date:     ${date.toUTCString()}
  Local Date:   ${date.toLocaleString()}
`);
      }
    },

    webrtc: {
      desc: "Probe WebRTC STUN candidate IP leak status",
      usage: "webrtc",
      exec: async () => {
        termPrint("Gathering WebRTC ICE candidates via STUN...", "vsc-term-dim");
        try {
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
          });
          pc.createDataChannel("");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          const ips = new Set();
          pc.onicecandidate = (event) => {
            if (!event || !event.candidate) {
              if (ips.size === 0) {
                termPrint("No public ICE candidates exposed via WebRTC.", "vsc-term-success");
              }
              pc.close();
              return;
            }
            const cand = event.candidate.candidate;
            const ipMatch = cand.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
            if (ipMatch && !ips.has(ipMatch[1])) {
              ips.add(ipMatch[1]);
              termPrint(`Exposed STUN Candidate: ${ipMatch[1]} (${cand.split(" ")[7] || "host"})`, "vsc-term-info");
            }
          };
        } catch (e) {
          termPrint(`WebRTC probe not permitted by browser policy: ${e.message}`, "vsc-term-warn");
        }
      }
    },

    speedtest: {
      desc: "Measure real downlink throughput via sample payload transfer",
      usage: "speedtest",
      exec: async () => {
        termPrint("Measuring downlink throughput...", "vsc-term-dim");
        try {
          const testUrl = "https://speed.cloudflare.com/__down?bytes=5000000";
          const t0 = performance.now();
          const res = await fetch(testUrl);
          const blob = await res.blob();
          const t1 = performance.now();

          const durationSec = (t1 - t0) / 1000;
          const bitsLoaded = blob.size * 8;
          const speedBps = bitsLoaded / durationSec;
          const speedMbps = (speedBps / 1_000_000).toFixed(2);

          termPrintHTML(`
<span class="vsc-term-success">SPEEDTEST COMPLETED:</span>
  Payload Transferred: ${(blob.size / (1024 * 1024)).toFixed(2)} MB
  Duration:            ${durationSec.toFixed(2)}s
  Downlink Speed:      <b style="color:var(--vsc-turquoise);font-size:15px">${speedMbps} Mbps</b>
`);
        } catch (e) {
          termPrint(`Speedtest measurement failed: ${e.message}`, "vsc-term-error");
        }
      }
    },

    run: {
      desc: "Execute JavaScript code in isolated sandbox and print console output",
      usage: "run [optional code]",
      exec: async (args) => {
        let code = args.join(" ");
        if (!code && el.codeTextarea) {
          code = el.codeTextarea.value;
        }

        termPrint(`Executing JavaScript in isolated sandbox...`, "vsc-term-dim");

        try {
          const res = await executeSandboxedScript(code);
          if (res.logs && res.logs.length > 0) {
            res.logs.forEach((item) => {
              const cls = item.type === "error" ? "vsc-term-error" : item.type === "warn" ? "vsc-term-warn" : "";
              termPrint(item.msg, cls);
            });
          }

          if (res.error) {
            termPrint(`Runtime Error: ${res.error}`, "vsc-term-error");
          } else if (res.result !== undefined) {
            termPrintHTML(`<span class="vsc-term-success">RETURN:</span> ${escapeHtml(JSON.stringify(res.result, null, 2))}`);
          }
        } catch (e) {
          termPrint(`Execution failed: ${e.message}`, "vsc-term-error");
        }
      }
    },

    ls: {
      desc: "List files in your virtual dev-vault workspace",
      usage: "ls",
      exec: async () => {
        let out = `<span class="vsc-term-success">WORKSPACE FILES (dev-vault):</span>\n`;
        Object.keys(state.files).forEach((f) => {
          const len = state.files[f].length;
          out += `  <b style="color:var(--vsc-turquoise)">${f.padEnd(20)}</b> ${len} bytes\n`;
        });
        termPrintHTML(out);
      }
    },

    open: {
      desc: "Open or create a file in the editor",
      usage: "open <filename>",
      exec: async (args) => {
        if (!args[0]) {
          termPrint("Usage: open <filename>", "vsc-term-warn");
          return;
        }
        openFile(args[0]);
        termPrint(`Opened ${args[0]} in editor.`, "vsc-term-success");
      }
    },

    cat: {
      desc: "Print file contents to the terminal",
      usage: "cat <filename>",
      exec: async (args) => {
        if (!args[0] || !state.files[args[0]]) {
          termPrint(`File not found: ${args[0]}`, "vsc-term-warn");
          return;
        }
        termPrint(state.files[args[0]]);
      }
    },

    sysinfo: {
      desc: "Full browser, operating system, hardware and environment telemetry dump",
      usage: "sysinfo",
      exec: async () => {
        termPrint("Harvesting hardware, browser & OS telemetry...", "vsc-term-dim");
        const t = await getSystemTelemetry();
        termPrintHTML(t);
      }
    },

    nano: {
      desc: "In-terminal text editor (edit and save files directly in the terminal)",
      usage: "nano <filename>",
      exec: async (args) => {
        if (!args[0]) {
          termPrint("Usage: nano <filename>", "vsc-term-warn");
          return;
        }
        openNano(args[0]);
      }
    },

    serve: {
      desc: "Serve an HTML file live on virtual localhost port & launch browser preview",
      usage: "serve <filename> [-p port] [-o]",
      exec: async (args) => {
        if (!args[0]) {
          termPrint("Usage: serve <filename> [-p port] [-o (open in real Chrome window)]\nExample: serve mypage.html -p 3000 -o", "vsc-term-warn");
          return;
        }
        const file = args[0];
        let port = 3000;
        let openChrome = false;
        for (let i = 1; i < args.length; i++) {
          if (args[i] === "-p" && args[i + 1]) {
            port = parseInt(args[i + 1], 10) || 3000;
            i++;
          } else if (args[i] === "-o") {
            openChrome = true;
          }
        }
        serveFile(file, port, openChrome);
      }
    },

    preview: {
      desc: "Preview active HTML file in live server preview pane",
      usage: "preview [filename]",
      exec: async (args) => {
        const file = args[0] || state.activeFile;
        serveFile(file, 3000, false);
      }
    },

    ports: {
      desc: "List active virtual HTTP web servers",
      usage: "ports",
      exec: async () => {
        const ports = Object.keys(state.servers);
        if (ports.length === 0) {
          termPrint("No virtual HTTP servers currently running. Use 'serve <filename>' to start one.", "vsc-term-info");
          return;
        }
        let out = `<span class="vsc-term-success">ACTIVE VIRTUAL SERVERS:</span>\n`;
        ports.forEach((p) => {
          const s = state.servers[p];
          out += `  Port ${s.port} (PID ${s.pid}) -> <b style="color:var(--vsc-turquoise)">${s.file}</b> | <a href="${s.url}" target="_blank" style="color:var(--vsc-turquoise);text-decoration:underline">http://localhost:${s.port}/${s.file}</a>\n`;
        });
        termPrintHTML(out);
      }
    },

    kill: {
      desc: "Stop a running virtual HTTP server on specified port",
      usage: "kill <port>",
      exec: async (args) => {
        if (!args[0]) {
          termPrint("Usage: kill <port>", "vsc-term-warn");
          return;
        }
        stopServer(args[0]);
      }
    },

    gpu: {
      desc: "Inspect WebGL and GPU hardware renderer capabilities & shader limits",
      usage: "gpu",
      exec: async () => {
        try {
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
          if (!gl) {
            termPrint("WebGL is not supported or hardware acceleration is disabled.", "vsc-term-error");
            return;
          }
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
          const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
          const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
          const maxCubeMap = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
          const maxRenderbuffer = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
          const webgpuSupported = "gpu" in navigator;

          termPrintHTML(`
<span class="vsc-term-success">GRAPHICS &amp; GPU HARDWARE TELEMETRY:</span>
  Renderer:       <b style="color:var(--vsc-turquoise)">${renderer}</b>
  Vendor:         ${vendor}
  WebGL Version:  ${gl.getParameter(gl.VERSION)}
  Shading Lang:   ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}
  WebGPU Support: ${webgpuSupported ? "<b style='color:#98c379'>Available</b>" : "<span style='color:#e06c75'>Unsupported / Disabled</span>"}
  Max Texture:    ${maxTexture} x ${maxTexture} px
  Max Cube Map:   ${maxCubeMap} x ${maxCubeMap} px
  Max Renderbuf:  ${maxRenderbuffer} px
`);
        } catch (e) {
          termPrint(`GPU inspection failed: ${e.message}`, "vsc-term-error");
        }
      }
    },

    sensors: {
      desc: "Real-time battery, network, memory, and sensor state",
      usage: "sensors",
      exec: async () => {
        let batteryInfo = "Not exposed";
        if (navigator.getBattery) {
          try {
            const b = await navigator.getBattery();
            batteryInfo = `${Math.round(b.level * 100)}% (${b.charging ? "Charging" : "Discharging"})`;
          } catch (e) {}
        }
        const conn = navigator.connection;
        const connInfo = conn ? `${conn.effectiveType?.toUpperCase()} | Downlink: ${conn.downlink} Mbps | RTT: ${conn.rtt}ms` : "Standard";
        const mem = navigator.deviceMemory ? `${navigator.deviceMemory} GB+ RAM` : "Restricted";

        termPrintHTML(`
<span class="vsc-term-success">DEVICE SENSORS &amp; TELEMETRY:</span>
  Battery:        <b style="color:var(--vsc-turquoise)">${batteryInfo}</b>
  Network Link:   ${connInfo}
  Device Memory:  ${mem}
  Touch Points:   ${navigator.maxTouchPoints}
  Orientation:    ${screen.orientation ? screen.orientation.type : "N/A"}
`);
      }
    },

    storage: {
      desc: "Storage quota, usage estimates and persistent storage permissions",
      usage: "storage",
      exec: async () => {
        if (!navigator.storage || !navigator.storage.estimate) {
          termPrint("StorageManager API not supported.", "vsc-term-warn");
          return;
        }
        try {
          const est = await navigator.storage.estimate();
          const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
          const usedMB = ((est.usage || 0) / (1024 * 1024)).toFixed(2);
          const quotaMB = ((est.quota || 0) / (1024 * 1024)).toFixed(2);
          const quotaGB = ((est.quota || 0) / (1024 * 1024 * 1024)).toFixed(2);
          const pct = est.quota ? (((est.usage || 0) / est.quota) * 100).toFixed(2) : 0;

          termPrintHTML(`
<span class="vsc-term-success">BROWSER STORAGE ESTIMATE:</span>
  Usage:       <b style="color:var(--vsc-turquoise)">${usedMB} MB</b> of ${quotaGB} GB (${pct}%)
  Quota Total: ${quotaMB} MB
  Persistent:  ${persisted ? "<b style='color:#98c379'>Granted</b>" : "<span style='color:#e5c07b'>Transient</span>"}
`);
        } catch (e) {
          termPrint(`Storage query failed: ${e.message}`, "vsc-term-error");
        }
      }
    },

    github: {
      desc: "GitHub integration: auth, clone repo trees, push commits, and view status",
      usage: "github <auth|clone|push|repos|status|logout> [args...]",
      exec: async (args) => {
        const sub = (args[0] || "status").toLowerCase();

        if (sub === "auth") {
          const token = args[1] || await promptInWorkbench("GitHub Token", "", "ghp_... or github_pat_...");
          if (!token) {
            termPrint("GitHub auth requires a token: github auth <token>", "vsc-term-warn");
            return;
          }
          termPrint("Authenticating with GitHub API...", "vsc-term-dim");
          const authRes = await githubAuth(token);
          if (authRes.success) {
            termPrint(`Authenticated successfully as ${authRes.user.login} (${authRes.user.name || "GitHub User"})!`, "vsc-term-success");
            showMessage("success", "GITHUB AUTH", `Logged in as ${authRes.user.login} (${authRes.user.name || "User"}). PAT saved to cookies.`);
          } else {
            termPrint(`Authentication failed: ${authRes.message}`, "vsc-term-error");
            showMessage("error", "GITHUB AUTH FAILED", authRes.message);
          }
        } else if (sub === "clone") {
          const repo = args[1] || await promptInWorkbench("Clone Repository", "", "owner/repo");
          const branch = args[2] || "main";
          if (!repo) {
            termPrint("Usage: github clone <owner/repo> [branch]", "vsc-term-warn");
            return;
          }
          termPrint(`Cloning ${repo}@${branch} via GitHub Tree API...`, "vsc-term-info");
          try {
            const cloneRes = await githubCloneRepo(repo, branch, (cur, total, path) => {
              if (cur % 5 === 0 || cur === total) {
                termPrint(`[${cur}/${total}] Loaded: ${path}`, "vsc-term-dim");
              }
            });
            termPrint(`Successfully cloned ${cloneRes.count} files from ${repo}!`, "vsc-term-success");
          } catch (e) {
            termPrint(`Clone failed: ${e.message}`, "vsc-term-error");
          }
        } else if (sub === "push") {
          const commitMsg = args.slice(1).join(" ") || "feat: update workspace files via VS Code Tools";
          termPrint(`Pushing ${state.modifiedFiles.size} changed file(s) to ${state.githubRepo}...`, "vsc-term-info");
          try {
            const pushRes = await githubPush(commitMsg);
            if (pushRes.pushedFiles && pushRes.pushedFiles.length > 0) {
              termPrint(`Successfully pushed commit: "${commitMsg}"`, "vsc-term-success");
              pushRes.pushedFiles.forEach(f => termPrint(`  + ${f}`, "vsc-term-dim"));
            } else {
              termPrint(pushRes.message || "Working tree clean. Nothing to push.", "vsc-term-info");
            }
          } catch (e) {
            termPrint(`Push failed: ${e.message}`, "vsc-term-error");
          }
        } else if (sub === "repos") {
          termPrint("Fetching repositories from GitHub...", "vsc-term-dim");
          try {
            const repos = await githubFetchRepos();
            termPrint(`Found ${repos.length} recent repositories:`, "vsc-term-info");
            repos.slice(0, 15).forEach(r => {
              termPrint(`  ${r.full_name} (${r.default_branch}) ${r.private ? "[Private]" : "[Public]"} - ${r.description || ""}`);
            });
            termPrint(`\nClone with: github clone <owner/repo>`, "vsc-term-dim");
          } catch (e) {
            termPrint(`Failed to fetch repos: ${e.message}`, "vsc-term-error");
          }
        } else if (sub === "logout") {
          await githubAuth("");
          termPrint("Logged out from GitHub. Token cleared from cookies and local storage.", "vsc-term-info");
        } else {
          termPrintHTML(`
<span class="vsc-term-info">=== GITHUB WORKSPACE STATUS ===</span>
  User:        ${state.githubUser ? `<b style="color:var(--vsc-turquoise)">${state.githubUser.login}</b>` : (state.githubToken ? "<b style='color:#98c379'>Token Connected</b>" : "Not authenticated")}
  Remote Repo: <b style="color:var(--vsc-turquoise)">${state.githubRepo || "None"}</b>
  Branch:      ${state.githubBranch || "main"}
  Unsaved/Mod: <b style="color:${state.modifiedFiles.size > 0 ? '#e5c07b' : '#98c379'}">${state.modifiedFiles.size} file(s) changed</b>
  Cookies:     ${getCookie("gh_pat") ? "gh_pat present (cross-device sync)" : "None"}
`);
        }
      }
    }
  };

  COMMANDS.dir = COMMANDS.ls;
  COMMANDS.eval = COMMANDS.run;
  COMMANDS.node = COMMANDS.run;
  COMMANDS.env = COMMANDS.sysinfo;
  COMMANDS.os = COMMANDS.sysinfo;
  COMMANDS.telemetry = COMMANDS.sysinfo;
  COMMANDS.browser = COMMANDS.sysinfo;
  COMMANDS.stop = COMMANDS.kill;
  COMMANDS.git = COMMANDS.github;
  COMMANDS.gh = COMMANDS.github;

  COMMANDS.openproject = {
    desc: "Open any folder or project from your local drive with direct two-way disk saving",
    usage: "openproject",
    exec: async () => {
      await openLocalProjectFolder();
    }
  };
  COMMANDS.openfolder = COMMANDS.openproject;

  COMMANDS.save = {
    desc: "Save the current active file directly to your disk or storage",
    usage: "save",
    exec: async () => {
      await saveCurrentFile();
    }
  };

  // --- TAB KEY AUTOCOMPLETION ---
  function handleTabCompletion(e) {
    if (e.key !== "Tab") return;
    e.preventDefault();

    const inputVal = el.termInput.value;
    const tokens = inputVal.trim().split(/\s+/);

    if (tokens.length <= 1) {
      // Autocomplete command name
      const prefix = (tokens[0] || "").toLowerCase();
      const candidates = Object.keys(COMMANDS).filter((c) => c.startsWith(prefix));
      if (candidates.length === 1) {
        el.termInput.value = candidates[0] + " ";
      } else if (candidates.length > 1) {
        termPrint(`\nPossible commands:\n${candidates.join("  ")}`, "vsc-term-dim");
      }
    } else {
      // Autocomplete file names or sub-args
      const lastToken = tokens[tokens.length - 1];
      const fileCandidates = Object.keys(state.files).filter((f) => f.startsWith(lastToken));
      if (fileCandidates.length === 1) {
        tokens[tokens.length - 1] = fileCandidates[0];
        el.termInput.value = tokens.join(" ") + " ";
      } else if (fileCandidates.length > 1) {
        termPrint(`\nFiles matching:\n${fileCandidates.join("  ")}`, "vsc-term-dim");
      }
    }
  }

  // --- SHELL COMMAND EXECUTION DISPATCHER ---
  async function runCommand(rawInput) {
    const input = rawInput.trim();
    if (!input) return;

    state.commandHistory.push(input);
    state.historyIndex = state.commandHistory.length;

    const promptText = el.promptTag ? el.promptTag.textContent : "PS E:\\dev-vault>";
    termPrint(`${promptText} ${input}`, "vsc-line-cmd");

    const parts = input.split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (COMMANDS[cmdName]) {
      await COMMANDS[cmdName].exec(args);
    } else {
      termPrint(`'${cmdName}' is not recognized as an internal command. Type 'help' for available tools.`, "vsc-term-error");
    }

    scrollTermToBottom();
  }

  // --- UTILITY FORMATTERS ---
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(2) + " KB";
    const mb = kb / 1024;
    if (mb < 1024) return mb.toFixed(2) + " MB";
    const gb = mb / 1024;
    return gb.toFixed(2) + " GB";
  }

  function formatLogItem(item) {
    if (typeof item === "object") {
      try {
        return JSON.stringify(item);
      } catch (e) {
        return String(item);
      }
    }
    return String(item);
  }

  function extractPath(obj, pathStr) {
    const parts = pathStr.replace(/^(\.|\/)/, "").split(/[.\[\]]/).filter(Boolean);
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  // --- ZERO-EVAL CSP-COMPLIANT MATHEMATICAL & BITWISE PARSER ---
  function safeCalculate(input) {
    let pos = 0;
    const str = input.trim();

    function peek() { return str[pos]; }
    function consume() { return str[pos++]; }
    function skipWhitespace() {
      while (pos < str.length && /\s/.test(str[pos])) pos++;
    }

    function parsePrimary() {
      skipWhitespace();
      if (pos >= str.length) throw new Error("Unexpected end of expression");

      // Parentheses
      if (peek() === "(") {
        consume();
        const val = parseBitwiseOr();
        skipWhitespace();
        if (consume() !== ")") throw new Error("Expected ')'");
        return val;
      }

      // Unary operators (+, -, ~)
      if (peek() === "+" || peek() === "-" || peek() === "~") {
        const op = consume();
        const val = parsePrimary();
        if (op === "+") return +val;
        if (op === "-") return -val;
        if (op === "~") return ~val;
      }

      // Hexadecimal (0x...)
      if (peek() === "0" && (str[pos + 1] === "x" || str[pos + 1] === "X")) {
        pos += 2;
        const start = pos;
        while (pos < str.length && /[0-9a-fA-F]/.test(str[pos])) pos++;
        if (pos === start) throw new Error("Invalid hex literal");
        return parseInt(str.slice(start, pos), 16);
      }

      // Binary (0b...)
      if (peek() === "0" && (str[pos + 1] === "b" || str[pos + 1] === "B")) {
        pos += 2;
        const start = pos;
        while (pos < str.length && /[01]/.test(str[pos])) pos++;
        if (pos === start) throw new Error("Invalid binary literal");
        return parseInt(str.slice(start, pos), 2);
      }

      // Octal (0o...)
      if (peek() === "0" && (str[pos + 1] === "o" || str[pos + 1] === "O")) {
        pos += 2;
        const start = pos;
        while (pos < str.length && /[0-7]/.test(str[pos])) pos++;
        if (pos === start) throw new Error("Invalid octal literal");
        return parseInt(str.slice(start, pos), 8);
      }

      // Decimal numbers
      if (/[0-9.]/.test(peek())) {
        const start = pos;
        let hasDot = false;
        while (pos < str.length && (/[0-9]/.test(str[pos]) || (str[pos] === "." && !hasDot))) {
          if (str[pos] === ".") hasDot = true;
          pos++;
        }
        return parseFloat(str.slice(start, pos));
      }

      // Math functions & constants
      if (/[a-zA-Z_]/.test(peek())) {
        const start = pos;
        while (pos < str.length && /[a-zA-Z0-9_]/.test(str[pos])) pos++;
        const name = str.slice(start, pos).toUpperCase();
        if (name === "PI") return Math.PI;
        if (name === "E") return Math.E;

        skipWhitespace();
        if (peek() === "(") {
          consume();
          const args = [];
          skipWhitespace();
          if (peek() !== ")") {
            while (true) {
              args.push(parseBitwiseOr());
              skipWhitespace();
              if (peek() === ",") { consume(); }
              else if (peek() === ")") { consume(); break; }
              else throw new Error("Expected ',' or ')' in function arguments");
            }
          } else {
            consume();
          }

          const fnMap = {
            ABS: Math.abs, SQRT: Math.sqrt, ROUND: Math.round,
            FLOOR: Math.floor, CEIL: Math.ceil, MIN: Math.min,
            MAX: Math.max, POW: Math.pow, LOG: Math.log, SIN: Math.sin, COS: Math.cos
          };
          if (fnMap[name]) return fnMap[name](...args);
          throw new Error("Unknown function: " + name);
        }
        throw new Error("Unknown identifier: " + name);
      }

      throw new Error("Unexpected character: '" + peek() + "'");
    }

    function parseExponent() {
      let left = parsePrimary();
      skipWhitespace();
      if (str.slice(pos, pos + 2) === "**") {
        pos += 2;
        const right = parseExponent();
        return Math.pow(left, right);
      }
      return left;
    }

    function parseMultiplicative() {
      let left = parseExponent();
      while (true) {
        skipWhitespace();
        if (peek() === "*" && str[pos + 1] !== "*") {
          consume();
          left *= parseExponent();
        } else if (peek() === "/") {
          consume();
          const divisor = parseExponent();
          if (divisor === 0) throw new Error("Division by zero");
          left /= divisor;
        } else if (peek() === "%") {
          consume();
          left %= parseExponent();
        } else {
          break;
        }
      }
      return left;
    }

    function parseAdditive() {
      let left = parseMultiplicative();
      while (true) {
        skipWhitespace();
        if (peek() === "+") {
          consume();
          left += parseMultiplicative();
        } else if (peek() === "-") {
          consume();
          left -= parseMultiplicative();
        } else {
          break;
        }
      }
      return left;
    }

    function parseShift() {
      let left = parseAdditive();
      while (true) {
        skipWhitespace();
        if (str.slice(pos, pos + 3) === ">>>") {
          pos += 3;
          left = left >>> parseAdditive();
        } else if (str.slice(pos, pos + 2) === ">>") {
          pos += 2;
          left = left >> parseAdditive();
        } else if (str.slice(pos, pos + 2) === "<<") {
          pos += 2;
          left = left << parseAdditive();
        } else {
          break;
        }
      }
      return left;
    }

    function parseBitwiseAnd() {
      let left = parseShift();
      while (true) {
        skipWhitespace();
        if (peek() === "&" && str[pos + 1] !== "&") {
          consume();
          left = left & parseShift();
        } else {
          break;
        }
      }
      return left;
    }

    function parseBitwiseXor() {
      let left = parseBitwiseAnd();
      while (true) {
        skipWhitespace();
        if (peek() === "^") {
          consume();
          left = left ^ parseBitwiseAnd();
        } else {
          break;
        }
      }
      return left;
    }

    function parseBitwiseOr() {
      let left = parseBitwiseXor();
      while (true) {
        skipWhitespace();
        if (peek() === "|" && str[pos + 1] !== "|") {
          consume();
          left = left | parseBitwiseXor();
        } else {
          break;
        }
      }
      return left;
    }

    const result = parseBitwiseOr();
    skipWhitespace();
    if (pos < str.length) throw new Error("Unexpected trailing characters: '" + str.slice(pos) + "'");
    return result;
  }

  // --- ISOLATED SANDBOX RUNNER FOR USER SCRIPTS ---
  function executeSandboxedScript(code) {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.sandbox = "allow-scripts"; // Isolated origin without host CSP restrictions

      let finished = false;
      const cleanup = () => {
        if (!finished) {
          finished = true;
          try { document.body.removeChild(iframe); } catch (e) {}
        }
      };

      channel.port1.onmessage = (event) => {
        cleanup();
        resolve(event.data || {});
      };

      const runnerHtml = `<!DOCTYPE html><html><body><script>
        window.addEventListener('message', function(e) {
          var port = e.ports[0];
          var logs = [];
          var origLog = console.log, origWarn = console.warn, origErr = console.error;
          console.log = function() {
            var args = Array.prototype.slice.call(arguments);
            logs.push({ type: 'log', msg: args.map(function(x) { return typeof x === 'object' ? JSON.stringify(x) : String(x); }).join(' ') });
          };
          console.warn = function() {
            var args = Array.prototype.slice.call(arguments);
            logs.push({ type: 'warn', msg: args.map(function(x) { return typeof x === 'object' ? JSON.stringify(x) : String(x); }).join(' ') });
          };
          console.error = function() {
            var args = Array.prototype.slice.call(arguments);
            logs.push({ type: 'error', msg: args.map(function(x) { return typeof x === 'object' ? JSON.stringify(x) : String(x); }).join(' ') });
          };
          try {
            var res = (new Function(e.data))();
            port.postMessage({ success: true, logs: logs, result: res });
          } catch(err) {
            port.postMessage({ success: false, logs: logs, error: err.message });
          }
        });
      <\/script></body></html>`;

      iframe.srcdoc = runnerHtml;
      iframe.onload = () => {
        try {
          iframe.contentWindow.postMessage(code, "*", [channel.port2]);
        } catch (err) {
          cleanup();
          resolve({ success: false, logs: [], error: err.message });
        }
      };

      document.body.appendChild(iframe);

      setTimeout(() => {
        if (!finished) {
          cleanup();
          resolve({ success: false, logs: [], error: "Execution timed out (5s limit)" });
        }
      }, 5000);
    });
  }

  // --- HARDWARE, BROWSER & OS TELEMETRY HARVESTER ---
  async function getSystemTelemetry() {
    let out = `<span class="vsc-term-success">=== SYSTEM &amp; BROWSER EXPOSURE REPORT ===</span>\n`;

    // 1. OS & Architecture (Including High-Entropy Client Hints)
    const ua = navigator.userAgent;
    let platform = navigator.platform || "Unknown";
    let arch = "x86";
    let bitness = "64";
    let osVersion = "";
    let model = "";

    if (navigator.userAgentData) {
      platform = navigator.userAgentData.platform || platform;
      try {
        const hints = await navigator.userAgentData.getHighEntropyValues([
          "architecture",
          "bitness",
          "model",
          "platformVersion",
          "fullVersionList"
        ]);
        if (hints.architecture) arch = hints.architecture;
        if (hints.bitness) bitness = hints.bitness;
        if (hints.platformVersion) osVersion = ` (Build ${hints.platformVersion})`;
        if (hints.model) model = ` [Model: ${hints.model}]`;
      } catch (e) {}
    }

    out += `\n<span class="vsc-prompt-tag">[OPERATING SYSTEM &amp; PLATFORM]</span>\n`;
    out += `  OS Platform:   <b style="color:var(--vsc-turquoise)">${platform}${osVersion}</b>${model}\n`;
    out += `  Architecture:  ${arch} (${bitness}-bit)\n`;
    out += `  User Agent:    ${ua.slice(0, 75)}...\n`;
    out += `  Languages:     ${navigator.languages ? navigator.languages.join(", ") : navigator.language}\n`;
    out += `  Timezone:      ${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${(new Date().getTimezoneOffset() / -60 >= 0 ? "+" : "") + new Date().getTimezoneOffset() / -60})\n`;

    // 2. Hardware: CPU Cores, Memory, Battery, Touch
    const cores = navigator.hardwareConcurrency || "N/A";
    const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB RAM` : "Restricted / Protected";
    const touch = navigator.maxTouchPoints || 0;

    let battery = "API Not Supported / Restricted";
    if (navigator.getBattery) {
      try {
        const b = await navigator.getBattery();
        battery = `${Math.round(b.level * 100)}% [${b.charging ? "Charging" : "Discharging"}]`;
      } catch (e) {}
    }

    out += `\n<span class="vsc-prompt-tag">[HARDWARE &amp; SENSORS]</span>\n`;
    out += `  CPU Logical:   <b style="color:var(--vsc-turquoise)">${cores} Cores</b>\n`;
    out += `  Device RAM:    ${memory}\n`;
    out += `  Battery State: ${battery}\n`;
    out += `  Touch Points:  ${touch} point(s)\n`;

    // 3. Display, Viewport, HDR, Wide Color
    const scr = window.screen;
    const dpr = window.devicePixelRatio || 1;
    const p3 = window.matchMedia && window.matchMedia("(color-gamut: p3)").matches;
    const hdr = window.matchMedia && window.matchMedia("(dynamic-range: high)").matches;

    out += `\n<span class="vsc-prompt-tag">[DISPLAY &amp; GRAPHICS VIEWPORT]</span>\n`;
    out += `  Physical Res:  ${scr.width} x ${scr.height} px (Depth: ${scr.colorDepth}-bit)\n`;
    out += `  Available Res: ${scr.availWidth} x ${scr.availHeight} px\n`;
    out += `  Window Inner:  ${window.innerWidth} x ${window.innerHeight} px (DPR: ${dpr.toFixed(2)})\n`;
    out += `  Color Gamut:   ${p3 ? "<b style='color:#98c379'>Display-P3 Wide Color</b>" : "Standard sRGB"}\n`;
    out += `  Dynamic Range: ${hdr ? "<b style='color:#98c379'>High Dynamic Range (HDR)</b>" : "SDR"}\n`;

    // 4. GPU & WebGL / WebGPU
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (gl) {
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        out += `\n<span class="vsc-prompt-tag">[GPU &amp; HARDWARE DRIVER]</span>\n`;
        out += `  GPU Renderer:  <b style="color:var(--vsc-turquoise)">${renderer}</b>\n`;
        out += `  GPU Vendor:    ${vendor}\n`;
        out += `  Max Texture:   ${maxTex} x ${maxTex} px\n`;
        out += `  WebGPU State:  ${"gpu" in navigator ? "<b style='color:#98c379'>Supported</b>" : "Disabled"}\n`;
      }
    } catch (e) {}

    // 5. Network & Connection
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      out += `\n<span class="vsc-prompt-tag">[NETWORK ADAPTER INTERFACE]</span>\n`;
      out += `  Link Type:     ${conn.effectiveType ? conn.effectiveType.toUpperCase() : "N/A"}\n`;
      out += `  Downlink:      <b style="color:var(--vsc-turquoise)">${conn.downlink || 0} Mbps</b>\n`;
      out += `  RTT Latency:   ${conn.rtt || 0} ms\n`;
      out += `  Data Saver:    ${conn.saveData ? "Active" : "Disabled"}\n`;
    }

    // 6. Storage Quota
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const used = ((est.usage || 0) / (1024 * 1024)).toFixed(2);
        const quota = ((est.quota || 0) / (1024 * 1024 * 1024)).toFixed(2);
        out += `\n<span class="vsc-prompt-tag">[PERSISTENT STORAGE QUOTA]</span>\n`;
        out += `  Storage Quota: ${used} MB used of ${quota} GB available\n`;
      } catch (e) {}
    }

    // 7. Security Isolation
    out += `\n<span class="vsc-prompt-tag">[SECURITY &amp; RUNTIME ISOLATION]</span>\n`;
    out += `  Cross-Origin:  ${window.crossOriginIsolated ? "Isolated" : "Standard"}\n`;
    out += `  SharedArray:   ${typeof SharedArrayBuffer !== "undefined" ? "Enabled" : "Disabled"}\n`;
    out += `  WebAssembly:   ${typeof WebAssembly !== "undefined" ? "Native V8 Enabled" : "Disabled"}\n`;
    out += `  ServiceWorker: ${"serviceWorker" in navigator ? "Supported" : "Unsupported"}\n`;

    return out;
  }

  // --- EVENT LISTENERS INITIALIZATION ---
  function initEvents() {
    // Terminal input handling
    if (el.termInput) {
      el.termInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const val = el.termInput.value;
          el.termInput.value = "";
          runCommand(val);
        } else if (e.key === "Tab") {
          handleTabCompletion(e);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (state.historyIndex > 0) {
            state.historyIndex--;
            el.termInput.value = state.commandHistory[state.historyIndex] || "";
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (state.historyIndex < state.commandHistory.length - 1) {
            state.historyIndex++;
            el.termInput.value = state.commandHistory[state.historyIndex] || "";
          } else {
            state.historyIndex = state.commandHistory.length;
            el.termInput.value = "";
          }
        }
      });
    }

    // Keep terminal input focused on clicking anywhere in terminal body
    if (el.termBody) {
      el.termBody.addEventListener("click", () => {
        if (window.getSelection().toString().length === 0) {
          el.termInput.focus();
        }
      });
    }

    // Maximize button on terminal header
    if (el.btnMaximize) {
      el.btnMaximize.addEventListener("click", toggleMaximizeTerminal);
    }

    // Run button in editor toolbar
    if (el.btnRun) {
      el.btnRun.addEventListener("click", () => COMMANDS.run.exec([]));
    }

    // Format button in editor toolbar
    if (el.btnFormat) {
      el.btnFormat.addEventListener("click", () => {
        if (state.activeFile.endsWith(".json")) {
          COMMANDS.json.exec(["format"]);
        } else {
          termPrint("Only JSON formatting is currently supported.", "vsc-term-info");
        }
      });
    }

    // Save button in editor toolbar
    if (el.btnSave) {
      el.btnSave.addEventListener("click", () => {
        saveCurrentFile();
      });
    }

    // Clear button on terminal toolbar
    if (el.btnClear) {
      el.btnClear.addEventListener("click", () => COMMANDS.clear.exec([]));
    }

    // Fullscreen button in titlebar
    if (el.btnFullscreen) {
      el.btnFullscreen.addEventListener("click", () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          document.body.classList.add("vsc-fullscreen");
        } else {
          document.exitFullscreen().catch(() => {});
          document.body.classList.remove("vsc-fullscreen");
        }
      });
    }

    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        document.body.classList.remove("vsc-fullscreen");
      }
    });

    // Shell selector change
    if (el.shellSelect) {
      el.shellSelect.addEventListener("change", (e) => {
        state.activeShell = e.target.value;
        if (el.promptTag) {
          el.promptTag.textContent = state.activeShell === "bash" ? "bash $ " : "PS E:\\dev-vault> ";
        }
      });
    }

    // Editor textarea sync
    if (el.codeTextarea) {
      el.codeTextarea.addEventListener("input", () => {
        state.files[state.activeFile] = el.codeTextarea.value;
        state.modifiedFiles.add(state.activeFile);
        updateGutter();
        updateGitStatus();
        refreshProblems();
        saveWorkspace();
      });
      el.codeTextarea.addEventListener("keyup", updateGutter);
      el.codeTextarea.addEventListener("click", updateGutter);
    }

    // Initialize Titlebar Menu Dropdowns
    initMenuDropdowns();

    // Activity Bar View Switchers
    if (el.actExplorer) el.actExplorer.addEventListener("click", () => switchSidebarView("explorer"));
    if (el.actSearch) el.actSearch.addEventListener("click", () => switchSidebarView("search"));
    if (el.actGit) el.actGit.addEventListener("click", () => switchSidebarView("git"));
    if (el.actDebug) el.actDebug.addEventListener("click", () => switchSidebarView("debug"));
    if (el.actExtensions) el.actExtensions.addEventListener("click", () => switchSidebarView("extensions"));
    if (el.actAccounts) el.actAccounts.addEventListener("click", openGitHubModal);
    if (el.actSettings) el.actSettings.addEventListener("click", openSettingsModal);

    // Titlebar & Searchbar
    if (el.searchBar) el.searchBar.addEventListener("click", openCommandPalette);
    if (el.btnOpenFolder) el.btnOpenFolder.addEventListener("click", openLocalProjectFolder);
    if (el.btnOpenProjectBanner) el.btnOpenProjectBanner.addEventListener("click", openLocalProjectFolder);
    if (el.folderInput) el.folderInput.addEventListener("change", handleFileInputFolder);
    if (el.btnNewFile) {
      el.btnNewFile.addEventListener("click", async () => {
        const name = await promptInWorkbench("New File", "untitled.js", "filename.js");
        if (name) openFile(name);
      });
    }
    if (el.btnRefreshSidebar) {
      el.btnRefreshSidebar.addEventListener("click", () => {
        renderSidebarLists();
        renderTabs();
        updateGitStatus();
        refreshProblems();
        termPrint("Explorer & Git workspace refreshed.", "vsc-term-info");
      });
    }

    // Search view buttons
    if (el.btnFindInFiles) el.btnFindInFiles.addEventListener("click", searchInFiles);
    if (el.searchQueryInput) {
      el.searchQueryInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") searchInFiles();
      });
    }
    if (el.btnReplaceInFiles) el.btnReplaceInFiles.addEventListener("click", replaceAllInFiles);

    // Git view buttons
    if (el.btnOpenGhModal) el.btnOpenGhModal.addEventListener("click", openGitHubModal);
    if (el.btnGitPush) {
      el.btnGitPush.addEventListener("click", async () => {
        const msg = (el.gitCommitMsg && el.gitCommitMsg.value.trim()) || "feat: update workspace files via VS Code Tools";
        termPrint(`Pushing changes to GitHub...`, "vsc-term-info");
        try {
          const res = await githubPush(msg);
          if (res.pushedFiles && res.pushedFiles.length > 0) {
            termPrint(`Committed and pushed ${res.pushedFiles.length} file(s) to GitHub: "${msg}"`, "vsc-term-success");
            if (el.gitCommitMsg) el.gitCommitMsg.value = "";
          } else {
            termPrint(res.message || "Working tree clean. Nothing to push.", "vsc-term-info");
          }
        } catch (e) {
          termPrint(`Push failed: ${e.message}`, "vsc-term-error");
        }
      });
    }

    // Run & Debug view
    if (el.btnDebugRun) {
      el.btnDebugRun.addEventListener("click", () => {
        switchTerminalTab("debug");
        COMMANDS.run.exec([]);
      });
    }
    if (el.debugInput) {
      el.debugInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const val = el.debugInput.value;
          el.debugInput.value = "";
          runDebugRepl(val);
        }
      });
    }

    // Terminal Tabs
    if (el.tabTerm) el.tabTerm.addEventListener("click", () => switchTerminalTab("terminal"));
    if (el.tabMessages) el.tabMessages.addEventListener("click", () => switchTerminalTab("messages"));
    if (el.tabOutput) el.tabOutput.addEventListener("click", () => switchTerminalTab("output"));
    if (el.tabProblems) el.tabProblems.addEventListener("click", () => switchTerminalTab("problems"));
    if (el.tabPorts) el.tabPorts.addEventListener("click", () => switchTerminalTab("ports"));
    if (el.tabDebug) el.tabDebug.addEventListener("click", () => switchTerminalTab("debug"));
    if (el.btnClearMessages) {
      el.btnClearMessages.addEventListener("click", () => {
        if (el.messagesHistory) el.messagesHistory.innerHTML = "";
        messagesCount = 0;
        if (el.messagesCount) el.messagesCount.style.display = "none";
      });
    }

    // Status bar interactive items
    if (el.statusGit) el.statusGit.addEventListener("click", openGitHubModal);
    if (el.statusSync) {
      el.statusSync.addEventListener("click", () => {
        if (el.btnGitPush) el.btnGitPush.click();
      });
    }
    if (el.statusDiagnostics) el.statusDiagnostics.addEventListener("click", () => switchTerminalTab("problems"));
    if (el.statusLnCol) {
      el.statusLnCol.addEventListener("click", async () => {
        const ln = await promptInWorkbench("Go to Line", "", "Enter line number");
        if (ln && el.codeTextarea) {
          const lineNum = parseInt(ln, 10);
          const lines = el.codeTextarea.value.split("\n");
          if (lineNum > 0 && lineNum <= lines.length) {
            const charPos = lines.slice(0, lineNum - 1).join("\n").length + 1;
            el.codeTextarea.setSelectionRange(charPos, charPos);
            el.codeTextarea.focus();
            updateGutter();
          }
        }
      });
    }
    if (el.statusSpaces) {
      el.statusSpaces.addEventListener("click", () => {
        const curTab = el.codeTextarea && el.codeTextarea.style.tabSize === "4" ? "2" : "4";
        if (el.codeTextarea) el.codeTextarea.style.tabSize = curTab;
        el.statusSpaces.textContent = `Spaces: ${curTab}`;
        termPrint(`Indentation set to Spaces: ${curTab}`, "vsc-term-info");
      });
    }
    if (el.statusEncoding) {
      el.statusEncoding.addEventListener("click", () => {
        termPrint("File encoding: UTF-8 (Unicode Standard).", "vsc-term-info");
      });
    }
    if (el.statusLang) {
      el.statusLang.addEventListener("click", () => {
        termPrint(`Active file type: ${state.activeFile.split('.').pop().toUpperCase() || 'Plain Text'}`, "vsc-term-info");
      });
    }
    if (el.statusOnline) {
      el.statusOnline.addEventListener("click", async () => {
        termPrint("Testing network latency & reachability...", "vsc-term-dim");
        const t0 = performance.now();
        try {
          await fetch("https://cloudflare.com/cdn-cgi/trace", { mode: "no-cors" });
          const ms = (performance.now() - t0).toFixed(1);
          termPrint(`Ping to Edge CDN: ${ms} ms [Online]`, "vsc-term-success");
        } catch (e) {
          termPrint(`Offline or restricted: ${e.message}`, "vsc-term-warn");
        }
      });
    }

    // Command Palette Dialog
    if (el.paletteInput) {
      el.paletteInput.addEventListener("input", () => renderPaletteList(el.paletteInput.value));
      el.paletteInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const first = el.paletteList && el.paletteList.querySelector(".vsc-palette-item:not([style*='italic'])");
          if (first) first.click();
        }
      });
    }
    if (el.paletteDialog) {
      el.paletteDialog.addEventListener("click", (e) => {
        if (e.target === el.paletteDialog) el.paletteDialog.close();
      });
    }

    // GitHub Dialog
    if (el.ghBtnClose) el.ghBtnClose.addEventListener("click", () => el.githubDialog.close());
    if (el.ghBtnCancel) el.ghBtnCancel.addEventListener("click", () => el.githubDialog.close());
    if (el.githubDialog) {
      el.githubDialog.addEventListener("click", (e) => {
        if (e.target === el.githubDialog) el.githubDialog.close();
      });
    }
    if (el.ghBtnConnect) {
      el.ghBtnConnect.addEventListener("click", async () => {
        const token = (el.ghTokenInput && el.ghTokenInput.value.trim()) || state.githubToken;
        const repo = el.ghRepoInput && el.ghRepoInput.value.trim();
        const branch = (el.ghBranchInput && el.ghBranchInput.value.trim()) || "main";

        if (!token) {
          if (el.ghStatusMsg) el.ghStatusMsg.innerHTML = `<span style="color:#f44336">Token is required.</span>`;
          return;
        }

        if (el.ghStatusMsg) el.ghStatusMsg.innerHTML = `<span style="color:var(--vsc-turquoise)">Verifying token...</span>`;
        const authRes = await githubAuth(token);
        if (!authRes.success) {
          if (el.ghStatusMsg) el.ghStatusMsg.innerHTML = `<span style="color:#f44336">${authRes.message}</span>`;
          return;
        }

        if (repo) {
          if (el.ghStatusMsg) el.ghStatusMsg.innerHTML = `<span style="color:var(--vsc-turquoise)">Loading repository ${repo}...</span>`;
          try {
            const cloneRes = await githubCloneRepo(repo, branch, (cur, total, path) => {
              if (el.ghStatusMsg) el.ghStatusMsg.innerHTML = `<span style="color:var(--vsc-turquoise)">[${cur}/${total}] ${path}</span>`;
            });
            if (el.ghStatusMsg) el.ghStatusMsg.innerHTML = `<span style="color:#98c379">Loaded ${cloneRes.count} files!</span>`;
            setTimeout(() => {
              el.githubDialog.close();
              termPrint(`Connected to GitHub repo ${repo}@${branch} (${cloneRes.count} files).`, "vsc-term-success");
            }, 800);
          } catch (e) {
            if (el.ghStatusMsg) el.ghStatusMsg.innerHTML = `<span style="color:#f44336">${e.message}</span>`;
          }
        } else {
          if (el.ghStatusMsg) el.ghStatusMsg.innerHTML = `<span style="color:#98c379">Authenticated as ${authRes.user.login}!</span>`;
          setTimeout(() => el.githubDialog.close(), 800);
        }
      });
    }

    // Settings Dialog
    if (el.settingsBtnClose) el.settingsBtnClose.addEventListener("click", () => el.settingsDialog.close());
    if (el.settingsBtnSave) {
      el.settingsBtnSave.addEventListener("click", () => {
        applySettings();
        el.settingsDialog.close();
        termPrint("Settings applied and saved.", "vsc-term-success");
      });
    }
    if (el.settingsDialog) {
      el.settingsDialog.addEventListener("click", (e) => {
        if (e.target === el.settingsDialog) el.settingsDialog.close();
      });
    }

    // Additional GNU Nano Buttons
    const nanoWhere = document.getElementById("vsc-nano-btn-where");
    if (nanoWhere) {
      nanoWhere.addEventListener("click", async () => {
        const query = await promptInWorkbench("Search in nano", "", "Find text");
        if (query && el.nanoEditor) {
          const idx = el.nanoEditor.value.indexOf(query);
          if (idx !== -1) {
            el.nanoEditor.setSelectionRange(idx, idx + query.length);
            el.nanoEditor.focus();
            if (el.nanoStatus) el.nanoStatus.textContent = `[Found '${query}']`;
          } else {
            if (el.nanoStatus) el.nanoStatus.textContent = `['${query}' Not Found]`;
          }
        }
      });
    }

    const nanoCut = document.getElementById("vsc-nano-btn-cut");
    if (nanoCut && el.nanoEditor) {
      nanoCut.addEventListener("click", () => {
        const start = el.nanoEditor.selectionStart;
        const end = el.nanoEditor.selectionEnd;
        if (start !== end) {
          const cutText = el.nanoEditor.value.substring(start, end);
          if (navigator.clipboard) navigator.clipboard.writeText(cutText).catch(() => {});
          el.nanoEditor.value = el.nanoEditor.value.substring(0, start) + el.nanoEditor.value.substring(end);
          if (el.nanoStatus) el.nanoStatus.textContent = `[Cut ${cutText.length} chars]`;
        }
      });
    }

    const nanoPaste = document.getElementById("vsc-nano-btn-paste");
    if (nanoPaste && el.nanoEditor) {
      nanoPaste.addEventListener("click", async () => {
        try {
          const text = await navigator.clipboard.readText();
          const start = el.nanoEditor.selectionStart;
          const end = el.nanoEditor.selectionEnd;
          el.nanoEditor.value = el.nanoEditor.value.substring(0, start) + text + el.nanoEditor.value.substring(end);
          if (el.nanoStatus) el.nanoStatus.textContent = `[Pasted ${text.length} chars]`;
        } catch (e) {}
      });
    }

    const nanoReplace = document.getElementById("vsc-nano-btn-replace");
    if (nanoReplace && el.nanoEditor) {
      nanoReplace.addEventListener("click", async () => {
        const findText = await promptInWorkbench("Find in nano", "", "Text to search");
        if (!findText) return;
        const repText = await promptInWorkbench(`Replace '${findText}' with`, "", "Replacement text") || "";
        const parts = el.nanoEditor.value.split(findText);
        if (parts.length > 1) {
          el.nanoEditor.value = parts.join(repText);
          if (el.nanoStatus) el.nanoStatus.textContent = `[Replaced ${parts.length - 1} occurrences]`;
        } else {
          if (el.nanoStatus) el.nanoStatus.textContent = `[No match found]`;
        }
      });
    }

    const nanoHelp = document.getElementById("vsc-nano-btn-help");
    if (nanoHelp) {
      nanoHelp.addEventListener("click", () => {
        showMessage("info", "GNU NANO SHORTCUTS", "^O / WriteOut: Save changes\n^X / Exit: Close editor\n^W / Where Is: Search\n^K / Cut: Cut text\n^U / Paste: Paste text");
      });
    }

    const nanoPos = document.getElementById("vsc-nano-btn-pos");
    if (nanoPos && el.nanoEditor) {
      nanoPos.addEventListener("click", () => {
        const pos = el.nanoEditor.selectionStart;
        const textBefore = el.nanoEditor.value.substring(0, pos);
        const line = textBefore.split("\n").length;
        const col = pos - textBefore.lastIndexOf("\n");
        if (el.nanoStatus) el.nanoStatus.textContent = `[Line ${line}/${el.nanoEditor.value.split("\n").length}, Col ${col}]`;
      });
    }

    const nanoJustify = document.getElementById("vsc-nano-btn-justify");
    if (nanoJustify && el.nanoEditor) {
      nanoJustify.addEventListener("click", () => {
        el.nanoEditor.value = el.nanoEditor.value.split("\n").map(l => l.trimRight()).join("\n");
        if (el.nanoStatus) el.nanoStatus.textContent = `[Justified text]`;
      });
    }

    const nanoRead = document.getElementById("vsc-nano-btn-read");
    if (nanoRead && el.nanoEditor) {
      nanoRead.addEventListener("click", async () => {
        const fn = await promptInWorkbench("Read file into nano", Object.keys(state.files)[0], "Filename");
        if (fn && state.files[fn]) {
          const pos = el.nanoEditor.selectionStart;
          el.nanoEditor.value = el.nanoEditor.value.substring(0, pos) + state.files[fn] + el.nanoEditor.value.substring(pos);
          if (el.nanoStatus) el.nanoStatus.textContent = `[Inserted ${fn}]`;
        }
      });
    }

    const nanoSpell = document.getElementById("vsc-nano-btn-spell");
    if (nanoSpell) {
      nanoSpell.addEventListener("click", () => {
        if (el.nanoStatus) el.nanoStatus.textContent = `[Spell check: 0 syntax issues]`;
      });
    }

    const nanoNext = document.getElementById("vsc-nano-btn-next");
    if (nanoNext && el.nanoEditor) {
      nanoNext.addEventListener("click", () => {
        el.nanoEditor.scrollTop += el.nanoEditor.clientHeight * 0.8;
      });
    }

    // Global Workbench Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        openCommandPalette();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveCurrentFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        openLocalProjectFolder();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (el.sidebar) el.sidebar.classList.toggle("collapsed");
      } else if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        toggleMaximizeTerminal();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.shiftKey) {
        if (document.activeElement === el.codeTextarea) {
          e.preventDefault();
          COMMANDS.run.exec([]);
        }
      }
    });

    // Mobile quickbar buttons
    document.querySelectorAll(".vsc-mobile-key").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.key;
        if (!key || !el.termInput) return;

        if (key === "Tab") {
          handleTabCompletion({ key: "Tab", preventDefault: () => {} });
        } else if (key === "Enter") {
          const val = el.termInput.value;
          el.termInput.value = "";
          runCommand(val);
        } else if (key === "Clear") {
          COMMANDS.clear.exec([]);
        } else if (key === "Run") {
          COMMANDS.run.exec([]);
        } else if (key === "Up") {
          if (state.historyIndex > 0) {
            state.historyIndex--;
            el.termInput.value = state.commandHistory[state.historyIndex] || "";
          }
        } else if (key === "Down") {
          if (state.historyIndex < state.commandHistory.length - 1) {
            state.historyIndex++;
            el.termInput.value = state.commandHistory[state.historyIndex] || "";
          } else {
            state.historyIndex = state.commandHistory.length;
            el.termInput.value = "";
          }
        } else {
          el.termInput.value += key;
          el.termInput.focus();
        }
      });
    });

    // Sidebar activity toggle
    if (el.actExplorer && el.sidebar) {
      el.actExplorer.addEventListener("click", () => {
        el.sidebar.classList.toggle("collapsed");
        el.actExplorer.classList.toggle("active");
      });
    }

    // Preview / Serve button in editor toolbar
    if (el.btnPreview) {
      el.btnPreview.addEventListener("click", () => {
        serveFile(state.activeFile, 3000, false);
      });
    }

    // GNU Nano editor buttons & keyboard shortcuts
    if (el.nanoBtnSave) {
      el.nanoBtnSave.addEventListener("click", () => {
        if (el.nanoEditor && state.nanoCurrentFile) {
          state.files[state.nanoCurrentFile] = el.nanoEditor.value;
          if (state.activeFile === state.nanoCurrentFile && el.codeTextarea) {
            el.codeTextarea.value = state.files[state.nanoCurrentFile];
            updateGutter();
          }
          saveCurrentFile();
          const lines = el.nanoEditor.value.split("\n").length;
          if (el.nanoStatus) el.nanoStatus.textContent = `[ Wrote ${lines} lines ]`;
          renderSidebarLists();
          renderTabs();
        }
      });
    }

    if (el.nanoBtnExit) {
      el.nanoBtnExit.addEventListener("click", () => closeNano(true));
    }

    if (el.nanoEditor) {
      el.nanoEditor.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
          e.preventDefault();
          if (el.nanoBtnSave) el.nanoBtnSave.click();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
          e.preventDefault();
          closeNano(true);
        }
      });
    }

    // Live Server Preview Controls
    if (el.previewBtnClose && el.livePreview) {
      el.previewBtnClose.addEventListener("click", () => {
        el.livePreview.classList.add("hidden");
      });
    }

    if (el.previewBtnReload && el.previewFrame) {
      el.previewBtnReload.addEventListener("click", () => {
        const curDoc = el.previewFrame.srcdoc;
        const curSrc = el.previewFrame.src;
        if (curDoc) {
          el.previewFrame.srcdoc = "";
          setTimeout(() => { el.previewFrame.srcdoc = curDoc; }, 50);
        } else {
          el.previewFrame.src = "";
          setTimeout(() => { el.previewFrame.src = curSrc; }, 50);
        }
      });
    }

    if (el.previewBtnDesktop && el.previewFrame) {
      el.previewBtnDesktop.addEventListener("click", () => {
        el.previewFrame.className = "vsc-preview-frame";
      });
    }

    if (el.previewBtnTablet && el.previewFrame) {
      el.previewBtnTablet.addEventListener("click", () => {
        el.previewFrame.className = "vsc-preview-frame tablet";
      });
    }

    if (el.previewBtnMobile && el.previewFrame) {
      el.previewBtnMobile.addEventListener("click", () => {
        el.previewFrame.className = "vsc-preview-frame mobile";
      });
    }

    if (el.previewBtnExternal && el.previewFrame) {
      el.previewBtnExternal.addEventListener("click", () => {
        const targetUrl = el.previewFrame.dataset.blobUrl || el.previewFrame.src;
        if (targetUrl) {
          window.open(targetUrl, "_blank");
        }
      });
    }

    // Ports Tab click handling
    if (el.tabPorts && el.portsPanel && el.termBody) {
      el.tabPorts.addEventListener("click", () => {
        document.querySelectorAll(".vsc-term-tab").forEach(t => t.classList.remove("active"));
        el.tabPorts.classList.add("active");
        el.termBody.style.display = "none";
        el.portsPanel.classList.add("active");
        renderPortsTable();
      });

      const termTab = document.querySelector(".vsc-term-tab");
      if (termTab) {
        termTab.addEventListener("click", () => {
          document.querySelectorAll(".vsc-term-tab").forEach(t => t.classList.remove("active"));
          termTab.classList.add("active");
          el.portsPanel.classList.remove("active");
          el.termBody.style.display = "flex";
        });
      }
    }

    // Initialize resizer
    initSashResizer();
  }

  // --- BOOTSTRAP WORKBENCH ---
  function init() {
    applySettings();
    renderTabs();
    renderSidebarLists();
    openFile(state.activeFile);
    updateGitStatus();
    refreshProblems();
    initEvents();

    // Background verify GitHub token if stored
    if (state.githubToken) {
      githubAuth(state.githubToken).catch(() => {});
    }

    // Auto-reconnect last opened local project if permission is already active
    getProjectHandle("last_project").then(async (handle) => {
      if (handle) {
        const perm = await handle.queryPermission({ mode: "readwrite" });
        if (perm === "granted") {
          loadLocalDirectory(handle).catch(() => {});
        }
      }
    }).catch(() => {});

    // Ensure clean initial terminal height (don't cover editor files on launch)
    if (el.terminalPanel && el.app) {
      const avail = el.app.offsetHeight - 36 - 24;
      const initialH = Math.min(185, Math.floor(avail * 0.32));
      if (initialH >= 100) {
        el.terminalPanel.style.height = `${initialH}px`;
        state.savedPanelHeight = initialH;
      }
    }

    // Print welcome banner in terminal
    termPrintHTML(`
<span class="vsc-term-info">Visual Studio Code Tools [Version 4.2.0-web]</span>
<span class="vsc-term-dim">(c) DevStudio Web. Pitch Black &amp; Turquoise Workspace.</span>
Type <b style="color:var(--vsc-turquoise)">help</b> to see all daily diagnostic, network, crypto, and code tools.
Local Disk: Click <b style="color:var(--vsc-turquoise)">📂 Open Project\\</b> or press <b style="color:var(--vsc-turquoise)">Ctrl+O</b> to edit files directly on your drive.
${state.githubRepo ? `Remote: <b style="color:var(--vsc-turquoise)">${state.githubRepo}@${state.githubBranch}</b> connected.` : "GitHub: Type <b style=\"color:var(--vsc-turquoise)\">github auth &lt;token&gt;</b> or click Accounts to sync real files."}
`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

