import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const publicAudioRoot = path.join(root, 'public', 'audio');
const now = new Date();
const stamp = now.toISOString().replace(/[:]/g, '-').replace(/\.\d+/, '');
const archiveName = `unused-archive-${stamp}`;
const archiveRoot = path.join(publicAudioRoot, archiveName);

const audioExts = ['.wav', '.mp3', '.ogg', '.m4a', '.flac'];

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function collectReferenced() {
  const referenced = new Set();

  // 1) music manifest
  try {
    const manifestPath = path.join(root, 'src', 'audio', 'musicAssetManifest.json');
    const raw = await fs.readFile(manifestPath, 'utf8');
    const json = JSON.parse(raw);
    for (const entry of (json.active || [])) {
      if (entry.localAssetPath) {
        const rel = entry.localAssetPath.replace(/^\//, '');
        const abs = path.join(root, 'public', rel);
        referenced.add(path.normalize(abs));
      }
    }
  } catch (err) {
    // ignore
  }

  // 2) sfx manifest file names
  try {
    const sfxPath = path.join(root, 'src', 'audio', 'sfxAssets.ts');
    const sfxRaw = await fs.readFile(sfxPath, 'utf8');
    const fileRegex = /,\s*'([a-zA-Z0-9_\-\.]+\.(?:wav|mp3|ogg))'\s*(?:,|\))/gi;
    let m;
    while ((m = fileRegex.exec(sfxRaw)) !== null) {
      const fn = m[1];
      const abs = path.join(root, 'public', 'audio', 'sfx', 'juhani-junkala-512', fn);
      referenced.add(path.normalize(abs));
    }
  } catch (err) {
    // ignore
  }

  // 3) scan repository for /audio/... occurrences
  const scanDirs = ['src', 'openspec', 'scripts', 'test_results', 'public'];
  const audioRefRegex = /(?<=\/audio\/)[^"'\s)]+\.(?:wav|mp3|ogg|m4a|flac)/gi;

  for (const d of scanDirs) {
    const dir = path.join(root, d);
    if (!(await exists(dir))) continue;
    const stack = [dir];
    while (stack.length) {
      const cur = stack.pop();
      const entries = await fs.readdir(cur, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(cur, e.name);
        if (e.isDirectory()) {
          // skip node_modules, .git, dist
          if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
          stack.push(p);
          continue;
        }
        try {
          const text = await fs.readFile(p, 'utf8');
          let m;
          while ((m = audioRefRegex.exec(text)) !== null) {
            const rel = m[0]; // e.g. music/chillmindscapes-pack-4/xxx.wav
            const abs = path.join(root, 'public', 'audio', rel);
            referenced.add(path.normalize(abs));
          }
        } catch {}
      }
    }
  }

  return referenced;
}

async function collectPublicAudioFiles() {
  const files = [];
  const rootDir = publicAudioRoot;
  if (!(await exists(rootDir))) return files;
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = await fs.readdir(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.git') continue;
        stack.push(p);
        continue;
      }
      const ext = path.extname(e.name).toLowerCase();
      if (audioExts.includes(ext)) files.push(path.normalize(p));
    }
  }
  return files;
}

(async function main() {
  console.log('Scanning referenced audio assets...');
  const referenced = await collectReferenced();
  console.log(`Referenced audio paths found: ${referenced.size}`);

  console.log('Listing public/audio files...');
  const publicFiles = await collectPublicAudioFiles();
  console.log(`Public audio files: ${publicFiles.length}`);

  const unused = publicFiles.filter(f => !referenced.has(path.normalize(f)));

  if (unused.length === 0) {
    console.log('No unused public audio files found.');
    return;
  }

  console.log(`Found ${unused.length} unused audio files. Moving to archive: ${archiveRoot}`);
  await fs.mkdir(archiveRoot, { recursive: true });

  for (const f of unused) {
    const rel = path.relative(publicAudioRoot, f);
    const dest = path.join(archiveRoot, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    try {
      await fs.rename(f, dest);
      console.log(`Moved: ${rel}`);
    } catch (err) {
      console.error(`Failed to move ${rel}: ${err.message}`);
    }
  }

  console.log(`Archive complete. Moved ${unused.length} files to ${archiveRoot}`);
})();
