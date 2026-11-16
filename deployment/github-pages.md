# Deploying to GitHub Pages

GitHub Pages provides free static hosting directly from a GitHub repository.

---

## Method 1: Deploy from a Dedicated Branch or Subfolder

1. In your GitHub repository, navigate to **Settings** > **Pages**.
2. Under **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (or a dedicated `gh-pages` branch)
   - **Folder**: `/docs` (or root `/` if the `website/` contents are on a dedicated `gh-pages` branch).
3. If keeping your whole monorepo on `main`, use GitHub Actions (Method 2 below) to deploy only the `website/` folder.

---

## Method 2: Automated GitHub Action (Recommended for Monorepo)

Create a workflow file in your repository: `.github/workflows/deploy-website.yml`:

```yaml
name: Deploy MERA Static Website

on:
  push:
    branches: [ main ]
    paths:
      - 'website/**'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          # Point strictly to the website/ directory
          path: 'website'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

This workflow automatically detects changes in `website/` and publishes only `website/` to GitHub Pages.
