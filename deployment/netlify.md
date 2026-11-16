# Deploying to Netlify

Netlify offers one-click drag-and-drop deployment or Git continuous integration.

---

## Method 1: Netlify Drag & Drop (Zero Setup)

1. Open [Netlify Drop](https://app.netlify.com/drop).
2. Simply drag and drop the `website/` folder from your file manager onto the browser window.
3. Your website will be live in 5 seconds on a free `*.netlify.app` URL.

---

## Method 2: Git Integration with `netlify.toml`

If connecting your Git repository to Netlify:

1. Create a `netlify.toml` file inside `website/` (or in repository root):
   ```toml
   [build]
     publish = "website"
     command = ""

   [[headers]]
     for = "/downloads/*.apk"
     [headers.values]
       Content-Type = "application/vnd.android.package-archive"
       Content-Disposition = "attachment"

   [[headers]]
     for = "/downloads/*.exe"
     [headers.values]
       Content-Type = "application/octet-stream"
       Content-Disposition = "attachment"
   ```

2. Push changes to GitHub/GitLab.
3. Import the repository in Netlify Dashboard:
   - **Base directory**: `website`
   - **Publish directory**: `.` (or `website` if base directory is root)
   - **Build command**: *(Leave blank)*
4. Click **Deploy site**.
