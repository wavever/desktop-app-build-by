import fs from 'fs';
import path from 'path';

export const meta = {
  id: 'unity',
  name: 'Unity',
  category: 'cross-platform',
  color: 'white',
  description: 'Unity game engine for games and interactive applications',
  website: 'https://unity.com',
};

export function detect(appPath, platform) {
  const evidence = [];

  if (platform === 'darwin') {
    const frameworksDir = path.join(appPath, 'Contents', 'Frameworks');
    const resourcesDir = path.join(appPath, 'Contents', 'Resources');

    // Definitive signal: UnityPlayer dynamic library
    if (fs.existsSync(path.join(frameworksDir, 'UnityPlayer.dylib'))) {
      evidence.push('UnityPlayer.dylib');
    }

    // Unity data directory with managed assemblies
    const dataDir = path.join(resourcesDir, 'Data');
    if (fs.existsSync(dataDir)) {
      try {
        const dataItems = fs.readdirSync(dataDir);

        if (dataItems.includes('globalgamemanagers') || dataItems.includes('mainData')) {
          evidence.push('Unity data files (globalgamemanagers)');
        }
        if (dataItems.includes('boot.config')) {
          evidence.push('Unity boot.config');
        }

        // UnityEngine assemblies in Data/Managed/
        const managedDir = path.join(dataDir, 'Managed');
        if (fs.existsSync(managedDir)) {
          try {
            const managed = fs.readdirSync(managedDir);
            if (managed.some((f) => f.startsWith('UnityEngine') && f.endsWith('.dll'))) {
              evidence.push('UnityEngine assemblies');
            }
          } catch { /* ignore */ }
        }

        // Unity default resources
        const resDir = path.join(dataDir, 'Resources');
        if (fs.existsSync(resDir)) {
          try {
            const resItems = fs.readdirSync(resDir);
            if (resItems.some((r) => r === 'unity default resources' || r === 'unity_builtin_extra')) {
              evidence.push('Unity default resources');
            }
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }
  } else if (platform === 'win32') {
    if (fs.existsSync(path.join(appPath, 'UnityPlayer.dll'))) {
      evidence.push('UnityPlayer.dll');
    }

    // Look for *_Data/ directory with Unity content
    try {
      const files = fs.readdirSync(appPath);
      for (const f of files) {
        if (!f.endsWith('_Data')) continue;
        const fp = path.join(appPath, f);
        try { if (!fs.statSync(fp).isDirectory()) continue; } catch { continue; }

        const dataItems = fs.readdirSync(fp);
        if (dataItems.includes('globalgamemanagers')) {
          evidence.push(`Unity data: ${f}/`);
        }

        const managedDir = path.join(fp, 'Managed');
        if (fs.existsSync(managedDir)) {
          try {
            const managed = fs.readdirSync(managedDir);
            if (managed.some((m) => m.startsWith('UnityEngine'))) {
              evidence.push(`UnityEngine in ${f}/Managed/`);
            }
          } catch { /* ignore */ }
        }
        break;
      }
    } catch { /* ignore */ }
  }

  if (evidence.length === 0) return null;

  return {
    ...meta,
    confidence: evidence.some((e) => e.includes('UnityPlayer') || e.includes('UnityEngine')) ? 'high' : 'medium',
    evidence,
  };
}
