# RePage Cross-Platform Distribution Guide

This document outlines the official packaging, signing, notarization, and distribution workflow for **RePage** desktop applications on Windows, macOS, and Linux.

---

## 1. Supported Platforms & Installers

| Platform | Target Installers | File Extensions | File Association | Architecture |
| :--- | :--- | :--- | :--- | :--- |
| **Windows** | NSIS Installer, Portable ZIP | `.exe`, `.zip` | `.urdup` (Registered via Registry) | x86_64, arm64 |
| **macOS** | Signed DMG, App Bundle | `.dmg`, `.app` | `.urdup` (UTType / Info.plist) | Universal (Apple Silicon & Intel) |
| **Linux** | AppImage, DEB Package, RPM Package | `.AppImage`, `.deb`, `.rpm` | `.urdup` (`application/vnd.urdup+zip`) | x86_64, aarch64 |

---

## 2. Windows Distribution (NSIS)

### Code Signing & Installation

1. **Certificate Requirements**: Authenticode PFX Certificate (EV Certificate recommended).
2. **Build Command**:
   ```bash
   npm run tauri build -- --target x86_64-pc-windows-msvc
   ```
3. **Installer Verification**:
   - Verify Start Menu shortcut creation: `RePage.lnk`.
   - Double-click `.urdup` sample package to verify default program launch.
   - Run Windows Uninstaller via `Control Panel -> Add/Remove Programs` to ensure clean registry key removal.

---

## 3. macOS Distribution (DMG & Notarization)

### Signing & Notarization

1. **Apple Developer ID**:
   - Certificate: `Developer ID Application: RePage Foundation (XXXXXXXXXX)`.
2. **Hardened Runtime & Entitlements**:
   - Entitlements file: `src-tauri/entitlements.plist`.
3. **Notarization Pipeline**:
   ```bash
   xcrun notarytool submit src-tauri/target/release/bundle/dmg/RePage_0.1.0_x64.dmg \
     --apple-id "developer@repage.org" \
     --team-id "XXXXXXXXXX" \
     --wait
   xcrun stapler staple src-tauri/target/release/bundle/dmg/RePage_0.1.0_x64.dmg
   ```

---

## 4. Linux Distribution (AppImage / DEB / RPM)

### Runtime Dependencies

- **WebKit2GTK**: `webkit2gtk-4.1` (Required for desktop rendering engine).
- **FontConfig**: `fontconfig` (Required for font loading and system font enumeration).
- **OpenSSL**: `libssl3` / `openssl`.

### MIME Type Registration (`.desktop` File)

```ini
[Desktop Entry]
Name=RePage
Comment=Authentic Urdu Document Publishing System
Exec=repage %U
Icon=repage
Terminal=false
Type=Application
Categories=Office;Publishing;
MimeType=application/vnd.urdup+zip;
```
