/**
 * @fileoverview Electron Forge configuration for production builds
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Multi-platform packaging (Windows, macOS, Linux), native module rebuilding
 * Main APIs: makers configuration, build settings, resource inclusion
 * Constraints: Requires electron-vite build artifacts in dist/ directory before packaging
 * Patterns: Uses pre-built electron-vite output (dist/), not Forge's VitePlugin
 */

import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import path from 'path';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Adaptive Mastery',
    executableName: 'adaptive-mastery',
    appBundleId: 'com.adammanuel.adaptive-mastery',
    asar: true,
    // Include the data directory as an extra resource
    extraResource: [path.resolve(__dirname, 'data')],
    // Icons - Forge will pick the right format per platform
    icon: path.resolve(__dirname, 'build/icon'),
    // Only include necessary files for the packaged app
    ignore: (filePath: string) => {
      // Never ignore the root or empty path
      if (!filePath || filePath === '/') return false;

      // Always include essential app files
      if (filePath === '/package.json') return false;
      if (filePath.startsWith('/dist')) return false;
      if (filePath.startsWith('/node_modules')) return false;

      // Ignore everything else (src, configs, docs, etc.)
      return true;
    },
    // macOS specific settings
    osxSign: {},
    // Set to your notarization credentials if you have them
    // osxNotarize: {
    //   appleId: process.env.APPLE_ID,
    //   appleIdPassword: process.env.APPLE_ID_PASSWORD,
    //   teamId: process.env.APPLE_TEAM_ID,
    // },
  },
  rebuildConfig: {},
  makers: [
    // Windows installer (Squirrel)
    new MakerSquirrel({
      name: 'AdaptiveMastery',
      setupIcon: path.resolve(__dirname, 'build/icon.ico'),
      setupExe: 'AdaptiveMastery-Setup.exe',
      // Uncomment and set your icon URL for auto-updates
      // iconUrl: 'https://example.com/icon.ico',
    }),
    // macOS DMG
    new MakerDMG({
      format: 'ULFO',
      icon: path.resolve(__dirname, 'build/icon.icns'),
      name: 'AdaptiveMastery',
    }),
    // macOS ZIP (for distribution without DMG)
    new MakerZIP({}, ['darwin']),
    // Linux Debian package
    new MakerDeb({
      options: {
        maintainer: 'Adam Manuel',
        homepage: 'https://github.com/adammanuel/adaptive-mastery',
        categories: ['Education'],
        icon: path.resolve(__dirname, 'build/icon.png'),
        section: 'education',
        priority: 'optional',
      },
    }),
    // Linux RPM package
    new MakerRpm({
      options: {
        homepage: 'https://github.com/adammanuel/adaptive-mastery',
        categories: ['Education'],
        icon: path.resolve(__dirname, 'build/icon.png'),
        license: 'ISC',
      },
    }),
  ],
  // No plugins needed - electron-vite handles the build
  plugins: [],
  hooks: {
    // Ensure the build is complete before packaging
    generateAssets: async () => {
      console.log('Packaging pre-built electron-vite output from dist/ directory...');
    },
  },
};

export default config;
