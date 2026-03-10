import fs from 'fs';
import path from 'path';

export const meta = {
  id: 'reactnative',
  name: 'React Native',
  category: 'cross-platform',
  color: 'cyan',
  description: 'Facebook\'s framework for building native apps using React',
  website: 'https://reactnative.dev',
};

export function detect(appPath, platform) {
  const evidence = [];

  if (platform === 'darwin') {
    const frameworksDir = path.join(appPath, 'Contents', 'Frameworks');

    // React Native macOS (RNmacOS)
    if (fs.existsSync(path.join(frameworksDir, 'React.framework'))) {
      evidence.push('React.framework');
    }
    if (fs.existsSync(path.join(frameworksDir, 'ReactNative.framework'))) {
      evidence.push('ReactNative.framework');
    }
    if (fs.existsSync(path.join(frameworksDir, 'RCT.framework'))) {
      evidence.push('RCT.framework');
    }

    // Check for JS bundle
    const resourcesDir = path.join(appPath, 'Contents', 'Resources');
    if (fs.existsSync(path.join(resourcesDir, 'main.jsbundle'))) {
      evidence.push('main.jsbundle');
    }

    // Hermes JS engine (used by React Native)
    if (fs.existsSync(path.join(frameworksDir, 'Hermes.framework'))) {
      evidence.push('Hermes.framework (JS engine)');
    }
  } else if (platform === 'win32') {
    // React Native Windows
    if (fs.existsSync(path.join(appPath, 'ReactNative.dll'))) {
      evidence.push('ReactNative.dll');
    }
    if (fs.existsSync(path.join(appPath, 'ReactCommon.dll'))) {
      evidence.push('ReactCommon.dll');
    }
    if (fs.existsSync(path.join(appPath, 'hermes.dll'))) {
      evidence.push('hermes.dll');
    }
  }

  if (evidence.length === 0) return null;

  return {
    ...meta,
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  };
}
