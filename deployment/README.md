# MERA Static Website Deployment Guides

This folder provides step-by-step instructions and production configuration templates for deploying the `website/` folder to the most popular static hosting platforms and web servers.

Because the website requires **no build step**, deployment is straightforward: point your host to serve the static directory.

---

## Deployment Options Directory

| Platform | Recommended For | Guide |
| :--- | :--- | :--- |
| **Cloudflare Pages** | Fastest global edge delivery, generous free tier, automatic SSL | [cloudflare-pages.md](./cloudflare-pages.md) |
| **Netlify** | One-click drag-and-drop or Git continuous deployment | [netlify.md](./netlify.md) |
| **Vercel** | Seamless developer experience and CLI deployment | [vercel.md](./vercel.md) |
| **GitHub Pages** | Direct deployment from your GitHub repo / Actions | [github-pages.md](./github-pages.md) |
| **AWS S3 + CloudFront** | Enterprise infrastructure with custom domain & IAM control | [s3-cloudfront.md](./s3-cloudfront.md) |
| **Nginx (Linux VPS)** | Self-hosted servers (Ubuntu, Debian, RHEL) | [nginx.conf](./nginx.conf) |
| **Docker** | Containerized deployment using minimal Nginx Alpine image | [Dockerfile](./Dockerfile) |

---

## Important Rules for Deployment

1. **Deploy Only the `website/` Folder**:
   - If deploying via Git, set the **Root Directory** or **Publish Directory** to `website`.
   - Do NOT upload or expose the backend source code or configuration files.
2. **Binary Releases (`downloads/`)**:
   - Ensure your hosting provider allows files up to 25 MB to host the `.apk` and `.exe` binaries.
   - If hosting large binaries externally (e.g. GitHub Releases or S3), simply update the URLs in `website/js/config.js`.
3. **MIME Types**:
   - Ensure your web server serves:
     - `.apk` files with MIME type `application/vnd.android.package-archive`
     - `.exe` files with MIME type `application/octet-stream` or `application/x-msdownload`
     - `.svg` files with MIME type `image/svg+xml`
