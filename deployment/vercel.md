# Deploying to Vercel

Vercel provides edge delivery and simple deployment from Git or the Vercel CLI.

---

## Method 1: Deploy via Vercel CLI

1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Navigate into the `website/` directory:
   ```bash
   cd website
   ```

3. Run deployment:
   ```bash
   vercel --prod
   ```

4. Follow the brief terminal prompts (accept defaults). Vercel will output your live production URL.

---

## Method 2: Git Integration via `vercel.json`

If deploying via Git, include a `vercel.json` in `website/`:

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/downloads/(.*)\\.apk",
      "headers": [
        { "key": "Content-Type", "value": "application/vnd.android.package-archive" },
        { "key": "Content-Disposition", "value": "attachment" }
      ]
    },
    {
      "source": "/downloads/(.*)\\.exe",
      "headers": [
        { "key": "Content-Type", "value": "application/octet-stream" },
        { "key": "Content-Disposition", "value": "attachment" }
      ]
    }
  ]
}
```

In the Vercel project settings:
- **Root Directory**: `website`
- **Framework Preset**: `Other`
- **Build Command**: *(Leave empty)*
- **Output Directory**: `.`
