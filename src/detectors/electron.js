import fs from 'fs';
import path from 'path';

export const meta = {
  id: 'electron',
  name: 'Electron',
  category: 'cross-platform',
  color: 'cyan',
  description: 'Cross-platform desktop apps with web technologies (HTML/CSS/JS)',
  website: 'https://www.electronjs.org',
};

export function detect(appPath, platform) {
  const evidence = [];

  if (platform === 'darwin') {
    const frameworksDir = path.join(appPath, 'Contents', 'Frameworks');
    const resourcesDir = path.join(appPath, 'Contents', 'Resources');

    if (fs.existsSync(path.join(frameworksDir, 'Electron Framework.framework'))) {
      evidence.push('Electron Framework.framework');
    }
    if (fs.existsSync(path.join(resourcesDir, 'app.asar'))) {
      evidence.push('app.asar');
    }
    if (fs.existsSync(path.join(resourcesDir, 'electron.asar'))) {
      evidence.push('electron.asar');
    }
    // Some Electron apps (e.g. VSCode) ship as unpacked app/ directory instead of app.asar
    if (
      !evidence.includes('app.asar') &&
      fs.existsSync(path.join(resourcesDir, 'app')) &&
      fs.existsSync(path.join(resourcesDir, 'app', 'package.json'))
    ) {
      evidence.push('app/ (unpacked Electron app)');
    }

    // NW.js also uses Electron-like structure but different framework name
    // Check for helper apps pattern: AppName Helper (Renderer).app
    if (evidence.length === 0 && fs.existsSync(frameworksDir)) {
      try {
        const items = fs.readdirSync(frameworksDir);
        const hasElectronHelper = items.some(
          (item) => item.includes('Helper') && item.endsWith('.app') && !item.includes('nwjs')
        );
        const hasAsar = fs.existsSync(path.join(resourcesDir, 'app.asar'));
        if (hasElectronHelper && hasAsar) {
          evidence.push('Electron Helper apps pattern');
          evidence.push('app.asar');
        }
      } catch {
        // ignore
      }
    }
  } else if (platform === 'win32') {
    // Check resources/app.asar or resources/electron.asar
    if (fs.existsSync(path.join(appPath, 'resources', 'app.asar'))) {
      evidence.push('resources/app.asar');
    }
    if (fs.existsSync(path.join(appPath, 'resources', 'electron.asar'))) {
      evidence.push('resources/electron.asar');
    }
    // Check for electron.exe or *Helper*.exe
    try {
      const files = fs.readdirSync(appPath);
      const electronExe = files.find(
        (f) => f.toLowerCase() === 'electron.exe' || f.toLowerCase().includes(' helper.exe')
      );
      if (electronExe) evidence.push(electronExe);
    } catch {
      // ignore
    }
  }

  if (evidence.length === 0) return null;

  return {
    ...meta,
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  };
}
