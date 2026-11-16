# MERA Static Website & Download Portal

This directory contains the completely independent, production-ready static website and distribution portal for **MERA Remote Device Management**.

---

## 🌟 Key Features & Guarantees

1. **100% Independent Project**:
   - The entire website lives exclusively inside this `website/` directory.
   - You can copy **ONLY** this `website/` folder to any server, static hosting platform, or CDN without needing the backend, Android Admin, Android Agent, or Windows Agent projects.
2. **Zero Backend Required for Hosting**:
   - Built with pure semantic HTML5, modern responsive CSS3, and lightweight vanilla JavaScript.
   - No Node.js build step, bundler, or server runtime is required to serve the website.
3. **Dynamic & Configurable Download Mechanism**:
   - Download URLs and release versions are centrally defined in `js/config.js`.
   - You can change download links, target filenames, or point to an external AWS S3/CloudFront bucket simply by editing `js/config.js` without touching HTML.
4. **Zero Secrets or API Keys**:
   - Absolutely no backend secrets, database connection strings, or private keys exist in this portal.
5. **Direct Binary Drop-in**:
   - When new Android and Windows agents are built, simply copy their release files into `website/downloads/`:
     - Android Agent: `website/downloads/mera-android-agent.apk`
     - Windows Agent: `website/downloads/mera-windows-agent.exe`
     - Admin App (optional): `website/downloads/mera-admin.apk`
   - The website buttons will immediately download the latest binaries.

---

## 📂 Project Structure

```text
website/
├── index.html                  # Main static landing page & download portal
├── README.md                   # This standalone documentation guide
├── css/
│   └── styles.css              # Cyber-futuristic, responsive, WCAG-compliant styling
├── js/
│   ├── config.js               # Central download URL and release configuration
│   └── app.js                  # Accessible tabs, FAQ accordions, and copy buttons
├── assets/
│   ├── icons/                  # Scalable vector graphics (Logo, Android, Windows, Shield, etc.)
│   └── images/                 # Architecture diagram & live dashboard vector graphics
├── downloads/                  # Static release binary storage directory
│   ├── mera-android-agent.apk  # Official compiled Android Agent release APK
│   ├── mera-windows-agent.exe  # Target drop-in path for Windows Agent release executable
│   └── mera-admin.apk          # Official compiled Admin Controller APK
└── deployment/                 # Ready-to-use configs & guides for major static hosts
    ├── README.md               # Overview of deployment options
    ├── cloudflare-pages.md     # Cloudflare Pages deployment instructions
    ├── netlify.md              # Netlify static deployment guide & netlify.toml
    ├── vercel.md               # Vercel static deployment guide & vercel.json
    ├── github-pages.md         # GitHub Pages automated action & manual deploy guide
    ├── s3-cloudfront.md        # AWS S3 + CloudFront static hosting architecture
    ├── nginx.conf              # Production Nginx virtual host configuration
    └── Dockerfile              # Ultra-lightweight Alpine Nginx container setup
```

---

## 🚀 Local Preview

You can test and preview the website locally using any standard static file server:

### Option A: Python (Built-in on Windows/Mac/Linux)
```bash
cd website
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your web browser.

### Option B: Node.js / npx serve
```bash
cd website
npx serve .
```

### Option C: PHP Built-in Server
```bash
cd website
php -S localhost:8000
```

---

## ⚙️ Configuring Download URLs (`js/config.js`)

All download links are managed in `js/config.js`. To update URLs or point to an external CDN:

```javascript
window.MERA_CONFIG = {
  version: "1.0.0",
  releaseDate: "2026-11-06",

  downloads: {
    androidAgent: {
      url: "downloads/mera-android-agent.apk", // Or "https://cdn.example.com/releases/mera-android-agent.apk"
      filename: "mera-android-agent.apk",
      version: "v1.0.0"
    },
    windowsAgent: {
      url: "downloads/mera-windows-agent.exe", // Or "https://cdn.example.com/releases/mera-windows-agent.exe"
      filename: "mera-windows-agent.exe",
      version: "v1.0.0"
    }
  }
};
```

---

## 📦 Copying Built Release Binaries

When you build new versions of the client agents:

1. **Android Agent**:
   Copy your release APK to:
   ```bash
   website/downloads/mera-android-agent.apk
   ```

2. **Windows Agent**:
   Copy your release executable to:
   ```bash
   website/downloads/mera-windows-agent.exe
   ```

3. **Admin Android Controller**:
   Copy the admin APK to:
   ```bash
   website/downloads/mera-admin.apk
   ```

---

## 🌐 Deploying to Hosting Platforms

Detailed deployment guides with configuration files are provided in [`deployment/`](./deployment/):

- **Cloudflare Pages**: Fast global CDN, zero configuration required. [Guide](./deployment/cloudflare-pages.md)
- **Netlify**: Drag-and-drop or Git connected. [Guide](./deployment/netlify.md)
- **Vercel**: Instant static hosting. [Guide](./deployment/vercel.md)
- **GitHub Pages**: Free hosting directly from a GitHub repository branch or action. [Guide](./deployment/github-pages.md)
- **AWS S3 + CloudFront**: Scalable enterprise static storage and SSL distribution. [Guide](./deployment/s3-cloudfront.md)
- **Nginx / Linux VPS**: Standalone virtual host config. [Nginx Config](./deployment/nginx.conf)
- **Docker**: Single-command container deployment via Nginx Alpine. [Dockerfile](./deployment/Dockerfile)
