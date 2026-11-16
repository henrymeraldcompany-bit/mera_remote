# Deploying to AWS S3 & CloudFront

Hosting MERA on Amazon Web Services (AWS) provides high availability, custom domains via Route 53, and global edge caching via Amazon CloudFront.

---

## 1. S3 Bucket Configuration

1. Create an S3 bucket in the AWS Management Console:
   - **Bucket Name**: e.g. `mera-remote-portal`
   - **Region**: Your preferred AWS region
   - **Block Public Access**: Keep enabled if using CloudFront Origin Access Control (OAC), or uncheck if using public website hosting.
2. Under **Properties** > **Static website hosting**:
   - Enable **Static website hosting**
   - **Index document**: `index.html`
   - **Error document**: `index.html`

---

## 2. Syncing the `website/` Folder via AWS CLI

Install and configure the AWS CLI, then run:

```bash
# 1. Sync static assets with cache headers
aws s3 sync website/ s3://mera-remote-portal/ \
  --delete \
  --exclude "downloads/*" \
  --cache-control "max-age=86400, public"

# 2. Sync binary release files with download headers
aws s3 sync website/downloads/ s3://mera-remote-portal/downloads/ \
  --content-disposition "attachment" \
  --cache-control "max-age=604800, public"
```

---

## 3. CloudFront Distribution (HTTPS & Edge Delivery)

1. Navigate to **CloudFront** > **Create distribution**.
2. **Origin domain**: Select your S3 bucket.
3. **Origin access**: Select **Origin access control settings (recommended)** to keep your S3 bucket private.
4. **Viewer protocol policy**: Select **Redirect HTTP to HTTPS**.
5. **Default root object**: Set to `index.html`.
6. Attach an ACM SSL certificate for your custom domain (e.g. `devices.mera.io`).
7. Save changes. After deployment finishes, invalidate the cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```
