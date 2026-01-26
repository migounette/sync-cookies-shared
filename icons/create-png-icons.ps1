# Generate PNG icons from cookie design
Add-Type -AssemblyName System.Drawing

$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.SmoothingMode = 'AntiAlias'
    
    # Cookie base color (tan/brown)
    $cookieColor = [System.Drawing.Color]::FromArgb(212, 165, 116)
    $brush = New-Object System.Drawing.SolidBrush($cookieColor)
    $graphics.FillEllipse($brush, 0, 0, $size, $size)
    
    # Chocolate chips (dark brown)
    $darkChip = [System.Drawing.Color]::FromArgb(107, 68, 35)
    $chipBrush = New-Object System.Drawing.SolidBrush($darkChip)
    $chipSize = [Math]::Max(2, [int]($size / 8))
    
    # Add several chips
    $graphics.FillEllipse($chipBrush, $size * 0.3, $size * 0.3, $chipSize, $chipSize)
    $graphics.FillEllipse($chipBrush, $size * 0.6, $size * 0.4, $chipSize, $chipSize)
    $graphics.FillEllipse($chipBrush, $size * 0.4, $size * 0.6, $chipSize, $chipSize)
    $graphics.FillEllipse($chipBrush, $size * 0.7, $size * 0.7, $chipSize, $chipSize)
    
    # Save the image
    $outputPath = Join-Path $PSScriptRoot "icon$size.png"
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bmp.Dispose()
    $brush.Dispose()
    $chipBrush.Dispose()
    
    Write-Host "Created icon$size.png" -ForegroundColor Green
}

Write-Host ""
Write-Host "All icons created successfully!" -ForegroundColor Cyan
