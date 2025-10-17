#!/bin/bash

# Simple script to create app icons
# Create a simple 512x512 icon using SF Symbols or emoji

echo "🎨 Creating app icon..."

# Create a temp SVG with emoji
cat > /tmp/icon.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#grad)"/>
  <text x="256" y="320" font-size="280" text-anchor="middle" fill="white">🏆</text>
</svg>
EOF

# Convert SVG to PNG if rsvg-convert is available
if command -v rsvg-convert &> /dev/null; then
    rsvg-convert -w 512 -h 512 /tmp/icon.svg > electron/icon.png
elif command -v convert &> /dev/null; then
    convert -background none /tmp/icon.svg -resize 512x512 electron/icon.png
else
    echo "⚠️  Please install imagemagick or librsvg to generate icons"
    echo "For now, using a placeholder"
    # Create a simple PNG with just background
    sips -s format png -z 512 512 /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns --out electron/icon.png 2>/dev/null || true
fi

echo "✅ PNG icon created: electron/icon.png"

# For Mac: create icns (requires iconutil)
if [ -f electron/icon.png ]; then
    mkdir -p electron/icon.iconset
    
    sips -z 16 16     electron/icon.png --out electron/icon.iconset/icon_16x16.png
    sips -z 32 32     electron/icon.png --out electron/icon.iconset/icon_16x16@2x.png
    sips -z 32 32     electron/icon.png --out electron/icon.iconset/icon_32x32.png
    sips -z 64 64     electron/icon.png --out electron/icon.iconset/icon_32x32@2x.png
    sips -z 128 128   electron/icon.png --out electron/icon.iconset/icon_128x128.png
    sips -z 256 256   electron/icon.png --out electron/icon.iconset/icon_128x128@2x.png
    sips -z 256 256   electron/icon.png --out electron/icon.iconset/icon_256x256.png
    sips -z 512 512   electron/icon.png --out electron/icon.iconset/icon_256x256@2x.png
    sips -z 512 512   electron/icon.png --out electron/icon.iconset/icon_512x512.png
    cp electron/icon.png electron/icon.iconset/icon_512x512@2x.png
    
    iconutil -c icns electron/icon.iconset -o electron/icon.icns
    rm -rf electron/icon.iconset
    
    echo "✅ macOS icon created: electron/icon.icns"
fi

# For Windows: create ico (requires convert from ImageMagick)
if [ -f electron/icon.png ] && command -v convert &> /dev/null; then
    convert electron/icon.png -define icon:auto-resize=256,128,64,48,32,16 electron/icon.ico
    echo "✅ Windows icon created: electron/icon.ico"
elif [ -f electron/icon.png ]; then
    # Fallback: just copy png as ico
    cp electron/icon.png electron/icon.ico
    echo "⚠️  ImageMagick not found, icon.ico is actually PNG"
fi

rm -f /tmp/icon.svg

echo ""
echo "🎉 Icons created!"
echo "   - electron/icon.png (universal)"
echo "   - electron/icon.icns (macOS)"
echo "   - electron/icon.ico (Windows)"

