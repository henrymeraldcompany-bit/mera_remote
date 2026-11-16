# Deploying to Cloudflare Pages

Cloudflare Pages provides fast edge static hosting, free SSL, DDoS protection, and unlimited bandwidth.

---

## Method 1: Deploy via Cloudflare Dashboard (Git Integration)

1. Push your repository to GitHub or GitLab.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Configure Build Settings:
   - **Project Name**: `mera-remote`
   - **Production Branch**: `main`
   - **Framework Preset**: `None`
   - **Build command**: *(Leave blank)*
   - **Build output directory**: `website`
5. Click **Save and Deploy**.

---

## Method 2: Deploy via Wrangler CLI (Direct Upload)

If you only want to deploy the `website/` directory directly without connecting Git:

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Log in to Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy the `website/` folder:
   ```bash
   wrangler pages deploy website --project-name=mera-remote
   ```

Your site will immediately be live on a `*.pages.dev` domain with automatic HTTPS.
