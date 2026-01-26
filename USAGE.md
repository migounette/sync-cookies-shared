# Sync Cookies Shared - Usage Guide

## Overview
This extension allows you to securely export and import cookies between browsers using AES-256-GCM encryption with browser fingerprint protection.

## Features
- **Export Cookies**: Encrypt and push selected cookies to GitHub Gist or Local Download
- **Import Cookies**: Fetch and decrypt cookies from backend providers
- **Browser Protection**: Prevents importing cookies to the same browser they were exported from
- **Activity Logging**: Track all operations in a dedicated log window

## Setup

### 1. Configure Backend Provider
1. Click the **Settings (⚙️)** icon in the popup
2. Choose your provider:
   - **GitHub Gist**: For cloud synchronization
   - **Local Download**: For local file storage

### 2. GitHub Gist Configuration
1. Set **Gist API Server**: Default is `https://api.github.com` (or use enterprise URL)
2. Enter your **Personal Access Token** (requires `gist` scope)
3. Enter your **Gist ID** (create an empty gist first at https://gist.github.com/)
4. Click **Test Connection** to verify settings
5. Click **Save Configuration**

### 3. Local Download Configuration
- No additional settings required
- Files will be saved to your default Downloads folder

## Export Workflow

### 1. Select Cookies to Export
1. Open the extension popup
2. Use the **Domain Filter** to find specific cookies (supports wildcards like `*.example.com`)
3. Check individual cookies or use **Select All**
4. Selected cookies are highlighted in purple

### 2. Set Encryption Password
1. Enter a strong password in the **Password** field
2. Click the 👁️ icon to toggle visibility
3. Default password is `changeit` (change this!)

### 3. Push to Backend
1. Click **Push Selected** button
2. Wait for confirmation (status indicator turns green)
3. Check **Activity Log (📋)** for detailed operation info

### Export Details
- Filename: `cookies-encrypted.enc.base64` (constant name)
- Encryption: AES-256-GCM with PBKDF2 (100,000 iterations)
- Browser ID: Unique fingerprint included for protection

## Import Workflow

### 1. Fetch Encrypted Cookies
1. Open the extension popup on the **target browser**
2. Enter the **same password** used for encryption
3. Click **Sync Now** button

### 2. Import Window
1. A new window opens showing:
   - Source: Backend provider name
   - Total Count: Number of exported cookies
   - Export Date: When cookies were exported
   - Browser ID: First 16 characters of source browser fingerprint

2. **Browser Protection Warning**:
   - If importing to the same browser, a yellow warning appears:
     > ⚠️ **Warning**: These cookies were exported from this browser. Importing may cause conflicts or duplicate data.

### 3. Select Cookies to Import
1. Use **Domain Filter** to search cookies
2. Check individual cookies or use **Select All**
3. Review cookie details:
   - Name
   - Domain
   - Path
   - Expires date

### 4. Apply Import
1. Click **Apply** button
2. Each selected cookie is set using `chrome.cookies.set()`
3. Success message: "X cookies imported successfully!"
4. Window closes automatically

## Status Indicator
Located in the top-right of the popup:
- **🟢 Green**: Operation successful
- **🔵 Blue**: Processing
- **🟡 Yellow**: Warning or error
- **⚪ Gray**: Ready/idle

## Activity Log
1. Click the **📋 icon** in the popup header
2. View all operations with timestamps
3. Filter by provider: `[GitHub Gist]` or `[Local Download]`
4. Click **Clear All Logs** to reset

## Keyboard Shortcuts
- **Filter Field**: Start typing to filter immediately
- **Select All Checkbox**: Click header checkbox for quick selection
- **Password Field**: Enter key submits the form

## Security Features

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: Random 16-byte salt per export
- **IV**: Random 12-byte IV per export

### Browser Fingerprint
Generated from:
- User Agent
- Platform
- Language
- Hardware Concurrency
- Screen Resolution

Hashed with SHA-256 to create unique 64-character ID.

### Protection Mechanism
1. Export: Browser ID embedded in encrypted data
2. Import: Current browser ID compared with export ID
3. Warning: Displayed if IDs match (same browser)

## Troubleshooting

### "Backend not configured"
- Open Settings and configure your backend provider
- For GitHub: Enter API URL, Token, and Gist ID
- Click Test Connection to verify

### "Password required"
- Enter the encryption password in the Password field
- Must match the password used during export

### "GitHub API error"
- Check your Personal Access Token has `gist` scope
- Verify Gist ID exists and is accessible
- For enterprise: Ensure API server URL is correct

### "Manual import required" (Local Download)
- Local Download provider cannot auto-fetch files
- Manually import by selecting the file (feature pending)

### Import window doesn't open
- Check browser popup blocker settings
- Verify encrypted data was fetched successfully
- Check Activity Log for detailed error messages

### Cookies not imported
- Verify domain accessibility (some domains are protected)
- Check cookie expiration dates
- Review browser's cookie settings and restrictions

## Best Practices

### Password Management
- Use a strong, unique password
- Store password securely (password manager recommended)
- Don't share password via insecure channels

### GitHub Gist
- Use private gists for sensitive cookies
- Rotate Personal Access Tokens regularly
- Delete old encrypted files if no longer needed

### Cookie Selection
- Only export necessary cookies
- Review domain filters before selecting all
- Be cautious with authentication cookies

### Browser ID Warning
- Always heed the same-browser warning
- Importing to the same browser may cause:
  - Duplicate cookies
  - Session conflicts
  - Authentication issues

## Development

### File Structure
```
sync-cookies-shared/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI
├── popup.css             # Main UI styling
├── popup.js              # Core logic (769 lines)
├── options.html          # Settings page
├── options.css           # Settings styling
├── options.js            # Settings logic
├── import.html           # Import window UI
├── import.css            # Import window styling
├── import.js             # Import logic (294 lines)
├── activity-log.html     # Log window UI
├── activity-log.css      # Log window styling
├── activity-log.js       # Log window logic
├── background.js         # Service worker
└── icons/                # Extension icons
    ├── cookie-icon.svg
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Key Functions

#### popup.js
- `encryptAES()`: AES-256-GCM encryption
- `generateBrowserId()`: Browser fingerprinting
- `saveToBackend()`: Route to provider
- `saveToGitHub()`: GitHub Gist integration
- `saveToLocal()`: Local file download
- `fetchFromGitHub()`: Retrieve from Gist
- `addLog()`: Activity logging

#### import.js
- `decryptAES()`: AES-256-GCM decryption
- `generateBrowserId()`: Browser fingerprinting
- `displayCookies()`: Render cookie table
- `applyCookies()`: Import selected cookies

## Support
For issues or questions, contact: yann.stephan@gmail.com

## Version
Version: 1.0.0 (Initial Release)
