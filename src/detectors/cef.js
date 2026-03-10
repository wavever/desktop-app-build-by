import fs from 'fs';
import path from 'path';

export const meta = {
  id: 'cef',
  name: 'CEF (Chromium Embedded Framework)',
  category: 'cross-platform',
  color: 'yellow',
  description: 'Embeds Chromium browser in native apps (used by Spotify, Steam, etc.)',
  website: 'https://bitbucket.org/chromiumembedded/cef',
};

export function detect(appPath, platform) {
  const evidence = [];

  if (platform === 'darwin') {
    const frameworksDir = path.join(appPath, 'Contents', 'Frameworks');

    if (fs.existsSync(path.join(frameworksDir, 'Chromium Embedded Framework.framework'))) {
      evidence.push('Chromium Embedded Framework.framework');
    }
    // Some apps bundle CEF differently
    if (fs.existsSync(path.join(frameworksDir, 'cef_sandbox.a'))) {
      evidence.push('cef_sandbox.a');
    }
    // Check helper apps for CEF pattern
    try {
      const items = fs.readdirSync(frameworksDir).catch?.(() => []) ?? fs.readdirSync(frameworksDir);
      const hasCefHelper = items.some((item) => item.includes('Helper') && item.endsWith('.app'));
      const hasCefFramework = evidence.length > 0;
      if (hasCefHelper && hasCefFramework) {
        evidence.push('CEF Helper apps');
      }
    } catch {
      // ignore
    }
  } else if (platform === 'win32') {
    if (fs.existsSync(path.join(appPath, 'libcef.dll'))) {
      evidence.push('libcef.dll');
    }
    if (fs.existsSync(path.join(appPath, 'cef.pak'))) {
      evidence.push('cef.pak');
    }
    if (fs.existsSync(path.join(appPath, 'cef_100_percent.pak'))) {
      evidence.push('cef_100_percent.pak');
    }
    if (fs.existsSync(path.join(appPath, 'chrome_elf.dll'))) {
      evidence.push('chrome_elf.dll');
    }
  }

  if (evidence.length === 0) return null;

  return {
    ...meta,
    confidence: evidence.includes('Chromium Embedded Framework.framework') || evidence.includes('libcef.dll') ? 'high' : 'medium',
    evidence,
  };
}
