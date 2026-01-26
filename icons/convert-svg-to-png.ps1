# SVG to PNG Converter Script
# This script converts cookie-icon.svg to icon16.png, icon48.png, and icon128.png

Write-Host "Cookie Icon Converter" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

$iconsDir = $PSScriptRoot
$svgFile = Join-Path $iconsDir "cookie-icon.svg"

if (-not (Test-Path $svgFile)) {
    Write-Host "Error: cookie-icon.svg not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Found: cookie-icon.svg" -ForegroundColor Green
Write-Host ""

# Check for ImageMagick
$magickPath = $null
$magickCommands = @("magick", "convert")

foreach ($cmd in $magickCommands) {
    try {
        $result = & $cmd --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $magickPath = $cmd
            break
        }
    } catch {
        continue
    }
}

if ($magickPath) {
    Write-Host "ImageMagick found! Converting SVG to PNG..." -ForegroundColor Green
    Write-Host ""
    
    $sizes = @(16, 48, 128)
    
    foreach ($size in $sizes) {
        $outputFile = Join-Path $iconsDir "icon$size.png"
        Write-Host "Generating icon$size.png..." -ForegroundColor Yellow
        
        try {
            & $magickPath $svgFile -resize "${size}x${size}" $outputFile
            if (Test-Path $outputFile) {
                Write-Host "  Created: icon$size.png" -ForegroundColor Green
            }
        } catch {
            Write-Host "  Failed to create icon$size.png" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Conversion complete!" -ForegroundColor Green
    
} else {
    Write-Host "ImageMagick not found." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To convert the SVG to PNG, you have several options:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1: Use the HTML converter" -ForegroundColor White
    Write-Host "  1. Open generate-icons.html in your web browser"
    Write-Host "  2. Click Generate All button"
    Write-Host "  3. Download each PNG file"
    Write-Host ""
    Write-Host "Option 2: Install ImageMagick" -ForegroundColor White
    Write-Host "  1. Download from: https://imagemagick.org/script/download.php"
    Write-Host "  2. Or use Chocolatey: choco install imagemagick"
    Write-Host "  3. Re-run this script"
    Write-Host ""
    Write-Host "Option 3: Use an online converter" -ForegroundColor White
    Write-Host "  1. Visit: https://cloudconvert.com/svg-to-png"
    Write-Host "  2. Upload cookie-icon.svg"
    Write-Host "  3. Convert to 16x16, 48x48, and 128x128"
    Write-Host ""
    Write-Host "Option 4: Use Inkscape or Adobe Illustrator" -ForegroundColor White
    Write-Host "  1. Open cookie-icon.svg"
    Write-Host "  2. Export as PNG in 16x16, 48x48, and 128x128 sizes"
    Write-Host ""
}

Write-Host "Opening generate-icons.html in your default browser..." -ForegroundColor Cyan
$htmlFile = Join-Path $iconsDir "generate-icons.html"
Start-Process $htmlFile

Write-Host ""
Write-Host "The HTML converter has been opened in your browser."
Write-Host "Follow the instructions to download the PNG icons."
