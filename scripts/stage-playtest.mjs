import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'openspec', 'changes', 'extend-stage-duration');
const JSON_REPORT = path.join(REPORT_DIR, 'playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'playtest-report.md');
const PORT = 4179;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}
    await wait(500);
  }
  throw new Error(`Timed out waiting for preview server at ${url}`);
}

function estimateMinutes(stage) {
  const platformBudget = stage.platforms.reduce((sum, platform) => sum + platform.width, 0) / 1000;
  const segmentBudget = stage.segments.length * 0.6;
  const encounterBudget = stage.enemies.length * 0.35;
  const hazardBudget = stage.hazards.length * 0.18;
  const collectibleBudget = stage.collectibles.length * 0.07;
  const checkpointBudget = stage.checkpoints.length * 0.15;
  return Number(
    (platformBudget + segmentBudget + encounterBudget + hazardBudget + collectibleBudget + checkpointBudget).toFixed(2),
  );
}

function analyzeReadability(stage) {
  const boundaries = [stage.world.width / 3, (stage.world.width / 3) * 2];
  const collectibleZones = new Set(
    stage.collectibles.map((collectible) => {
      if (collectible.position.x < boundaries[0]) return 'early';
      if (collectible.position.x < boundaries[1]) return 'mid';
      return 'late';
    }),
  );
  const checkpointAnchors = [stage.playerSpawn.x, ...stage.checkpoints.map((checkpoint) => checkpoint.rect.x), stage.exit.x];
  const checkpointGaps = checkpointAnchors.slice(1).map((value, index) => value - checkpointAnchors[index]);
  const maxCheckpointGap = Math.max(...checkpointGaps);

  return {
    segmentCount: stage.segments.length,
    collectibleZones: [...collectibleZones],
    maxCheckpointGap,
    segmentPass: stage.segments.length >= 5,
    collectiblePass: collectibleZones.size >= 3,
    checkpointPass: maxCheckpointGap <= 2200,
  };
}

function checkpointReport(result) {
  return {
    activatedId: result.activatedId,
    checkpointX: result.checkpointX,
    respawnedX: result.respawnedX,
    health: result.health,
    passed: Math.abs(result.checkpointX - result.respawnedX) <= 20 && result.health === 3,
  };
}

function buildMarkdown(results) {
  const lines = [
    '# Stage Playtest Report',
    '',
    'Automated browser-assisted validation for `extend-stage-duration`.',
    '',
    '| Stage | Target | Estimated | Segments | Max Checkpoint Gap | Collectible Zones | Respawn |',
    '|---|---:|---:|---:|---:|---|---|',
  ];

  for (const result of results) {
    lines.push(
      `| ${result.stageName} | ${result.targetDurationMinutes}m | ${result.estimatedMinutes}m | ${result.readability.segmentCount} | ${result.readability.maxCheckpointGap}px | ${result.readability.collectibleZones.join(', ')} | ${result.checkpoint.passed ? 'pass' : 'fail'} |`,
    );
  }

  lines.push('', '## Notes', '');
  for (const result of results) {
    lines.push(`- **${result.stageName}**: ${result.notes.join('; ')}`);
  }

  return `${lines.join('\n')}\n`;
}

async function collectStageResults(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    if (!bridge || !game) {
      throw new Error('Missing debug handles');
    }

    const results = [];
    for (let stageIndex = 0; stageIndex < 3; stageIndex += 1) {
      bridge.forceStartStage(stageIndex);
      game.scene.start('game');

      const state = bridge.getSession().getState();
      const checkpoint = state.stageRuntime.checkpoints[state.stageRuntime.checkpoints.length - 1];
      state.player.x = checkpoint.rect.x;
      state.player.y = checkpoint.rect.y;
      bridge.consumeFrame(16);

      const latest = bridge.getSession().getState();
      const pit = latest.stageRuntime.hazards.find((hazard) => hazard.kind === 'pit');
      latest.player.x = pit.rect.x + 4;
      latest.player.y = pit.rect.y + 4;
      bridge.consumeFrame(16);
      for (let i = 0; i < 70; i += 1) {
        bridge.consumeFrame(16);
      }

      const respawnState = bridge.getSession().getState();
      results.push({
        stageName: respawnState.stage.name,
        targetDurationMinutes: respawnState.stage.targetDurationMinutes,
        stage: JSON.parse(JSON.stringify(respawnState.stage)),
        checkpoint: {
          activatedId: respawnState.activeCheckpointId,
          checkpointX: checkpoint.rect.x + 12,
          respawnedX: respawnState.player.x,
          health: respawnState.player.health,
        },
      });
    }

    return results;
  });
}

async function main() {
  const preview = spawn('cmd.exe', ['/c', 'npm.cmd', 'run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: ROOT,
    stdio: 'ignore',
  });

  try {
    await waitForServer(`http://127.0.0.1:${PORT}`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const rawResults = await collectStageResults(page);
    await browser.close();

    const results = rawResults.map((result) => {
      const estimatedMinutes = estimateMinutes(result.stage);
      const readability = analyzeReadability(result.stage);
      const checkpoint = checkpointReport(result.checkpoint);
      const notes = [];

      if (estimatedMinutes >= result.targetDurationMinutes) {
        notes.push(`estimated pace budget ${estimatedMinutes}m meets target`);
      } else {
        notes.push(`estimated pace budget ${estimatedMinutes}m is below target`);
      }

      notes.push(
        readability.segmentPass
          ? `${readability.segmentCount} segments keep progression legible`
          : `segment count too low (${readability.segmentCount})`,
      );
      notes.push(
        readability.checkpointPass
          ? `max checkpoint gap ${readability.maxCheckpointGap}px remains within tolerance`
          : `checkpoint gap ${readability.maxCheckpointGap}px is too large`,
      );
      notes.push(
        readability.collectiblePass
          ? `collectibles span ${readability.collectibleZones.join(', ')} segments`
          : `collectibles do not cover early/mid/late pacing zones`,
      );
      notes.push(checkpoint.passed ? 'late checkpoint respawn passed' : 'late checkpoint respawn failed');

      return {
        stageName: result.stageName,
        targetDurationMinutes: result.targetDurationMinutes,
        estimatedMinutes,
        readability,
        checkpoint,
        notes,
      };
    });

    const failures = results.filter(
      (result) =>
        result.estimatedMinutes < result.targetDurationMinutes ||
        !result.readability.segmentPass ||
        !result.readability.checkpointPass ||
        !result.readability.collectiblePass ||
        !result.checkpoint.passed,
    );

    await fs.writeFile(JSON_REPORT, `${JSON.stringify(results, null, 2)}\n`);
    await fs.writeFile(MD_REPORT, buildMarkdown(results));

    if (failures.length > 0) {
      throw new Error(`Stage validation failed for: ${failures.map((item) => item.stageName).join(', ')}`);
    }
  } finally {
    preview.kill();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
