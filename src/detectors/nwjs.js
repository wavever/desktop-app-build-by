import fs from 'fs';
import path from 'path';

export const meta = {
  id: 'nwjs',
  name: 'NW.js',
  category: 'cross-platform',
  color: 'cyan',
  description: 'Node.js + Chromium based desktop apps (formerly node-webkit)',
  website: 'https://nwjs.io',
};

export function detect(appPath, platform) {
  const evidence = [];

  if (platform === 'darwin') {
    const frameworksDir = path.join(appPath, 'Contents', 'Frameworks');
    const resourcesDir = path.join(appPath, 'Contents', 'Resources');

    if (fs.existsSync(path.join(frameworksDir, 'nwjs Framework.framework'))) {
      evidence.push('nwjs Framework.framework');
    }
    // NW.js apps package their app in app.nw
    if (fs.existsSync(path.join(resourcesDir, 'app.nw'))) {
      evidence.push('app.nw');
    }
    // Some NW.js apps use default_app.nw
    if (fs.existsSync(path.join(resourcesDir, 'default_app.nw'))) {
      evidence.push('default_app.nw');
    }
  } else if (platform === 'win32') {
    if (fs.existsSync(path.join(appPath, 'nw.exe'))) {
      evidence.push('nw.exe');
    }
    if (fs.existsSync(path.join(appPath, 'nw.pak'))) {
      evidence.push('nw.pak');
    }
    if (fs.existsSync(path.join(appPath, 'package.nw'))) {
      evidence.push('package.nw');
    }
    if (fs.existsSync(path.join(appPath, 'app.nw'))) {
      evidence.push('app.nw');
    }
  }

  if (evidence.length === 0) return null;

  return {
    ...meta,
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  };
}
