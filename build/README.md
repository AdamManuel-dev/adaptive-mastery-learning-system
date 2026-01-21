# Build Assets

This directory contains build assets for Electron Forge packaging.

## Required Icons

Place your app icons in this directory:

- `icon.png` - 512x512 or 1024x1024 PNG for Linux
- `icon.icns` - macOS icon bundle (can contain multiple sizes)
- `icon.ico` - Windows icon file (256x256 recommended)

## Generating Icons

### Option 1: From a single PNG (Recommended)

Start with a 1024x1024 PNG, then:

```bash
# Install icon conversion tools (macOS)
brew install libicns imagemagick

# Generate .icns for macOS
png2icns icon.icns icon.png

# Generate .ico for Windows
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Option 2: Use electron-icon-builder

```bash
npm install -g electron-icon-builder
electron-icon-builder --input=icon.png --output=./
```

### Option 3: Online Tools

- [CloudConvert](https://cloudconvert.com/) - PNG to ICO/ICNS
- [iConvert Icons](https://iconverticons.com/) - Multi-format conversion

## macOS Entitlements (Optional)

For macOS code signing and notarization, create `entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
</dict>
</plist>
```
