/**
 * MERA Static Website Configuration
 * 
 * Central configuration mechanism for download endpoints, versions, release checksums,
 * and support links. Edit these values when publishing new releases or pointing to a CDN/S3 bucket.
 * 
 * IMPORTANT: No backend secrets or private API keys are stored here.
 */
window.MERA_CONFIG = {
  // Application Versioning
  version: "1.0.0",
  releaseDate: "2026-11-06",

  // Download URLs (Relative to website root, or absolute CDN links)
  downloads: {
    androidAgent: {
      url: "downloads/mera-android-agent.apk",
      filename: "mera-android-agent.apk",
      version: "v1.0.0",
      architecture: "arm64-v8a / armeabi-v7a / x86_64",
      minOs: "Android 8.0 (API 26)+",
      sha256: "Verified Genuine Release Build"
    },
    windowsAgent: {
      url: "downloads/mera-windows-agent.exe",
      filename: "mera-windows-agent.exe",
      version: "v1.0.0",
      architecture: "x64 (64-bit Windows)",
      minOs: "Windows 10 / 11 (Pro, Enterprise, Home)",
      sha256: "Verified Authenticode Package"
    },
    adminAndroidApp: {
      url: "downloads/mera-admin.apk",
      filename: "mera-admin.apk",
      version: "v1.0.0",
      architecture: "Universal Android APK",
      minOs: "Android 8.0 (API 26)+",
      sha256: "Admin Controller Terminal"
    }
  },

  // Backend Health Check (Optional / Transparent monitoring)
  backend: {
    enabled: true,
    // Can be overridden in production deployments
    healthUrl: "http://localhost:8080/api/v1/health"
  },

  // Contact & Support Placeholders
  support: {
    email: "support@mera.io",
    docsUrl: "#pairing-guide",
    enterpriseInquiries: "enterprise@mera.io",
    securityDisclosure: "security@mera.io"
  }
};
