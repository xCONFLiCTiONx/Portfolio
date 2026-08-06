# Dynamic Developer Portfolio

A modern, dynamic, and GitHub-centric portfolio template designed for software developers. This portfolio automatically fetches your profile information and popular repositories directly from the GitHub API, ensuring your site is always up to date with your latest work.

## 🚀 Features

- **Dynamic Content**: Automatically syncs profile details, bio, and repositories from GitHub.
- **PWA Ready**: Includes a Service Worker and web manifest for offline capabilities and installation.
- **Privacy Focused**: Includes a customizable privacy policy page for multiple projects.
- **Modern UI**: Clean, responsive layout with smooth animations and dark mode by default.
- **Lightweight**: Optimized loading with Pace.js and modern JavaScript.

## 🛠️ Getting Started

To make this portfolio your own, follow these simple steps:

### 1. Personalize the Data
Open [site.webmanifest](file:///F:/Repositories/Portfolio/site.webmanifest) and update the `github_username` field with your own details:

```json
{
  "github_username": "YOUR_GITHUB_USERNAME",
  ...
}
```

### 2. Configure Fallback (Optional)
If the manifest cannot be fetched (e.g., local file access), the site uses a fallback username defined in [js/github-fetch.js](file:///F:/Repositories/Portfolio/js/github-fetch.js). You can update it here:

```javascript
const DEFAULT_USERNAME = 'YOUR_GITHUB_USERNAME';
```

### 3. Deploy
Upload the files to any web host (GitHub Pages, Netlify, Vercel, etc.). The site will automatically fetch your data on load.

## 📜 Credits

This project utilizes several open-source libraries to provide its functionality. Credits go to the amazing developers behind them:

- **[jQuery](https://jquery.com/)** by [OpenJS Foundation](https://github.com/jquery/jquery) - Fast, small, and feature-rich JavaScript library.
- **[jQuery Validation](https://jqueryvalidation.org/)** by [Jörn Zaefferer](https://github.com/jzaefferer) - Form validation made easy.
- **[Waypoints](http://imakewebthings.com/waypoints/)** by [Caleb Troughton](https://github.com/imakewebthings) - The easiest way to trigger a function when you scroll to an element.
- **[Parallax.js](http://pixelcog.github.io/parallax.js/)** by [PixelCog](https://github.com/pixelcog/parallax.js) - Simple parallax scrolling effect.
- **[Masonry](https://masonry.desandro.com/)** by [David DeSandro](https://github.com/desandro) - Cascading grid layout library.
- **[imagesLoaded](https://imagesloaded.desandro.com/)** by [David DeSandro](https://github.com/desandro) - Detect when images have been loaded.
- **[Pace.js](https://codebyzak.github.io/pace/)** by [Zack Bloom](https://github.com/CodeByZak) - Automatic page load progress bar.
- **[Modernizr](https://modernizr.com/)** by [Modernizr Team](https://github.com/Modernizr) - Feature detection library for HTML5/CSS3.
- **[jQuery Placeholder](https://github.com/mathiasbynens/jquery-placeholder)** by [Mathias Bynens](https://github.com/mathiasbynens) - HTML5 placeholder polyfill for older browsers.

## ⚖️ License

This project is licensed under the MIT License. See the [LICENSE](file:///F:/Repositories/Portfolio/LICENSE) file for details.
