import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

export const meta = {
  id: 'wxwidgets',
  name: 'wxWidgets',
  category: 'cross-platform',
  color: 'cyan',
  description: 'C++ cross-platform GUI library with native widgets on each platform',
  website: 'https://www.wxwidgets.org',
};

/**
 * wxWidgets 本身是一个 C++ GUI 库，不像 Electron/Qt 那样有“统一命名的 Framework 包”，
 * 不同应用的打包方式差异很大，因此这里采用“弱特征组合”做一个尽量不误报的探测：
 *
 * - macOS：
 *   - 在二进制链接的动态库里查找典型符号（如 wx 或 wx_base 系列 dylib）
 *   - 在 Resources 中查找带有 wx 前缀的资源目录 / 配置文件（非常弱，只做补充）
 *
 * - Windows：
 *   - 扫描目录下的 DLL，查找常见的 wxWidgets 动态库名称（wxmswXXu_core.dll 等）
 *
 * 由于生态非常分散，该检测不会 100% 覆盖所有 wxWidgets 应用，但能把“显式带 wx 库”的主流打包方式识别出来。
 */
export function detect(appPath, platform) {
  const evidence = [];

  if (platform === 'darwin') {
    const macosDir = path.join(appPath, 'Contents', 'MacOS');
    const resourcesDir = path.join(appPath, 'Contents', 'Resources');

    // 1) 通过 otool -L 查看主二进制是否链接 wx 相关 dylib
    try {
      const binaries = fs.readdirSync(macosDir);
      for (const bin of binaries) {
        const binPath = path.join(macosDir, bin);
        const stat = fs.statSync(binPath);
        if (!stat.isFile()) continue;

        // 尽量避免对所有二进制都跑 otool -L，这里只对主可执行文件跑一遍
        if (bin !== path.basename(appPath, '.app')) continue;

        try {
          const output = execFileSync('otool', ['-L', binPath], {
            timeout: 3000,
            maxBuffer: 256 * 1024,
          }).toString();

          if (output.match(/libwx.*\.dylib/)) {
            evidence.push('Links wxWidgets dynamic library (libwx*.dylib)');
          }
        } catch {
          // ignore otool errors
        }
        break;
      }
    } catch {
      // ignore
    }

    // 2) Resources 下存在明显 wx 前缀的资源目录/文件（很弱，只做加分）
    try {
      const items = fs.readdirSync(resourcesDir);
      const wxResources = items.filter((item) => item.toLowerCase().startsWith('wx'));
      if (wxResources.length > 0) {
        evidence.push(`Resources contains wx* assets (${wxResources.slice(0, 3).join(', ')})`);
      }
    } catch {
      // ignore
    }
  } else if (platform === 'win32') {
    // Windows 上 wxWidgets 通常以 wxmswXXu*.dll 命名
    const wxDllPatterns = [
      /^wxmsw\d+u_core\.dll$/i,
      /^wxmsw\d+u_xrc\.dll$/i,
      /^wxbase\d+u\.dll$/i,
      /^wxmsw\d+u_adv\.dll$/i,
    ];

    try {
      const files = fs.readdirSync(appPath);
      for (const f of files) {
        if (!f.toLowerCase().endsWith('.dll')) continue;
        if (wxDllPatterns.some((re) => re.test(f))) {
          evidence.push(f);
        }
      }
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

