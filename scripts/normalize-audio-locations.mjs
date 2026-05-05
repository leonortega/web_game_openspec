import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const publicAudioRoot = path.join(root, 'public', 'audio');

const audioExts = ['.wav', '.mp3', '.ogg', '.m4a', '.flac'];

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

async function listArchiveDirs() {
  try {
    const entries = await fs.readdir(publicAudioRoot, { withFileTypes: true });
    return entries.filter(e => e.isDirectory() && e.name.startsWith('unused-archive-')).map(e => e.name);
  } catch (err) {
    return [];
  }
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
        const rel = entry.localAssetPath.replace(/^\//, '').replace(/^audio\//, '');
        referenced.add(rel);
      }
    }
  } catch (err) {
    // ignore
  }

  // 2) generic scan for /audio/ references in files
  const scanDirs = ['src', 'openspec', 'scripts', 'test_results', 'public'];
  const audioRefRegex = /\/audio\/([^\s"')]+\.(?:wav|mp3|ogg|m4a|flac))/gi;

  for (const d of scanDirs) {
    const dir = path.join(root, d);
    try {
      const stack = [dir];
      while (stack.length) {
        const cur = stack.pop();
        const entries = await fs.readdir(cur, { withFileTypes: true });
        for (const e of entries) {
          const p = path.join(cur, e.name);
          if (e.isDirectory()) {
            if (['node_modules', '.git', 'dist'].includes(e.name)) continue;
            stack.push(p);
            continue;
          }
          try {
            const text = await fs.readFile(p, 'utf8');
            let m;
            while ((m = audioRefRegex.exec(text)) !== null) {
              const rel = m[1];
              referenced.add(rel);
            }
          } catch (err) {
            // ignore binary/non-readable files
          }
        }
      }
    } catch (err) {
      // dir may not exist
    }
  }

  return referenced;
}

async function findFileInPublic(relPathParts) {
  // try direct public/audio/<rel>
  const candidate = path.join(publicAudioRoot, ...relPathParts);
  if (await exists(candidate)) return candidate;

  // try archives
  const archives = await listArchiveDirs();
  for (const a of archives) {
    const cand = path.join(publicAudioRoot, a, ...relPathParts);
    if (await exists(cand)) return cand;
  }

  // fallback: search by filename anywhere under public/audio
  const filename = relPathParts[relPathParts.length - 1];
  const found = await findFileByName(publicAudioRoot, filename);
  return found;
}

async function findFileByName(startDir, filename) {
  try {
    const stack = [startDir];
    while (stack.length) {
      const cur = stack.pop();
      const entries = await fs.readdir(cur, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(cur, e.name);
        if (e.isDirectory()) { stack.push(p); continue; }
        if (e.name === filename) return p;
      }
    }
  } catch {}
  return null;
}

function ensureDir(p) {
  return fs.mkdir(p, { recursive: true }).catch(() => {});
}

function isSfxRel(rel) {
  return rel.startsWith('sfx/') || rel.includes('/sfx/');
}

function isMusicRel(rel) {
  return rel.startsWith('music/') || rel.startsWith('source-packs/') || rel.includes('/music/') || rel.includes('source-packs');
}

(async function main() {
  console.log('Collecting referenced audio assets...');
  const refs = await collectReferenced();
  const refsArr = Array.from(refs).sort();
  console.log(`Found ${refsArr.length} referenced audio paths.`);

  if (refsArr.length === 0) {
    console.log('No referenced audio assets found. Exiting.');
    return;
  }

  // read music manifest for later updates
  const manifestPath = path.join(root, 'src', 'audio', 'musicAssetManifest.json');
  let manifestJson = null;
  try { manifestJson = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch (err) { /* ignore */ }

  const moved = [];
  const missing = [];

  for (const rel of refsArr) {
    // normalize rel to parts
    const relNorm = rel.replace(/^\//, '');
    const relParts = relNorm.split(/\//).filter(Boolean);

    // decide destination
    let destRelParts = null;
    if (isSfxRel(relNorm)) {
      // keep pack if present, otherwise misc
      // ensure path starts with sfx/
      const idx = relParts.indexOf('sfx');
      const tail = (idx >= 0) ? relParts.slice(idx + 1) : relParts;
      destRelParts = ['sfx', ...(tail.length ? tail : ['misc'])];
    } else if (isMusicRel(relNorm)) {
      // if source-packs, move under music/<pack...>
      if (relParts[0] === 'source-packs') {
        const tail = relParts.slice(1); // pack/filename
        destRelParts = ['music', ...tail];
      } else if (relParts[0] === 'music') {
        destRelParts = ['music', ...relParts.slice(1)];
      } else {
        // fallback
        const filename = relParts[relParts.length - 1];
        destRelParts = ['music', 'misc', filename];
      }
    } else {
      // unknown -> treat as music by default
      const filename = relParts[relParts.length - 1];
      destRelParts = ['music', 'misc', filename];
    }

    // find actual file in public
    const found = await findFileInPublic(relParts);
    if (!found) {
      missing.push(rel);
      console.warn(`Missing file for referenced asset: /audio/${rel}`);
      continue;
    }

    const destAbs = path.join(publicAudioRoot, ...destRelParts);
    if (path.resolve(found) === path.resolve(destAbs)) {
      // already in place
      moved.push({ from: found, to: destAbs, skipped: true });
      continue;
    }

    await ensureDir(path.dirname(destAbs));
    try {
      // if dest exists, skip move
      if (await exists(destAbs)) {
        console.log(`Destination exists, skipping move: ${path.relative(publicAudioRoot, destAbs)}`);
        moved.push({ from: found, to: destAbs, skipped: true });
      } else {
        await fs.rename(found, destAbs);
        console.log(`Moved: ${path.relative(publicAudioRoot, found)} -> ${path.relative(publicAudioRoot, destAbs)}`);
        moved.push({ from: found, to: destAbs, skipped: false });
      }
    } catch (err) {
      console.error(`Failed to move ${found} -> ${destAbs}: ${err.message}`);
      missing.push(rel);
    }

    // update manifest entries if this rel was present in manifest
    if (manifestJson && manifestJson.active) {
      for (const entry of manifestJson.active) {
        if (!entry.localAssetPath) continue;
        const entryRel = entry.localAssetPath.replace(/^\//, '').replace(/^audio\//, '');
        if (entryRel === relNorm) {
          // set new localAssetPath
          const newRel = path.posix.join('audio', ...destRelParts).replace(/\\/g, '/');
          entry.localAssetPath = '/' + newRel.replace(/^\//, '');
          console.log(`Updated manifest path for ${entry.assetKey} -> ${entry.localAssetPath}`);
        }
      }
    }
  }

  // write manifest back if changed
  if (manifestJson) {
    try {
      await fs.writeFile(manifestPath, JSON.stringify(manifestJson, null, 2) + '\n', 'utf8');
      console.log(`Wrote updated ${path.relative(root, manifestPath)}`);
    } catch (err) {
      console.error(`Failed to write manifest: ${err.message}`);
    }
  }

  console.log('\nSummary:');
  console.log(`Moved entries: ${moved.length}`);
  if (missing.length) console.log(`Missing or not moved: ${missing.length}`);
  process.exit(0);
})();
