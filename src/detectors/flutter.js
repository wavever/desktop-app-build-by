import fs from 'fs';
import path from 'path';

export const meta = {
  id: 'flutter',
  name: 'Flutter',
  category: 'cross-platform',
  color: 'blue',
  description: 'Google\'s UI toolkit for building natively compiled applications',
  website: 'https://flutter.dev',
};

export function detect(appPath, platform) {
  const evidence = [];

  if (platform === 'darwin') {
    const frameworksDir = path.join(appPath, 'Contents', 'Frameworks');

    if (fs.existsSync(path.join(frameworksDir, 'FlutterMacOS.framework'))) {
      evidence.push('FlutterMacOS.framework');
    }
    if (fs.existsSync(path.join(frameworksDir, 'App.framework'))) {
      const flutterAssets = path.join(frameworksDir, 'App.framework', 'flutter_assets');
      if (fs.existsSync(flutterAssets)) {
        evidence.push('App.framework/flutter_assets');
      } else {
        evidence.push('App.framework');
      }
    }

    const resourcesDir = path.join(appPath, 'Contents', 'Resources');
    if (fs.existsSync(path.join(resourcesDir, 'flutter_assets'))) {
      evidence.push('flutter_assets');
    }
  } else if (platform === 'win32') {
    if (fs.existsSync(path.join(appPath, 'flutter_windows.dll'))) {
      evidence.push('flutter_windows.dll');
    }
    if (fs.existsSync(path.join(appPath, 'data', 'flutter_assets'))) {
      evidence.push('data/flutter_assets');
    }
    if (fs.existsSync(path.join(appPath, 'data', 'app.so'))) {
      evidence.push('data/app.so');
    }
  }

  if (evidence.length === 0) return null;

  return {
    ...meta,
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  };
}
