# How to Package the Extension

## Manual Packaging

### For Testing (Load Unpacked)
1. Open Chrome/Edge/Brave
2. Navigate to extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `sync-cookies-shared` folder

### For Distribution (Create .zip)

**Windows PowerShell:**
```powershell
# Navigate to parent directory
cd c:\_code\_public

# Create zip file (exclude unnecessary files)
Compress-Archive -Path "sync-cookies-shared\*" `
  -DestinationPath "sync-cookies-shared.zip" `
  -Force `
  -CompressionLevel Optimal `
  -Update

# Or exclude specific files
$exclude = @("*.git*", "*.md", "convert-*.ps1", "generate-icons.html")
Get-ChildItem -Path "sync-cookies-shared" -Recurse -File | 
  Where-Object { $exclude -notcontains $_.Extension } |
  Compress-Archive -DestinationPath "sync-cookies-shared.zip" -Update
```

**Linux/Mac:**
```bash
cd /path/to/parent
zip -r sync-cookies-shared.zip sync-cookies-shared/ \
  -x "*.git*" "*.md" "*convert*.ps1" "*generate-icons.html"
```

## Publishing to Chrome Web Store

1. Create a developer account at https://chrome.google.com/webstore/devconsole
2. Pay the one-time $5 registration fee
3. Create a new item
4. Upload the .zip file
5. Fill in the store listing:
   - Detailed description
   - Screenshots
   - Icon (already included)
   - Category: Productivity
   - Privacy policy (if collecting data)
6. Submit for review

## Publishing to Microsoft Edge Add-ons

1. Create a partner account at https://partner.microsoft.com/dashboard
2. Register as an extension developer
3. Upload the same .zip file
4. Fill in store listing details
5. Submit for review

## Notes

- The same package works for Chrome, Edge, and Brave (all use Chromium)
- Make sure to test thoroughly before publishing
- Keep your extension updated with security patches
- Respond to user reviews and feedback
- Follow store policies and guidelines

## Version Updates

When updating the extension:
1. Update version number in `manifest.json`
2. Document changes in a changelog
3. Test all features
4. Create new package
5. Upload to stores

## Required Files for Package

Ensure these files are included:
- ✅ manifest.json
- ✅ popup.html, popup.css, popup.js
- ✅ options.html, options.css, options.js
- ✅ background.js
- ✅ icons/icon16.png, icon48.png, icon128.png
- ❌ README.md (optional, not needed in package)
- ❌ .gitignore (not needed in package)
- ❌ convert scripts (not needed in package)
