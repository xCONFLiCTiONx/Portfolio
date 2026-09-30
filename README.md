# Portable Static Portfolio Framework

A portable, reusable static GitHub-backed developer portfolio framework. This framework allows developers to fork the repository, make minimal configuration changes in a single file, deploy it to any static hosting service, and easily add custom browser utilities without touching core framework code.

---

## 🚀 Features

- **Centralized Configuration**: All site metadata, GitHub identity, navigation, social links, and tools are defined in a single file (`portfolio.config.json`).
- **Shared Site Shell**: Reusable header, sidebar profile card, and footer managed dynamically across all pages.
- **Independent Layout Controls**: Each tool can independently enable or disable `header`, `sidebar`, and `footer` via 3 boolean settings in `portfolio.config.json`.
- **Dynamic Tools Directory**: Tools are registered via configuration and automatically render on the `Tools` page.
- **Zero-Build Static Hosting**: Runs pure HTML, CSS, and vanilla JavaScript with no runtime servers, Node.js, databases, or build steps required for deployment.
- **Tailwind CSS Integration**: Ships with production-compiled CSS for tools, plus an optional CLI workflow for customization.
- **GitHub API Integration**: Automatically loads profile avatar, bio, repositories, and issue selector based on configured GitHub username.
- **Portable Relative Paths**: Fully compatible with subdirectory deployments (e.g. GitHub Pages project pages or custom domains).
- **Optional Worker Backends**: Supports standalone client-side tools as well as optional Cloudflare Worker backends (e.g. for API proxying or website scanning).

---

## 🛠️ Quick Start

### 1. Fork & Configure
Fork this repository, open `portfolio.config.json` at the root directory, and customize your site identity:

```json
{
  "site": {
    "name": "YourName",
    "title": "YourName — Software Developer Portfolio",
    "description": "Building open-source software and tools.",
    "author": "YourName"
  },
  "github": {
    "username": "your-github-username"
  }
}
```

### 2. Deploy
Deploy the repository as static files to any hosting service. Pre-compiled production CSS is included out-of-the-box, so no build step is required for deployment:
- Cloudflare Pages
- GitHub Pages
- Netlify / Vercel
- Any static HTTP server

---

## 💻 Local Development & Tailwind CSS Setup

If you are modifying utility styles, customizing themes, or building new tools that use Tailwind CSS, follow these steps in the root directory:

### Step 1: Initial Repository Setup
If you are setting up the project from scratch or installing Tailwind for the first time:
```bash
npm init -y
npm install -D tailwindcss
npx tailwindcss init
```

If you are cloning this repository with `package.json` already present, simply run:
```bash
npm install
```

### Step 2: Build & Watch Scripts
Use the NPM scripts defined in `package.json` to compile production CSS or watch for live changes:

- **Build Production Minified CSS:**
  ```bash
  npm run build:css
  ```

- **Watch Mode (Live re-compilation during development):**
  ```bash
  npm run watch:css
  ```

- **Manual Tailwind CLI Command:**
  ```bash
  npx tailwindcss -i ./css/main.css -o ./css/tailwind-output.css --minify
  ```

---

## 🧰 Creating a New Tool

Adding a new tool to your portfolio requires **zero modifications** to core framework code:

### Step 1: Copy the Example Directory
Copy the example tool folder:
```text
/tools/example-tool/
```
to a new directory:
```text
/tools/my-tool/
```

### Step 2: Edit Tool Files
Modify `index.html`, `tool.js`, and `tool.css` inside `/tools/my-tool/`. Make sure `index.html` references the framework script:
```html
<script src="../../js/framework.js"></script>
```

If your tool relies on Tailwind CSS, point its stylesheet link to the compiled production CSS:
```html
<link rel="stylesheet" href="../../css/tailwind-output.css" />
```

### Step 3: Register in Configuration
Add one entry to the `tools` array in `portfolio.config.json`:

```json
{
  "id": "my-tool",
  "name": "My New Tool",
  "description": "A description of what my tool does.",
  "path": "tools/my-tool/index.html",
  "icon": "im im-wrench",
  "category": "Utilities",
  "enabled": true,
  "githubUrl": "https://github.com/your-username/my-tool",
  "layout": {
    "header": true,
    "sidebar": false,
    "footer": true
  }
}
```

### Step 4: Deploy
Deploy your changes. Your new tool will automatically appear on the Tools directory page!

---

## 📐 Layout Controls

Each tool defines a `layout` object with three **independent boolean controls**:

```json
"layout": {
  "header": true,
  "sidebar": true,
  "footer": true
}
```

The framework supports all 8 combinations seamlessly:

| Header | Sidebar | Footer | Layout Description |
| :---: | :---: | :---: | :--- |
| `true` | `true` | `true` | Full Portfolio Shell (Header, Sidebar, Tool, Footer) |
| `true` | `true` | `false` | Header + Sidebar (No Footer) |
| `true` | `false` | `true` | Header + Footer (No Sidebar, Tool uses 100% width) |
| `true` | `false` | `false` | Header Only |
| `false` | `true` | `true` | Sidebar + Footer (No Header) |
| `false` | `true` | `false` | Sidebar Only |
| `false` | `false` | `true` | Footer Only |
| `false` | `false` | `false` | Completely Standalone (No Shared Shell) |

---

## 🌐 External Backends & Cloudflare Workers

The portfolio framework itself is 100% static and requires no backend server. Individual tools may optionally interact with external APIs or Cloudflare Workers.

For example, the **Website Grading Tool** (`SiteGrade`) utilizes an optional Cloudflare Worker (`/tools/seo-generator/sitegrade-worker/`) to perform server-side HTTP header audits and CORS proxying.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.