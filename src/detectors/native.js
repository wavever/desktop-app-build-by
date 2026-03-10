import fs from 'fs';
import path from 'path';

export const meta = {
  id: 'native',
  name: 'Native',
  category: 'native',
  color: 'white',
  description: 'Built with platform-native technologies (Swift/Objective-C on macOS, Win32/MFC/WinUI on Windows)',
  website: null,
};

export function detect(appPath, platform) {
  const evidence = [];

  if (platform === 'darwin') {
    const frameworksDir = path.join(appPath, 'Contents', 'Frameworks');
    const macosDir = path.join(appPath, 'Contents', 'MacOS');

    // Swift runtime dylibs indicate native Swift app
    try {
      const items = fs.readdirSync(frameworksDir);
      const swiftLibs = items.filter((item) => item.startsWith('libswift') && item.endsWith('.dylib'));
      if (swiftLibs.length > 0) {
        evidence.push(`Swift runtime (${swiftLibs.length} libs)`);
      }

      // Check for AppKit/Cocoa-only app
      const hasOnlyAppleFrameworks = items.every(
        (item) =>
          item.startsWith('libswift') ||
          item.endsWith('.dylib') ||
          [
            'Sparkle.framework',
            'Mantle.framework',
            'ReactiveObjC.framework',
            'Fabric.framework',
            'Crashlytics.framework',
            'Sentry.framework',
            'SentryPrivate.framework',
          ].some((f) => item === f) ||
          item.endsWith('.bundle')
      );

      if (items.length > 0 && hasOnlyAppleFrameworks) {
        evidence.push('No cross-platform framework detected');
      }
    } catch {
      // No frameworks dir is also fine for native apps
      try {
        const binaries = fs.readdirSync(macosDir);
        if (binaries.length > 0) {
          evidence.push('macOS native binary');
        }
      } catch {
        // ignore
      }
    }

    if (evidence.length === 0) {
      evidence.push('Native macOS app (no cross-platform signatures)');
    }

    // Check Info.plist for native indicators
    const plistPath = path.join(appPath, 'Contents', 'Info.plist');
    if (fs.existsSync(plistPath)) {
      evidence.push('Info.plist present');
    }
  } else if (platform === 'win32') {
    evidence.push('Native Windows app (no cross-platform signatures)');

    // Check for typical native Windows files
    try {
      const files = fs.readdirSync(appPath);
      const exeFiles = files.filter((f) => f.endsWith('.exe'));
      if (exeFiles.length === 1) {
        evidence.push(exeFiles[0]);
      }
    } catch {
      // ignore
    }
  }

  // Native is the fallback - always returns a result
  return {
    ...meta,
    confidence: 'medium',
    evidence,
  };
}
