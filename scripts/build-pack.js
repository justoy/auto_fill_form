#!/usr/bin/env node
/*
 Build and package the Chrome extension into a ZIP for upload.

 Steps:
 1) Run `npm run build` to produce `dist/`
 2) Stage required files into a temp directory
 3) Ensure manifest version matches package version (override in staged copy)
 4) Zip into `release/<name>-v<version>.zip`
*/

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const cp = require('child_process');

async function run(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = cp.spawn(cmd, { shell: true, stdio: 'inherit', ...opts });
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function copy(src, dest) {
  const stat = await fsp.stat(src);
  if (stat.isDirectory()) {
    await ensureDir(dest);
    const entries = await fsp.readdir(src);
    for (const entry of entries) {
      await copy(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    await ensureDir(path.dirname(dest));
    await fsp.copyFile(src, dest);
  }
}

async function main() {
  const root = process.cwd();
  const pkgPath = path.join(root, 'package.json');
  const manifestPath = path.join(root, 'manifest.json');

  const pkg = JSON.parse(await fsp.readFile(pkgPath, 'utf8'));
  const version = pkg.version;
  const nameSlug = (pkg.name || 'extension').replace(/[^a-z0-9\-]+/gi, '-');

  console.log(`Building ${pkg.name}@${version}...`);
  await run('npm run build');

  // Validate required files
  const requiredFiles = [
    'manifest.json',
    'settings.html',
    'dist/background.js',
    'dist/settings.js',
  ];
  for (const rf of requiredFiles) {
    const p = path.join(root, rf);
    if (!fs.existsSync(p)) {
      throw new Error(`Required file missing: ${rf}. Did the build succeed?`);
    }
  }

  // Prepare dirs
  const releaseDir = path.join(root, 'release');
  const stageDir = path.join(releaseDir, `${nameSlug}-v${version}`);
  await ensureDir(releaseDir);

  // Clean stage dir if exists
  if (fs.existsSync(stageDir)) {
    await fsp.rm(stageDir, { recursive: true, force: true });
  }
  await ensureDir(stageDir);

  // Copy required artifacts
  await copy(path.join(root, 'dist'), path.join(stageDir, 'dist'));
  if (fs.existsSync(path.join(root, 'icons'))) {
    await copy(path.join(root, 'icons'), path.join(stageDir, 'icons'));
  }
  await copy(path.join(root, 'settings.html'), path.join(stageDir, 'settings.html'));

  // Load and sync manifest version into staged copy
  const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
  const originalVersion = manifest.version;
  if (originalVersion !== version) {
    console.warn(`Manifest version (${originalVersion}) != package.json version (${version}). Using package version in staged manifest.`);
  }
  manifest.version = version;
  const stagedManifestPath = path.join(stageDir, 'manifest.json');
  await fsp.writeFile(stagedManifestPath, JSON.stringify(manifest, null, 2) + '\n');

  // Create ZIP
  const zipName = `${nameSlug}-v${version}.zip`;
  const zipPath = path.join(releaseDir, zipName);
  if (fs.existsSync(zipPath)) {
    await fsp.rm(zipPath, { force: true });
  }

  // Prefer system zip if available
  const hasZip = (() => {
    try {
      cp.execSync('command -v zip', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  if (hasZip) {
    console.log('Zipping with system zip...');
    await run(`cd ${JSON.stringify(stageDir)} && zip -r ${JSON.stringify(zipPath)} .`);
  } else {
    // Fallback: use npm dependency-less JS zip via "bestzip" attempt or naive tar.gz
    // Chrome Web Store requires .zip, so this path is unlikely on dev machines.
    throw new Error('zip CLI not found. Please install zip or add a zip tool.');
  }

  console.log(`Packed: ${zipPath}`);
  console.log('Upload this ZIP to the Chrome Web Store developer dashboard.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

