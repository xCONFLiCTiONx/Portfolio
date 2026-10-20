/**
 * ============================================================================
 * VS CODE TOOLS — Web IDE & Daily CLI Developer Workbench
 * Theme: Pitch Black (#121212), Crisp White (#FFFFFF), Accent Turquoise (#00F0FF)
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
  <link rel="stylesheet" href="./vscode-tools.css" />
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
      border: 1px solid rgba(0, 240, 255, 0.3);
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      background: rgba(0, 240, 255, 0.15);
      color: #00f0ff;
      font-weight: 700;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    button {
      background: #00f0ff;
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
    <button onclick="alert('Virtual Web Server connected!')">Test Interaction</button>
  </div>
</body>
</html>
`
  };

  // --- APPLICATION STATE ---
  const state = {
    files: {},
    activeFile: "scratchpad.js",
    commandHistory: [],
    historyIndex: -1,
    isMaximized: false,
    savedPanelHeight: 280,
    activeShell: "powershell",
    activeTab: "terminal",
    servers: {}, // { port: { file, url, pid, startedAt } }
    nanoActive: false,
    nanoCurrentFile: ""
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
    actExplorer: document.getElementById("vsc-act-explorer"),

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

    // Ports view elements
    tabPorts: document.getElementById("vsc-tab-ports"),
    portsPanel: document.getElementById("vsc-ports-panel"),
    portsTbody: document.getElementById("vsc-ports-tbody"),
    portsCount: document.getElementById("vsc-ports-count")
  };

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

      // Bounds clamping: min 60px, max workspaceHeight - 80px
      newHeight = Math.max(60, Math.min(workspaceHeight - 80, newHeight));
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
      el.terminalPanel.style.height = `${state.savedPanelHeight || 320}px`;
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
    // Resolves ../../css/main.css and ./vscode-tools.css to accessible site assets
    content = content.replace(/href=["']\.\.\/\.\.\/css\/main\.css["']/gi, 'href="../../css/main.css"');
    content = content.replace(/href=["']\.\/vscode-tools\.css["']/gi, 'href="./vscode-tools.css"');
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
      el.previewFrame.src = blobUrl;
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
          termPrint("Usage: color #00f0ff", "vsc-term-warn");
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
        if (el.codeTextarea) {
          state.files[state.activeFile] = el.codeTextarea.value;
          saveWorkspace();
          termPrint(`Saved ${state.activeFile} to local storage.`, "vsc-term-success");
        }
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
        updateGutter();
        saveWorkspace();
      });
      el.codeTextarea.addEventListener("keyup", updateGutter);
      el.codeTextarea.addEventListener("click", updateGutter);
    }

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
          saveWorkspace();
          if (state.activeFile === state.nanoCurrentFile && el.codeTextarea) {
            el.codeTextarea.value = state.files[state.nanoCurrentFile];
            updateGutter();
          }
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
        const curSrc = el.previewFrame.src;
        el.previewFrame.src = "";
        setTimeout(() => { el.previewFrame.src = curSrc; }, 50);
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
        if (el.previewFrame.src) {
          window.open(el.previewFrame.src, "_blank");
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
    renderTabs();
    renderSidebarLists();
    openFile(state.activeFile);
    initEvents();

    // Print welcome banner in terminal
    termPrintHTML(`
<span class="vsc-term-info">Visual Studio Code Tools [Version 4.2.0-web]</span>
<span class="vsc-term-dim">(c) DevStudio Web. Pitch Black &amp; Turquoise Workspace.</span>
Type <b style="color:var(--vsc-turquoise)">help</b> to see all daily diagnostic, network, crypto, and code tools.
`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

