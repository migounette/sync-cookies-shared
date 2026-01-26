# sync-cookies-shared

A browser extension for Chrome, Edge, and Brave that allows you to synchronize and share cookies across browsers.

## Author
yann.stephan@gmail.com

## Features

- 🍪 Export cookies to JSON file
- 📥 Import cookies from JSON file
- 🔄 Sync cookies across devices using Chrome Sync
- ⚙️ Configurable auto-sync intervals
- 🎨 Beautiful cookie-themed UI
- 🔒 Secure cookie management

## Installation

### Chrome / Edge / Brave

1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Brave**: `brave://extensions/`

2. Enable "Developer mode" using the toggle in the top right corner

3. Click "Load unpacked" button

4. Select the `sync-cookies-shared` folder

5. The extension icon (🍪) should now appear in your browser toolbar

## Usage

### Export Cookies
1. Click the extension icon in your toolbar
2. Click "Export Cookies" button
3. Choose where to save the JSON file

### Import Cookies
1. Click the extension icon in your toolbar
2. Click "Import Cookies" button
3. Select a previously exported JSON file
4. Cookies will be imported into your current browser

### Sync Cookies
1. Click the extension icon in your toolbar
2. Click "Sync Now" button
3. Cookies will be stored in Chrome Sync storage
4. Enable auto-sync in settings for automatic synchronization

### Settings
1. Click the extension icon
2. Click "Settings" at the bottom
3. Configure:
   - Enable/disable cookie sync
   - Enable/disable auto-sync
   - Set sync interval (in minutes)

## Icons

The extension uses custom cookie-themed icons in three sizes:
- 16x16 pixels (toolbar)
- 48x48 pixels (extension management)
- 128x128 pixels (Chrome Web Store)

To create PNG icons from the SVG:
1. Open `icons/cookie-icon.svg` in a graphics editor (Inkscape, Adobe Illustrator, etc.)
2. Export as PNG in three sizes: 16x16, 48x48, and 128x128
3. Save as `icon16.png`, `icon48.png`, and `icon128.png` in the `icons/` folder

Alternatively, you can use online tools like [CloudConvert](https://cloudconvert.com/svg-to-png) to convert the SVG.

## Permissions

The extension requires the following permissions:
- **cookies**: To read and write cookies
- **storage**: To store cookie data and settings
- **tabs**: To interact with browser tabs
- **activeTab**: To access the current tab
- **host_permissions**: To access cookies from all websites

## Development

### File Structure
```
sync-cookies-shared/
├── manifest.json          # Extension configuration
├── popup.html            # Popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── options.html          # Settings page
├── options.css           # Settings styles
├── options.js            # Settings logic
├── background.js         # Background service worker
├── icons/
│   ├── cookie-icon.svg   # Vector icon source
│   ├── icon16.png        # 16x16 icon (to be created)
│   ├── icon48.png        # 48x48 icon (to be created)
│   └── icon128.png       # 128x128 icon (to be created)
└── README.md             # This file
```

### Technologies Used
- Manifest V3 (latest Chrome extension standard)
- Vanilla JavaScript (no frameworks required)
- Chrome Extensions API
- Chrome Storage API

## Storage Limits

Note: Chrome Sync storage has the following limits:
- Maximum items: 512
- Maximum size per item: 8KB
- Maximum total size: 100KB

For large cookie sets, the extension uses `chrome.storage.local` which has much higher limits (typically unlimited on desktop).

## Security Considerations

- Cookies are sensitive data - only share exported JSON files securely
- The extension requires broad permissions to manage cookies from all sites
- Consider the security implications before importing cookies from unknown sources
- Auto-sync uses Chrome Sync, which is encrypted and tied to your Google account

## License

This extension is provided as-is for personal use.

## Support

For issues or questions, contact: yann.stephan@gmail.com

## Version History

### v1.0.0 (2026-01-26)
- Initial release
- Cookie export/import functionality
- Chrome Sync integration
- Auto-sync feature
- Settings page
- Cookie-themed UI and icons
