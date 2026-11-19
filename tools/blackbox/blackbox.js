/**
 * BLACKBOX // PROGRESSIVE TERMINAL WORKBENCH & PROCEDURAL ANOMALY ENGINE
 * - Inspired by bash.ws + real-world systems, network, and cryptographic debugging.
 * - Starts with all specialized tools hidden/unmounted. Discover them via `dir`, `ls`, `find`, `cat`, `dmesg`, `mount`.
 * - Includes real live browser/network tools (`myip`, `dns`, `webrtc`, `headers`, `fp`) + procedural system anomalies.
 * - Full Tab autocompletion for commands, paths, directories, and discovered tools.
 * - Every solved system morphs the entire visual architecture, theme, telemetry widget, filesystem, and problem.
 */

(function () {
  "use strict";

  const COOKIE_NAME = "bb_engineer_save_v1";
  const STORAGE_KEY = "bb_engineer_save_v1";

  // =========================================================================
  // 1. ARCHITECTURAL THEMES & PROCEDURAL PROBLEM TEMPLATES
  // =========================================================================
  const ARCHITECTURES = [
    {
      theme: "amber-crt",
      sysName: "IBM-390 // AIX KERNEL CORE",
      host: "aix-core-01",
      archTag: "MAINFRAME IPC & MEMORY SUBSYSTEM",
      vizType: "oscilloscope",
      problemType: "hex-semaphore"
    },
    {
      theme: "arctic-ice",
      sysName: "AETHER-OS // BGP-9 OPTICAL ROUTER",
      host: "bgp-edge-09",
      archTag: "AUTONOMOUS SYSTEM ROUTING ENGINE",
      vizType: "routing-mesh",
      problemType: "bgp-hijack"
    },
    {
      theme: "emerald-vault",
      sysName: "VAULT-OS // ZERO-KNOWLEDGE ENCLAVE",
      host: "zk-enclave-04",
      archTag: "HSM CRYPTOGRAPHIC KEY RING",
      vizType: "crypto-ring",
      problemType: "xor-keyshard"
    },
    {
      theme: "crimson-scada",
      sysName: "HELIO-SCADA // THERMAL REACTOR PLC-04",
      host: "plc-loop-04",
      archTag: "MODBUS RTU PRESSURE CONTROLLER",
      vizType: "scada-bars",
      problemType: "pid-drift"
    },
    {
      theme: "violet-tensor",
      sysName: "SYNAPSE-OS // TENSOR CONSENSUS GRID",
      host: "raft-node-07",
      archTag: "DISTRIBUTED RAFT QUORUM ENGINE",
      vizType: "consensus-nodes",
      problemType: "quorum-split"
    },
    {
      theme: "cobalt-orbital",
      sysName: "ASTRA-LINK // SAT-7 DOWNLINK ARRAY",
      host: "telemetry-sat7",
      archTag: "KA-BAND TRANSPONDER PHASE LOCK",
      vizType: "orbital-wave",
      problemType: "doppler-shift"
    },
    {
      theme: "graphite-gold",
      sysName: "LEDGER-CORE // FIX-4.4 CLEARING ENGINE",
      host: "wal-engine-02",
      archTag: "WRITE-AHEAD LOG ATOMIC SEQUENCER",
      vizType: "ledger-matrix",
      problemType: "wal-checksum"
    },
    {
      theme: "acid-bio",
      sysName: "ATMOS-KERNEL // BIO-SCRUBBER LAB-09",
      host: "scrubber-ctl9",
      archTag: "HEPA DIFFERENTIAL CASCADE ARRAY",
      vizType: "pressure-wave",
      problemType: "sensor-offset"
    }
  ];

  // Hidden tools located in /opt/tools that only appear on the left rack once discovered!
  const TOOL_DEFINITIONS = {
    decode: {
      cmd: "decode",
      usage: "decode <base64|hex|rot13> <payload>",
      desc: "Decode Base64, Hex, or ROT13 encoded strings & dumps"
    },
    probe: {
      cmd: "probe",
      usage: "probe <subsystem|address>",
      desc: "Deep hardware/register/route diagnostic analyzer"
    },
    calc: {
      cmd: "calc",
      usage: "calc <expression|xor>",
      desc: "Evaluate engineering math, hex offsets, or XOR masks"
    },
    patch: {
      cmd: "patch",
      usage: "patch <parameter> <value>",
      desc: "Write calibrated repair value into live kernel/daemon config"
    },
    verify: {
      cmd: "verify",
      usage: "verify",
      desc: "Run full subsystem integrity check & commit resolution"
    },
    myip: {
      cmd: "myip",
      usage: "myip",
      desc: "Live Network Tool: Inspect your real public IP & Cloudflare trace"
    },
    dns: {
      cmd: "dns",
      usage: "dns <domain> [A|TXT|MX|NS]",
      desc: "Live Network Tool: Query DNS-over-HTTPS (DoH) records in real time"
    },
    webrtc: {
      cmd: "webrtc",
      usage: "webrtc",
      desc: "Live Network Tool: Audit browser WebRTC ICE/STUN local IP leaks"
    },
    headers: {
      cmd: "headers",
      usage: "headers",
      desc: "Live Network Tool: Inspect live HTTP session & client headers"
    },
    fp: {
      cmd: "fp",
      usage: "fp",
      desc: "Live Browser Tool: Compute hardware, WebGL & Canvas entropy hash"
    }
  };

  // =========================================================================
  // 2. SEEDED PRNG & DYNAMIC ANOMALY GENERATOR
  // =========================================================================
  function createRNG(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function toHex(str) {
    return Array.from(str)
      .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
  }

  function rot13(str) {
    return str.replace(/[a-zA-Z]/g, c => {
      const base = c <= "Z" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
  }

  function buildProceduralAnomaly(seedInput, archIndexInput) {
    const seed = seedInput || Math.floor(Date.now() % 899999) + 100000;
    const rng = createRNG(seed);
    const archIdx =
      typeof archIndexInput === "number"
        ? archIndexInput % ARCHITECTURES.length
        : Math.floor(rng() * ARCHITECTURES.length);
    const arch = ARCHITECTURES[archIdx];

    // Generate unique procedural values for this anomaly
    const randNum = Math.floor(100 + rng() * 899);
    const hexAddr = "0x" + Math.floor(4096 + rng() * 60000).toString(16).toUpperCase();
    let symptom = "";
    let targetParam = "";
    let expectedValue = "";
    let rawClue = "";
    let probeOutput = "";
    let fs = {};

    if (arch.problemType === "hex-semaphore") {
      targetParam = "ipc.sem_unlock_key";
      expectedValue = "AIX-" + randNum + "-" + hexAddr.slice(2);
      rawClue = toHex(expectedValue);
      symptom = `CRITICAL: IPC Semaphore deadlock at address ${hexAddr}. Kernel worker threads blocked waiting on corrupted token in /var/crash/.sem_dump.`;
      probeOutput = `Subsystem Probe [${hexAddr}]:\n  Lock Owner PID: 4192 (kworker_ipc)\n  Encoding Type : HEXADECIMAL ASCII STREAM\n  Raw Payload   : ${rawClue}\n  Target Sysctl : ${targetParam}\n  Action Needed : Decode the hex payload using 'decode hex <payload>' and apply with 'patch ${targetParam} <decoded_value>'.`;
      fs = {
        "/": ["etc", "var", "opt", "proc", "home"],
        "/etc": ["sysctl.conf", "inittab"],
        "/var": ["log", "crash"],
        "/var/log": ["dmesg.log", "syslog"],
        "/var/crash": [".sem_dump", "core.4192"],
        "/opt": ["tools"],
        "/opt/tools": Object.keys(TOOL_DEFINITIONS),
        "/proc": ["locks", "meminfo"],
        "/home": ["operator"],
        "/home/operator": ["README.txt", ".bash_history"]
      };
    } else if (arch.problemType === "bgp-hijack") {
      const asnGood = "AS" + (64512 + (randNum % 40));
      const hopIp = `198.51.100.${(randNum % 240) + 10}`;
      targetParam = "bgp.nexthop_anchor";
      expectedValue = `${asnGood}@${hopIp}`;
      rawClue = btoa(expectedValue);
      symptom = `ALERT: Optical BGP session flap on Peer ${hopIp}. Route table poisoned by bogus AS path; backup anchor stored in /etc/bgp/.route_backup.`;
      probeOutput = `BGP Optical Peer Diagnostic:\n  Poisoned Route: 0.0.0.0/0 via AS666 (hijacked)\n  Backup Anchor : ${rawClue} (Base64 encoded)\n  Target Config : ${targetParam}\n  Action Needed : Run 'decode base64 ${rawClue}' then 'patch ${targetParam} <decoded_value>'.`;
      fs = {
        "/": ["etc", "var", "opt", "proc", "home"],
        "/etc": ["bgp", "resolv.conf"],
        "/etc/bgp": ["bgpd.conf", ".route_backup"],
        "/var": ["log"],
        "/var/log": ["dmesg.log", "bgpd.log"],
        "/opt": ["tools"],
        "/opt/tools": Object.keys(TOOL_DEFINITIONS),
        "/proc": ["net_fib"],
        "/home": ["operator"],
        "/home/operator": ["README.txt"]
      };
    } else if (arch.problemType === "xor-keyshard") {
      targetParam = "vault.master_seal";
      expectedValue = `ZK-SEAL-${randNum * 7}`;
      rawClue = rot13(expectedValue);
      symptom = `ENCLAVE LOCKED: HSM Quorum seal desynchronized. Emergency ROT13 cipher shard written to /etc/vault/.shard_rot13.`;
      probeOutput = `HSM Enclave Diagnostic:\n  Seal Status   : LOCKED (Parity Mismatch)\n  Cipher Type   : ROT13 ASCII Substitution\n  Cipher Shard  : ${rawClue}\n  Target Config : ${targetParam}\n  Action Needed : Run 'decode rot13 ${rawClue}' then 'patch ${targetParam} <decoded_value>'.`;
      fs = {
        "/": ["etc", "var", "opt", "proc", "home"],
        "/etc": ["vault"],
        "/etc/vault": ["enclave.hcl", ".shard_rot13"],
        "/var": ["log"],
        "/var/log": ["dmesg.log", "audit.log"],
        "/opt": ["tools"],
        "/opt/tools": Object.keys(TOOL_DEFINITIONS),
        "/proc": ["crypto"],
        "/home": ["operator"],
        "/home/operator": ["README.txt"]
      };
    } else if (arch.problemType === "pid-drift") {
      const basePressure = 1200 + randNum;
      const offset = 340;
      const calibrated = basePressure - offset;
      targetParam = "plc.valve_setpoint";
      expectedValue = String(calibrated);
      rawClue = `${basePressure} - ${offset}`;
      symptom = `THERMAL WARNING: Reactor loop pressure drifting above safety threshold (${basePressure} kPa). Overpressure offset logged in /proc/plc_registers.`;
      probeOutput = `SCADA Modbus Register Dump:\n  Current Sensor: ${basePressure} kPa\n  Drift Offset  : -${offset} kPa\n  Formula       : ${basePressure} - ${offset}\n  Target Param  : ${targetParam}\n  Action Needed : Compute '${basePressure} - ${offset}' using 'calc ${basePressure}-${offset}' and run 'patch ${targetParam} <result>'.`;
      fs = {
        "/": ["etc", "var", "opt", "proc", "home"],
        "/etc": ["scada.conf"],
        "/var": ["log"],
        "/var/log": ["dmesg.log", "thermal.log"],
        "/opt": ["tools"],
        "/opt/tools": Object.keys(TOOL_DEFINITIONS),
        "/proc": ["plc_registers", "sensors"],
        "/home": ["operator"],
        "/home/operator": ["README.txt"]
      };
    } else {
      // Coversviolet-tensor, cobalt-orbital, graphite-gold, acid-bio with Base64/Hex/Calc variations
      const mode = archIdx % 2 === 0 ? "base64" : "hex";
      targetParam = arch.theme.split("-")[0] + ".sync_token";
      expectedValue = `SYNC-${arch.theme.slice(0, 3).toUpperCase()}-${randNum}`;
      rawClue = mode === "base64" ? btoa(expectedValue) : toHex(expectedValue);
      symptom = `SUBSYSTEM FAULT [${hexAddr}]: ${arch.archTag} out of phase. Encoded recovery token dumped to /var/log/.recovery_token.`;
      probeOutput = `Telemetry Phase Analyzer:\n  Fault Address : ${hexAddr}\n  Encoding      : ${mode.toUpperCase()}\n  Recovery Blob : ${rawClue}\n  Target Param  : ${targetParam}\n  Action Needed : Run 'decode ${mode} ${rawClue}' then 'patch ${targetParam} <decoded_value>'.`;
      fs = {
        "/": ["etc", "var", "opt", "proc", "home"],
        "/etc": ["daemon.conf"],
        "/var": ["log"],
        "/var/log": ["dmesg.log", ".recovery_token"],
        "/opt": ["tools"],
        "/opt/tools": Object.keys(TOOL_DEFINITIONS),
        "/proc": ["telemetry"],
        "/home": ["operator"],
        "/home/operator": ["README.txt"]
      };
    }

    // Build readable file contents for `cat`
    const files = {
      "/home/operator/README.txt":
        `====================================================================\n` +
        ` ${arch.sysName} // OPERATOR TERMINAL BRIEFING\n` +
        `====================================================================\n` +
        `SYMPTOM: ${symptom}\n\n` +
        `NO GUI TOOLS ARE PRE-MOUNTED. You must investigate from the shell:\n` +
        `  1. Inspect logs & files ('ls -la', 'cd', 'cat /var/log/dmesg.log').\n` +
        `  2. Discover diagnostic & repair binaries in '/opt/tools' ('ls /opt/tools').\n` +
        `  3. Run 'probe' or decode the recovery artifact, then 'patch' & 'verify'.\n` +
        `  * TIP: Press TAB at any time to autocomplete commands and file paths.`,
      "/var/log/dmesg.log":
        `[    0.004192] ${arch.sysName} kernel boot sequence initiated\n` +
        `[    1.882014] ${arch.archTag}: FAULT DETECTED at ${hexAddr}\n` +
        `[    1.882099] ${symptom}\n` +
        `[    1.883400] Diagnostic utilities located in /opt/tools (unmounted)\n` +
        `[    1.884110] Target writable sysctl parameter: ${targetParam}`,
      "/etc/sysctl.conf":
        `# System Control Parameters (${arch.host})\n` +
        `kernel.panic_on_oops = 0\n` +
        `${targetParam} = CORRUPTED_${hexAddr}\n`,
      "/var/crash/.sem_dump": `HEX_DUMP=${rawClue}\nTARGET_PARAM=${targetParam}`,
      "/etc/bgp/.route_backup": `BASE64_ANCHOR=${rawClue}\nTARGET_PARAM=${targetParam}`,
      "/etc/vault/.shard_rot13": `ROT13_SHARD=${rawClue}\nTARGET_PARAM=${targetParam}`,
      "/proc/plc_registers": `REG_PRESSURE_RAW=${rawClue}\nTARGET_PARAM=${targetParam}`,
      "/var/log/.recovery_token": `RECOVERY_BLOB=${rawClue}\nTARGET_PARAM=${targetParam}`
    };

    return {
      seed,
      archIdx,
      arch,
      hexAddr,
      symptom,
      targetParam,
      expectedValue,
      rawClue,
      probeOutput,
      fs,
      files,
      stage1Done: false, // Discovered clue or ran probe/cat on artifact
      stage2Done: false, // Decoded / calculated the expected value
      stage3Done: false, // Patched the target parameter
      resolved: false
    };
  }

  // =========================================================================
  // 3. STATE & COOKIE PERSISTENCE
  // =========================================================================
  let state = {
    anomaly: null,
    cwd: "/home/operator",
    discoveredTools: [], // Tools unlocked onto the left rack
    solvedCount: 0,
    streak: 0,
    bestTimeSec: null,
    startTimeMs: Date.now(),
    cmdHistory: [],
    cmdIndex: -1,
    tabMatches: [],
    tabIndex: 0,
    lastTabInput: ""
  };

  function writeCookie(name, val) {
    try {
      const enc = encodeURIComponent(JSON.stringify(val));
      document.cookie = `${name}=${enc}; max-age=31536000; path=/; SameSite=Lax`;
    } catch (e) {}
  }

  function readCookie(name) {
    try {
      const prefix = name + "=";
      const parts = (document.cookie || "").split(";");
      for (let i = 0; i < parts.length; i++) {
        const c = parts[i].trim();
        if (c.indexOf(prefix) === 0) {
          return JSON.parse(decodeURIComponent(c.substring(prefix.length)));
        }
      }
    } catch (e) {}
    return null;
  }

  function saveState() {
    if (!state.anomaly) return;
    const payload = {
      seed: state.anomaly.seed,
      archIdx: state.anomaly.archIdx,
      stage1Done: state.anomaly.stage1Done,
      stage2Done: state.anomaly.stage2Done,
      stage3Done: state.anomaly.stage3Done,
      resolved: state.anomaly.resolved,
      discoveredTools: state.discoveredTools,
      solvedCount: state.solvedCount,
      streak: state.streak,
      bestTimeSec: state.bestTimeSec,
      cmdHistory: state.cmdHistory.slice(-20)
    };
    writeCookie(COOKIE_NAME, payload);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function loadSavedState() {
    const c = readCookie(COOKIE_NAME);
    if (c && c.seed) return c;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  // =========================================================================
  // 4. UI RENDERING & DYNAMIC TELEMETRY VISUALIZER
  // =========================================================================
  function renderUI() {
    const an = state.anomaly;
    if (!an) return;

    const app = document.getElementById("blackbox-app");
    if (app) app.setAttribute("data-theme", an.arch.theme);

    const beacon = document.getElementById("bb-beacon");
    if (beacon) beacon.classList.toggle("nominal", an.resolved);

    const sysTitle = document.getElementById("bb-sys-title");
    const sysSub = document.getElementById("bb-sys-sub");
    if (sysTitle) sysTitle.textContent = an.arch.sysName;
    if (sysSub) sysSub.textContent = `${an.arch.archTag} // SEED #${an.seed}`;

    const solvedEl = document.getElementById("bb-stat-solved");
    const rankEl = document.getElementById("bb-stat-rank");
    const bestEl = document.getElementById("bb-stat-best");

    const ranks = ["L1 ANALYST", "L2 OPERATOR", "L3 SYSTEMS ENG", "L4 KERNEL ARCHITECT", "L5 PRINCIPAL FELLOW"];
    const rankName = ranks[Math.min(ranks.length - 1, Math.floor(state.solvedCount / 2))];

    if (solvedEl) solvedEl.textContent = String(state.solvedCount);
    if (rankEl) rankEl.textContent = rankName;
    if (bestEl) bestEl.textContent = state.bestTimeSec ? `${state.bestTimeSec}s` : "--";

    // Update prompt prefix
    const promptEl = document.getElementById("bb-prompt-label");
    if (promptEl) {
      promptEl.innerHTML = `<span class="bb-prompt-str">operator@${an.arch.host}</span>:<span class="bb-path-str">${state.cwd}</span>$`;
    }

    renderTelemetryPanel();
    renderDiscoveredModules();
  }

  function renderTelemetryPanel() {
    const an = state.anomaly;
    const mount = document.getElementById("bb-telemetry-mount");
    if (!mount) return;

    const statusColor = an.resolved ? "var(--bb-success)" : "var(--bb-danger)";
    const svgWave = an.resolved
      ? `<path d="M 10 45 Q 45 45 80 45 T 150 45 T 220 45 T 280 45" fill="none" stroke="var(--bb-success)" stroke-width="2.5"/>`
      : `<path d="M 10 45 L 35 18 L 55 72 L 85 12 L 115 78 L 145 22 L 175 68 L 210 15 L 245 70 L 280 45" fill="none" stroke="var(--bb-primary)" stroke-width="2"/>`;

    mount.innerHTML = `
      <div class="bb-symptom-banner ${an.resolved ? "resolved" : ""}">
        <strong style="display:block;margin-bottom:3px;color:${statusColor};">
          ${an.resolved ? "[✓] SUBSYSTEM NOMINAL — ANOMALY RESOLVED" : "[!] ACTIVE FAULT DETECTED"}
        </strong>
        <span>${escapeHtml(an.symptom)}</span>
      </div>

      <div style="background:rgba(0,0,0,0.45);border:1px solid var(--bb-border);border-radius:var(--bb-radius);padding:8px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--bb-muted);margin-bottom:4px;">
          <span>LIVE TELEMETRY // ${an.arch.vizType.toUpperCase()}</span>
          <span style="color:${statusColor}">${an.resolved ? "LOCKED 100%" : "ERR " + an.hexAddr}</span>
        </div>
        <svg viewBox="0 0 290 90" width="100%" height="76" style="display:block;">
          <line x1="0" y1="45" x2="290" y2="45" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3 3"/>
          ${svgWave}
        </svg>
      </div>

      <div class="bb-stage-track">
        <div class="bb-stage-row ${an.stage1Done ? "done" : "active"}">
          <span>01. Isolate Fault & Artifact</span>
          <span>${an.stage1Done ? "✓ FOUND" : "PENDING"}</span>
        </div>
        <div class="bb-stage-row ${an.stage2Done ? "done" : an.stage1Done ? "active" : ""}">
          <span>02. Decode / Compute Calibration</span>
          <span>${an.stage2Done ? "✓ READY" : "LOCKED"}</span>
        </div>
        <div class="bb-stage-row ${an.stage3Done ? "done" : an.stage2Done ? "active" : ""}">
          <span>03. Patch Config & Verify</span>
          <span>${an.resolved ? "✓ NOMINAL" : an.stage3Done ? "PATCHED" : "LOCKED"}</span>
        </div>
      </div>
    `;
  }

  function renderDiscoveredModules() {
    const mount = document.getElementById("bb-modules-mount");
    const countEl = document.getElementById("bb-modules-count");
    if (!mount) return;

    const total = Object.keys(TOOL_DEFINITIONS).length;
    if (countEl) countEl.textContent = `${state.discoveredTools.length} / ${total}`;

    if (state.discoveredTools.length === 0) {
      mount.innerHTML = `
        <div class="bb-empty-rack">
          <div style="color:var(--bb-primary);font-weight:700;margin-bottom:4px;">[ NO MODULES MOUNTED ]</div>
          <div>Tools are hidden until discovered via the terminal. Try typing <code>ls /opt/tools</code>, <code>dir</code>, or <code>help</code>.</div>
        </div>
      `;
      return;
    }

    mount.innerHTML = state.discoveredTools
      .map(tKey => {
        const t = TOOL_DEFINITIONS[tKey];
        if (!t) return "";
        return `
          <div class="bb-module-item" data-insert-cmd="${t.cmd} ">
            <div>
              <div class="bb-module-cmd">${escapeHtml(t.cmd)}</div>
              <div class="bb-module-desc">${escapeHtml(t.desc)}</div>
            </div>
            <span style="font-size:10px;color:var(--bb-primary);">MOUNTED</span>
          </div>
        `;
      })
      .join("");

    mount.querySelectorAll(".bb-module-item").forEach(item => {
      item.addEventListener("click", () => {
        if (window.getSelection && window.getSelection().toString().trim().length > 0) return;
        const input = document.getElementById("bb-cmd-input");
        if (input) {
          input.value = item.getAttribute("data-insert-cmd");
          input.focus();
        }
      });
    });
  }

  function unlockTools(toolNames) {
    let added = false;
    toolNames.forEach(name => {
      if (TOOL_DEFINITIONS[name] && !state.discoveredTools.includes(name)) {
        state.discoveredTools.push(name);
        added = true;
      }
    });
    if (added) {
      saveState();
      renderDiscoveredModules();
    }
  }

  // =========================================================================
  // 5. TERMINAL OUTPUT & PATH RESOLUTION HELPERS
  // =========================================================================
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function printLine(text, style = "") {
    const out = document.getElementById("bb-term-body");
    if (!out) return;
    const div = document.createElement("div");
    div.className = "bb-line";
    if (style) div.setAttribute("style", style);
    div.textContent = text;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function printHTML(html) {
    const out = document.getElementById("bb-term-body");
    if (!out) return;
    const div = document.createElement("div");
    div.className = "bb-line";
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function resolvePath(inputPath) {
    if (!inputPath || inputPath === ".") return state.cwd;
    if (inputPath === "~") return "/home/operator";
    let combined = inputPath.startsWith("/")
      ? inputPath
      : (state.cwd === "/" ? "/" : state.cwd + "/") + inputPath;
    const parts = combined.split("/").filter(Boolean);
    const stack = [];
    for (const p of parts) {
      if (p === ".") continue;
      if (p === "..") stack.pop();
      else stack.push(p);
    }
    return "/" + stack.join("/");
  }

  // =========================================================================
  // 6. TAB AUTOCOMPLETION ENGINE (COMMANDS + FILESYSTEM PATHS)
  // =========================================================================
  const BASE_COMMANDS = [
    "help", "ls", "dir", "cd", "pwd", "cat", "type", "find",
    "grep", "dmesg", "env", "mount", "clear", "status", "next", "reset"
  ];

  function handleTabCompletion(inputEl) {
    const raw = inputEl.value;
    const tokens = raw.split(/\s+/);

    // 1. Completing the command name (first token, no trailing space)
    if (tokens.length <= 1 && !raw.endsWith(" ")) {
      const partial = (tokens[0] || "").toLowerCase();
      const availableCmds = Array.from(new Set([...BASE_COMMANDS, ...state.discoveredTools])).sort();
      const matches = availableCmds.filter(c => c.startsWith(partial));

      if (matches.length === 1) {
        inputEl.value = matches[0] + " ";
      } else if (matches.length > 1) {
        printLine(matches.join("   "), "color:var(--bb-muted)");
      }
      return;
    }

    // 2. Completing a file or directory path (last token)
    const lastToken = raw.endsWith(" ") ? "" : tokens[tokens.length - 1];
    const lastSlash = lastToken.lastIndexOf("/");
    let dirPart = "";
    let filePrefix = lastToken;

    if (lastSlash !== -1) {
      dirPart = lastToken.slice(0, lastSlash + 1);
      filePrefix = lastToken.slice(lastSlash + 1);
    }

    const targetDir = resolvePath(dirPart || ".");
    const entries = (state.anomaly && state.anomaly.fs[targetDir]) || [];
    const matchingEntries = entries.filter(e => e.startsWith(filePrefix));

    if (matchingEntries.length === 1) {
      const match = matchingEntries[0];
      const fullCandidatePath = resolvePath((targetDir === "/" ? "/" : targetDir + "/") + match);
      const isDir = Boolean(state.anomaly.fs[fullCandidatePath]);
      const completedToken = dirPart + match + (isDir ? "/" : "");
      const prefixTokens = raw.endsWith(" ") ? tokens.filter(Boolean) : tokens.slice(0, -1);
      inputEl.value = [...prefixTokens, completedToken].join(" ");
    } else if (matchingEntries.length > 1) {
      // Find longest common prefix
      let common = matchingEntries[0];
      for (let i = 1; i < matchingEntries.length; i++) {
        while (!matchingEntries[i].startsWith(common) && common.length > 0) {
          common = common.slice(0, -1);
        }
      }
      if (common.length > filePrefix.length) {
        const prefixTokens = raw.endsWith(" ") ? tokens.filter(Boolean) : tokens.slice(0, -1);
        inputEl.value = [...prefixTokens, dirPart + common].join(" ");
      }
      printLine(matchingEntries.join("   "), "color:var(--bb-muted)");
    }
  }

  // =========================================================================
  // 7. SHELL COMMAND EXECUTION & BASH.WS LIVE NETWORK DIAGNOSTICS
  // =========================================================================
  async function executeCommand(rawCmd) {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    const an = state.anomaly;
    state.cmdHistory.push(trimmed);
    state.cmdIndex = state.cmdHistory.length;
    saveState();

    printHTML(
      `<span class="bb-prompt-str">operator@${an.arch.host}</span>:<span class="bb-path-str">${state.cwd}</span>$ <span style="color:#fff;font-weight:600;">${escapeHtml(trimmed)}</span>`
    );

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase().replace(/^\/opt\/tools\//, "");
    const args = parts.slice(1);

    if (cmd === "clear" || cmd === "cls") {
      const out = document.getElementById("bb-term-body");
      if (out) out.innerHTML = "";
      return;
    }

    if (cmd === "help" || cmd === "?") {
      printLine("BLACKBOX MINIMAL SHELL PRIMITIVES:", "color:var(--bb-primary-bright);font-weight:700");
      printLine("  ls [-a] [path] / dir     List directory contents (-a reveals hidden .dotfiles)");
      printLine("  cd <path> / pwd          Navigate filesystem directories");
      printLine("  cat <file> / type        Inspect file or log contents");
      printLine("  find                     Search entire filesystem tree for logs, dumps & tools");
      printLine("  dmesg                    View kernel ring buffer & fault address");
      printLine("  mount /opt/tools         Mount all diagnostic & network binaries in /opt/tools");
      printLine("  next                     Morph into a new procedural system architecture & anomaly");
      if (state.discoveredTools.length > 0) {
        printLine("\nMOUNTED /OPT/TOOLS UTILITIES:", "color:var(--bb-primary-bright);font-weight:700");
        state.discoveredTools.forEach(k => {
          const t = TOOL_DEFINITIONS[k];
          printLine(`  ${t.usage.padEnd(32)} ${t.desc}`);
        });
      } else {
        printLine("\n[!] 0 specialized tools mounted. Inspect '/opt/tools' ('ls /opt/tools' or 'mount /opt/tools') to unlock diagnostic binaries.", "color:var(--bb-muted)");
      }
      return;
    }

    if (cmd === "pwd") {
      printLine(state.cwd);
      return;
    }

    if (cmd === "ls" || cmd === "dir") {
      const showHidden = args.some(a => a.includes("-a") || a.includes("-la") || a.includes("/a"));
      const pathArg = args.find(a => !a.startsWith("-") && !a.startsWith("/a")) || ".";
      const target = resolvePath(pathArg);
      const list = an.fs[target];

      if (!list) {
        printLine(`ls: cannot access '${pathArg}': No such directory`, "color:var(--bb-danger)");
        return;
      }

      // If listing /opt/tools, automatically discover and mount all tools!
      if (target === "/opt/tools") {
        unlockTools(Object.keys(TOOL_DEFINITIONS));
        printLine("[+] Discovered & mounted 10 diagnostic binaries from /opt/tools onto left module rack!", "color:var(--bb-success);font-weight:700");
      }

      const filtered = showHidden ? [".", "..", ...list] : list.filter(x => !x.startsWith("."));
      printLine(`Directory listing of ${target}:`, "color:var(--bb-muted)");
      printLine(
        filtered
          .map(item => {
            const full = resolvePath((target === "/" ? "/" : target + "/") + item);
            if (item === "." || item === ".." || an.fs[full]) return `[DIR]  ${item}/`;
            if (target === "/opt/tools") return `[BIN]  ${item}*`;
            return `[FILE] ${item}`;
          })
          .join("\n"),
        "color:var(--bb-primary-bright)"
      );
      if (!showHidden && list.some(x => x.startsWith("."))) {
        printLine("(Hint: hidden dotfiles exist in this directory — use 'ls -la' to view them)", "color:var(--bb-muted)");
      }
      return;
    }

    if (cmd === "cd") {
      const dest = resolvePath(args[0] || "/home/operator");
      if (an.fs[dest]) {
        state.cwd = dest;
        renderUI();
      } else {
        printLine(`cd: no such directory: ${args[0]}`, "color:var(--bb-danger)");
      }
      return;
    }

    if (cmd === "find" || cmd === "tree") {
      printLine("Scanning filesystem tree...", "color:var(--bb-muted)");
      Object.keys(an.fs).forEach(dir => {
        an.fs[dir].forEach(entry => {
          const full = dir === "/" ? "/" + entry : dir + "/" + entry;
          printLine("  " + full, entry.startsWith(".") ? "color:var(--bb-primary-bright);font-weight:700" : "");
        });
      });
      return;
    }

    if (cmd === "dmesg" || cmd === "journalctl") {
      printLine(an.files["/var/log/dmesg.log"], "color:var(--bb-text)");
      return;
    }

    if (cmd === "cat" || cmd === "type") {
      if (!args[0]) {
        printLine("Usage: cat <filepath>", "color:var(--bb-danger)");
        return;
      }
      const targetFile = resolvePath(args[0]);
      if (an.files[targetFile]) {
        printLine(an.files[targetFile], "color:var(--bb-primary-bright)");
        if (targetFile.includes(".") || targetFile.includes("plc_registers")) {
          an.stage1Done = true;
          saveState();
          renderUI();
          printLine("[+] Stage 01 Complete: Fault artifact isolated. Use 'probe' or 'decode' / 'calc' to extract the calibration value.", "color:var(--bb-success)");
        }
      } else {
        printLine(`cat: ${args[0]}: No such file or unreadable binary`, "color:var(--bb-danger)");
      }
      return;
    }

    if (cmd === "mount") {
      unlockTools(Object.keys(TOOL_DEFINITIONS));
      printLine("[+] Mounted /opt/tools: 10 diagnostic & network binaries are now online in the left rack.", "color:var(--bb-success);font-weight:700");
      return;
    }

    if (cmd === "probe") {
      unlockTools(["probe", "decode", "calc", "patch", "verify"]);
      an.stage1Done = true;
      saveState();
      renderUI();
      printLine(an.probeOutput, "color:var(--bb-primary-bright)");
      return;
    }

    if (cmd === "decode" || cmd === "cipher") {
      unlockTools(["decode", "patch", "verify"]);
      const mode = (args[0] || "").toLowerCase();
      const blob = args.slice(1).join("").trim() || an.rawClue;
      let result = "";
      try {
        if (mode === "base64" || mode === "b64") {
          result = atob(blob);
        } else if (mode === "hex") {
          let str = "";
          for (let i = 0; i < blob.length; i += 2) {
            str += String.fromCharCode(parseInt(blob.substr(i, 2), 16));
          }
          result = str;
        } else if (mode === "rot13" || mode === "rot") {
          result = rot13(blob);
        } else {
          printLine("Usage: decode <base64|hex|rot13> <payload>", "color:var(--bb-danger)");
          return;
        }
      } catch (e) {
        printLine("Decode error: malformed input stream.", "color:var(--bb-danger)");
        return;
      }

      printLine(`Decoded Output: ${result}`, "color:var(--bb-success);font-weight:700");
      if (result.trim() === an.expectedValue) {
        an.stage1Done = true;
        an.stage2Done = true;
        saveState();
        renderUI();
        printLine(`[+] Stage 02 Complete! Apply this calibration with: patch ${an.targetParam} ${result}`, "color:var(--bb-primary-bright)");
      }
      return;
    }

    if (cmd === "calc") {
      unlockTools(["calc", "patch", "verify"]);
      const expr = args.join("").replace(/[^0-9+\-*/().]/g, "");
      if (!expr) {
        printLine("Usage: calc <expression> (e.g. calc 1540-340)", "color:var(--bb-danger)");
        return;
      }
      try {
        const val = String(Function(`"use strict"; return (${expr});`)());
        printLine(`Result: ${val}`, "color:var(--bb-success);font-weight:700");
        if (val === an.expectedValue) {
          an.stage1Done = true;
          an.stage2Done = true;
          saveState();
          renderUI();
          printLine(`[+] Stage 02 Complete! Apply this setpoint with: patch ${an.targetParam} ${val}`, "color:var(--bb-primary-bright)");
        }
      } catch (e) {
        printLine("Calculation syntax error.", "color:var(--bb-danger)");
      }
      return;
    }

    if (cmd === "patch" || cmd === "sysctl") {
      unlockTools(["patch", "verify"]);
      const cleaned = args.join(" ").replace("-w", "").replace("=", " ").trim().split(/\s+/);
      const param = cleaned[0] || "";
      const val = cleaned[1] || cleaned[0] || "";

      if (param.toLowerCase() === an.targetParam.toLowerCase() && val.toLowerCase() === an.expectedValue.toLowerCase()) {
        an.stage1Done = true;
        an.stage2Done = true;
        an.stage3Done = true;
        saveState();
        renderUI();
        printLine(`[+] Kernel parameter '${an.targetParam}' patched to '${an.expectedValue}'.`, "color:var(--bb-success);font-weight:700");
        printLine(`Run 'verify' to commit changes and validate subsystem stability.`, "color:var(--bb-primary-bright)");
      } else {
        printLine(
          `[!] Patch rejected. Expected 'patch ${an.targetParam} <calibrated_value>'. Run 'probe' if you need to inspect the fault register.`,
          "color:var(--bb-danger)"
        );
      }
      return;
    }

    if (cmd === "verify") {
      if (!an.stage3Done) {
        printLine(`[!] Verification failed: '${an.targetParam}' is still corrupted. Run 'probe' and 'patch' first.`, "color:var(--bb-danger)");
        return;
      }
      if (!an.resolved) {
        an.resolved = true;
        state.solvedCount += 1;
        state.streak += 1;
        const elapsedSec = Math.max(1, Math.round((Date.now() - state.startTimeMs) / 1000));
        if (!state.bestTimeSec || elapsedSec < state.bestTimeSec) {
          state.bestTimeSec = elapsedSec;
        }
        saveState();
        renderUI();

        printHTML(`
          <div class="bb-morph-box">
            <div>
              <div style="color:var(--bb-success);font-weight:800;font-size:14px;">[✓] SYSTEM ANOMALY RESOLVED IN ${elapsedSec}s // CLEARANCE UPGRADED</div>
              <div style="color:var(--bb-text);font-size:12px;">${escapeHtml(an.arch.sysName)} restored to 100% nominal operation. Morphing into next architecture...</div>
            </div>
            <button class="bb-btn" onclick="window.BlackBoxMorphNext()">Morph Now &rarr;</button>
          </div>
        `);

        setTimeout(() => {
          if (state.anomaly && state.anomaly.seed === an.seed && state.anomaly.resolved) {
            morphToNextSystem();
          }
        }, 2800);
      }
      return;
    }

    // =====================================================================
    // REAL LIVE BASH.WS-STYLE NETWORK & BROWSER DIAGNOSTIC TOOLS
    // =====================================================================
    if (cmd === "myip" || cmd === "ip" || cmd === "trace") {
      unlockTools(["myip"]);
      printLine("Querying live network edge trace (/cdn-cgi/trace & ipify)...", "color:var(--bb-muted)");
      try {
        const res = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
        const txt = await res.text();
        printLine(txt.trim(), "color:var(--bb-primary-bright)");
      } catch (e) {
        printLine("Live trace blocked by offline/extension policy — Local Host Interface: 127.0.0.1", "color:var(--bb-muted)");
      }
      return;
    }

    if (cmd === "dns" || cmd === "dig") {
      unlockTools(["dns"]);
      const domain = args[0] || "xconflictionx.cc";
      const rtype = (args[1] || "A").toUpperCase();
      printLine(`Querying DoH (1.1.1.1) for ${domain} [${rtype}]...`, "color:var(--bb-muted)");
      try {
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(rtype)}`, {
          headers: { accept: "application/dns-json" }
        });
        const data = await res.json();
        if (data.Answer && data.Answer.length) {
          data.Answer.forEach(a => {
            printLine(`  ${a.name.padEnd(28)} TTL=${a.TTL}   DATA=${a.data}`, "color:var(--bb-primary-bright)");
          });
        } else {
          printLine(`  No ${rtype} records returned (Status: ${data.Status})`, "color:var(--bb-muted)");
        }
      } catch (e) {
        printLine("DoH query unreachable from current network context.", "color:var(--bb-danger)");
      }
      return;
    }

    if (cmd === "webrtc") {
      unlockTools(["webrtc"]);
      printLine("Probing browser WebRTC ICE candidate gathering...", "color:var(--bb-muted)");
      if (!window.RTCPeerConnection) {
        printLine("  WebRTC RTCPeerConnection is disabled/blocked in this browser (No Leak).", "color:var(--bb-success)");
        return;
      }
      try {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        pc.createDataChannel("");
        const found = new Set();
        pc.onicecandidate = e => {
          if (e.candidate && e.candidate.candidate) {
            found.add(e.candidate.candidate);
            printLine("  ICE Candidate: " + e.candidate.candidate, "color:var(--bb-primary-bright)");
          }
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        setTimeout(() => {
          pc.close();
          if (found.size === 0) {
            printLine("  0 STUN candidates exposed (WebRTC leak protection active).", "color:var(--bb-success)");
          }
        }, 1200);
      } catch (e) {
        printLine("  WebRTC restricted by browser security policy.", "color:var(--bb-success)");
      }
      return;
    }

    if (cmd === "headers" || cmd === "env") {
      unlockTools(["headers"]);
      printLine("Live Browser & Session Environment Headers:", "color:var(--bb-primary-bright)");
      printLine(`  User-Agent         : ${navigator.userAgent}`);
      printLine(`  Language / Locale  : ${navigator.language} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`);
      printLine(`  Hardware Threads   : ${navigator.hardwareConcurrency || " masked"}`);
      printLine(`  Viewport Geometry  : ${window.innerWidth}x${window.innerHeight} (DPR ${window.devicePixelRatio})`);
      printLine(`  ARCH_TARGET_PARAM  : ${an.targetParam}`);
      return;
    }

    if (cmd === "fp" || cmd === "entropy") {
      unlockTools(["fp"]);
      const rawFp = [
        navigator.userAgent,
        navigator.language,
        screen.width + "x" + screen.height + "x" + screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.hardwareConcurrency
      ].join("|");
      let hash = 2166136261;
      for (let i = 0; i < rawFp.length; i++) {
        hash ^= rawFp.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      const hexFp = (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
      printLine(`Browser Hardware Entropy Signature: 0x${hexFp}`, "color:var(--bb-primary-bright);font-weight:700");
      return;
    }

    if (cmd === "next" || cmd === "reroll") {
      morphToNextSystem();
      return;
    }

    printLine(
      `bash: ${cmd}: command not found. Type 'help', 'ls -la', or 'ls /opt/tools' to discover system utilities.`,
      "color:var(--bb-danger)"
    );
  }

  // =========================================================================
  // 8. VIEW TRANSITION MORPHING INTO NEW ARCHITECTURE & PROBLEM
  // =========================================================================
  function morphToNextSystem(customSeed, customArchIdx) {
    const nextArchIdx =
      typeof customArchIdx === "number"
        ? customArchIdx
        : state.anomaly
        ? (state.anomaly.archIdx + 1) % ARCHITECTURES.length
        : 0;

    const applyNewSystem = () => {
      state.anomaly = buildProceduralAnomaly(customSeed, nextArchIdx);
      state.cwd = "/home/operator";
      state.startTimeMs = Date.now();
      saveState();
      renderUI();

      const out = document.getElementById("bb-term-body");
      if (out) out.innerHTML = "";
      printLine("========================================================================", "color:var(--bb-primary)");
      printLine(` ${state.anomaly.arch.sysName} // TELEMETRY SHELL CONNECTED`, "color:var(--bb-primary-bright);font-weight:700");
      printLine(` FAULT ALERT: ${state.anomaly.symptom}`, "color:var(--bb-danger)");
      printLine("========================================================================", "color:var(--bb-primary)");
      printLine("All specialized repair modules start UNMOUNTED. Type 'ls -la', 'dmesg', or 'ls /opt/tools' (TAB autocompletes).");
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => applyNewSystem());
    } else {
      applyNewSystem();
    }
  }

  window.BlackBoxMorphNext = () => morphToNextSystem();

  // =========================================================================
  // 9. INITIALIZATION & FULLSCREEN / KEYBOARD BINDINGS
  // =========================================================================
  function initBlackBox() {
    const input = document.getElementById("bb-cmd-input");
    if (input) {
      input.addEventListener("keydown", e => {
        if (e.key === "Tab") {
          e.preventDefault();
          handleTabCompletion(input);
        } else if (e.key === "Enter") {
          const val = input.value;
          input.value = "";
          executeCommand(val);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (state.cmdIndex > 0) {
            state.cmdIndex--;
            input.value = state.cmdHistory[state.cmdIndex] || "";
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (state.cmdIndex < state.cmdHistory.length - 1) {
            state.cmdIndex++;
            input.value = state.cmdHistory[state.cmdIndex] || "";
          } else {
            state.cmdIndex = state.cmdHistory.length;
            input.value = "";
          }
        }
      });
    }

    const nextBtn = document.getElementById("bb-btn-morph");
    if (nextBtn) nextBtn.onclick = () => morphToNextSystem();

    const fsBtn = document.getElementById("bb-btn-fullscreen");
    const appEl = document.getElementById("blackbox-app");

    function syncFullscreen() {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      document.body.classList.toggle("bb-fullscreen", isFs);
      if (fsBtn) fsBtn.textContent = isFs ? "✕ Exit Fullscreen" : "⛶ Fullscreen";
    }

    if (fsBtn) {
      fsBtn.onclick = async () => {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        try {
          if (!isFs) {
            await (appEl || document.documentElement).requestFullscreen();
          } else {
            await document.exitFullscreen();
          }
        } catch (err) {
          document.body.classList.toggle("bb-fullscreen");
        }
      };
    }

    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);

    // Restore from cookie if available
    const saved = loadSavedState();
    if (saved && saved.seed && !saved.resolved) {
      state.solvedCount = saved.solvedCount || 0;
      state.streak = saved.streak || 0;
      state.bestTimeSec = saved.bestTimeSec || null;
      state.discoveredTools = Array.isArray(saved.discoveredTools) ? saved.discoveredTools : [];
      state.cmdHistory = Array.isArray(saved.cmdHistory) ? saved.cmdHistory : [];
      state.cmdIndex = state.cmdHistory.length;

      state.anomaly = buildProceduralAnomaly(saved.seed, saved.archIdx);
      state.anomaly.stage1Done = Boolean(saved.stage1Done);
      state.anomaly.stage2Done = Boolean(saved.stage2Done);
      state.anomaly.stage3Done = Boolean(saved.stage3Done);
      renderUI();

      printLine("========================================================================", "color:var(--bb-primary)");
      printLine(` ${state.anomaly.arch.sysName} // SESSION RESTORED FROM COOKIES`, "color:var(--bb-success);font-weight:700");
      printLine(` ACTIVE FAULT: ${state.anomaly.symptom}`, "color:var(--bb-danger)");
      printLine("========================================================================", "color:var(--bb-primary)");
      printLine("Press TAB for command & path completion, or type 'help' / 'dmesg'.");
    } else {
      if (saved) {
        state.solvedCount = saved.solvedCount || 0;
        state.streak = saved.streak || 0;
        state.bestTimeSec = saved.bestTimeSec || null;
        state.discoveredTools = Array.isArray(saved.discoveredTools) ? saved.discoveredTools : [];
      }
      morphToNextSystem();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBlackBox);
  } else {
    initBlackBox();
  }
})();

