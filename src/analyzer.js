import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { detectStack } from './detectors/index.js';

/**
 * Get the disk usage of an app directory in bytes.
 * Uses `du -sk` on macOS/Linux (very fast, ~5-50ms).
 * Falls back to recursive file walk on Windows.
 * @param {string} appPath
 * @returns {number} size in bytes, or 0 on error
 */
function getAppSize(appPath) {
  if (process.platform !== 'win32') {
    try {
      const out = execFileSync('du', ['-sk', appPath], {
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString();
      const kb = parseInt(out.split('\t')[0], 10);
      return isNaN(kb) ? 0 : kb * 1024;
    } catch {
      return 0;
    }
  }

  // Windows: recursive walk
  let total = 0;
  const walk = (dir) => {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          try { total += fs.statSync(full).size; } catch { /* skip */ }
        }
      }
    } catch { /* skip inaccessible dirs */ }
  };
  walk(appPath);
  return total;
}

/**
 * Format bytes into a human-readable size string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatSize(bytes) {
  if (bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Read macOS app Info.plist as raw text for basic metadata extraction.
 * @param {string} appPath
 * @returns {{ bundleId?: string, version?: string, executable?: string } | null}
 */
function readPlistMetadata(appPath) {
  const plistPath = path.join(appPath, 'Contents', 'Info.plist');
  if (!fs.existsSync(plistPath)) return null;

  try {
    const content = fs.readFileSync(plistPath, 'utf8');

    const extract = (key) => {
      const re = new RegExp(`<key>${key}<\\/key>\\s*<string>([^<]+)<\\/string>`);
      const m = content.match(re);
      return m ? m[1] : undefined;
    };

    return {
      bundleId: extract('CFBundleIdentifier'),
      version: extract('CFBundleShortVersionString') || extract('CFBundleVersion'),
      executable: extract('CFBundleExecutable'),
      displayName: extract('CFBundleDisplayName') || extract('CFBundleName'),
    };
  } catch {
    return null;
  }
}

/**
 * Get app icon path (for display purposes).
 * @param {string} appPath
 * @param {string} platform
 * @returns {string | null}
 */
function getAppIcon(appPath, platform) {
  if (platform === 'darwin') {
    const resourcesDir = path.join(appPath, 'Contents', 'Resources');
    try {
      const items = fs.readdirSync(resourcesDir);
      const icon = items.find((item) => item.endsWith('.icns'));
      return icon ? path.join(resourcesDir, icon) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Analyze a single application and return a complete result object.
 * @param {{ name: string, path: string, platform: string }} app
 * @returns {AnalysisResult}
 */
export function analyzeApp(app) {
  const { name, path: appPath, platform } = app;

  const detection = detectStack(appPath, platform);
  const metadata = platform === 'darwin' ? readPlistMetadata(appPath) : null;
  const sizeBytes = getAppSize(appPath);

  return {
    name: metadata?.displayName || name,
    path: appPath,
    platform,
    stack: detection.id,
    stackName: detection.name,
    category: detection.category,
    confidence: detection.confidence,
    evidence: detection.evidence,
    color: detection.color,
    description: detection.description,
    website: detection.website,
    metadata: metadata || {},
    sizeBytes,
  };
}

/**
 * Analyze multiple apps with a progress callback.
 * @param {{ name: string, path: string, platform: string }[]} apps
 * @param {(current: number, total: number, name: string) => void} [onProgress]
 * @returns {AnalysisResult[]}
 */
export function analyzeApps(apps, onProgress) {
  const results = [];

  for (let i = 0; i < apps.length; i++) {
    const app = apps[i];
    if (onProgress) onProgress(i + 1, apps.length, app.name);

    try {
      results.push(analyzeApp(app));
    } catch {
      // Skip apps that can't be analyzed (permission denied, etc.)
      results.push({
        name: app.name,
        path: app.path,
        platform: app.platform,
        stack: 'unknown',
        stackName: 'Unknown',
        category: 'unknown',
        confidence: 'low',
        evidence: ['Analysis failed'],
        color: 'gray',
        description: 'Could not analyze this application',
        website: null,
        metadata: {},
        sizeBytes: 0,
      });
    }
  }

  return results;
}

/**
 * Group analysis results by tech stack.
 * @param {AnalysisResult[]} results
 * @returns {Map<string, AnalysisResult[]>}
 */
export function groupByStack(results) {
  const groups = new Map();

  for (const result of results) {
    const key = result.stack;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(result);
  }

  // Sort each group alphabetically
  for (const [, apps] of groups) {
    apps.sort((a, b) => a.name.localeCompare(b.name));
  }

  return groups;
}

/**
 * @typedef {Object} AnalysisResult
 * @property {string} name
 * @property {string} path
 * @property {string} platform
 * @property {string} stack
 * @property {string} stackName
 * @property {string} category
 * @property {string} confidence
 * @property {string[]} evidence
 * @property {string} color
 * @property {string} description
 * @property {string|null} website
 * @property {object} metadata
 */
