# Quick Start Guide - sync-cookies-shared

## Step 1: Generate PNG Icons

The HTML converter should have opened in your browser. If not:
1. Navigate to `c:\_code\_public\sync-cookies-shared\icons\`
2. Open `generate-icons.html` in your browser
3. Icons will be auto-generated
4. Click the "Download" buttons for:
   - icon16.png
   - icon48.png
   - icon128.png
5. Save them in the `icons\` folder

## Step 2: Load Extension in Browser

### For Chrome:
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select folder: `c:\_code\_public\sync-cookies-shared`
6. Extension is now installed!

### For Edge:
1. Open Edge
2. Go to `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select folder: `c:\_code\_public\sync-cookies-shared`
6. Extension is now installed!

### For Brave:
1. Open Brave
2. Go to `brave://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select folder: `c:\_code\_public\sync-cookies-shared`
6. Extension is now installed!

## Step 3: Test the Extension

1. Click the extension icon in your toolbar (cookie icon)
2. You should see the popup with:
   - Current cookie count
   - Export Cookies button
   - Import Cookies button
   - Sync Now button
3. Click "Settings" to access the options page
4. Try exporting cookies to test functionality

## Features Overview

### Export Cookies
- Exports all cookies to a JSON file
- File is named with timestamp: `cookies-export-[timestamp].json`

### Import Cookies
- Import cookies from a previously exported JSON file
- Automatically skips invalid cookies

### Sync Cookies
- Stores cookies in local storage
- Can be configured for auto-sync at intervals

### Settings Page
- Enable/disable sync
- Configure auto-sync interval
- View storage statistics
- Clear stored cookies

## Troubleshooting

**Extension won't load:**
- Make sure all PNG icon files are present in the icons folder
- Check browser console for errors (F12)

**Icons missing:**
- Complete Step 1 above to generate PNG icons
- Or manually convert the SVG using an online tool

**Permissions denied:**
- Extension requires cookie, storage, and tab permissions
- These are necessary for the extension to function

**Sync not working:**
- Check that sync is enabled in settings
- Verify Chrome Sync is enabled in your browser

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- See [PACKAGING.md](PACKAGING.md) for distribution instructions
- Customize the extension to your needs
- Consider publishing to Chrome Web Store

## Support

Author: yann.stephan@gmail.com

Happy cookie syncing! 🍪
