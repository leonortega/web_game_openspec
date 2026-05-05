import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const CHANGE_NAME = 'exit-cabin-door-open-animation';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'stage-start-playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'stage-start-playtest-report.md');
const VITE_PREVIEW_BIN = path.join(ROOT, 'node_modules', '.bin', 'vite.cmd');
const PORT = 4194;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;
const VIEWPORT = { width: 1440, height: 900 };
const INTRO_DURATION_MS = 2400;
const ARRIVAL_DURATION_MS = 780;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}
    await wait(400);
  }

  throw new Error(`Timed out waiting for preview server at ${url}`);
}

async function waitForActiveScene(page, sceneKey, timeoutMs = 12000) {
  await page.waitForFunction(
    (key) => {
      const game = window.__CRYSTAL_RUN_GAME__;
      if (!game) {
        return false;
      }

      return game.scene.getScenes(true).some((scene) => scene.scene.key === key);
    },
    sceneKey,
    { timeout: timeoutMs },
  );
}

function attachPageLogging(page) {
  page.on('pageerror', (error) => {
    console.error(`browser page error: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      console.error(`browser console error: ${message.text()}`);
    }
  });
}

async function resetAudioDebug(page) {
  await page.evaluate(() => {
    window.__CRYSTAL_RUN_AUDIO_DEBUG__ = {
      activeOwner: null,
      events: [],
      lastCue: null,
      unlockCount: 0,
    };
  });
}

async function readAudioDebug(page) {
  return page.evaluate(() => window.__CRYSTAL_RUN_AUDIO_DEBUG__ ?? null);
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  attachPageLogging(page);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForActiveScene(page, 'menu');
  await page.locator('canvas').click({ position: { x: 24, y: 24 } });
  return page;
}

async function readStageIntroSnapshot(page) {
  return page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('stage-intro');
    return typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
  });
}

async function readGameSnapshot(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
    const state = bridge.getSession().getState();
    return {
      debug,
      state: {
        stageIndex: state.stageIndex,
        stageStartCabinCenterX: state.stage.startCabin.centerX,
        stageStartCabinBaseY: state.stage.startCabin.baseY,
        playerX: state.player.x,
        playerY: state.player.y,
        playerDead: state.player.dead,
        respawnTimerMs: state.respawnTimerMs,
        activeCheckpointId: state.activeCheckpointId,
      },
      activeScenes: game.scene.getScenes(true).map((activeScene) => activeScene.scene.key),
    };
  });
}

async function waitForArrivalToResolve(page, timeoutMs = 4000) {
  await page.waitForFunction(
    () => {
      const game = window.__CRYSTAL_RUN_GAME__;
      const scene = game.scene.getScene('game');
      const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
      return Boolean(debug && debug.stageStartArrivalActive === false && debug.gameplayMusicStarted === true);
    },
    undefined,
    { timeout: timeoutMs },
  );
}

async function waitForArrivalCloseBeat(page, timeoutMs = 4000) {
  await page.waitForFunction(
    () => {
      const game = window.__CRYSTAL_RUN_GAME__;
      const scene = game.scene.getScene('game');
      const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
      return Boolean(
        debug &&
          debug.stageStartArrivalActive === true &&
          debug.stageStartCapsulePhase === 'closing' &&
          debug.stageStartControlLocked === true &&
          debug.stageStartCapsuleDoorClosedProgress > 0 &&
          debug.stageStartCapsuleDoorClosedProgress < 1,
      );
    },
    undefined,
    { timeout: timeoutMs },
  );
}

async function waitForArrivalWalkoutBeat(page, timeoutMs = 4000) {
  await page.waitForFunction(
    () => {
      const game = window.__CRYSTAL_RUN_GAME__;
      const scene = game.scene.getScene('game');
      const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
      return Boolean(
        debug &&
          debug.stageStartArrivalActive === true &&
          debug.stageStartCapsulePhase === 'walkout' &&
          debug.stageStartControlLocked === true &&
          debug.arrivalPlayerVisible === true &&
          debug.stageStartWalkoutProgress > 0 &&
          debug.stageStartWalkoutProgress < 1,
      );
    },
    undefined,
    { timeout: timeoutMs },
  );
}

async function startFreshFlow(page, stageIndex = 0) {
  await resetAudioDebug(page);
  await page.evaluate((targetStageIndex) => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;

    bridge.startStage(targetStageIndex);
    ['game', 'complete', 'stage-intro'].forEach((sceneKey) => {
      if (game.scene.getScenes(false).some((scene) => scene.scene.key === sceneKey)) {
        game.scene.stop(sceneKey);
      }
    });
    game.scene.start('stage-intro');
  }, stageIndex);
  await waitForActiveScene(page, 'stage-intro');
  const introSnapshot = await readStageIntroSnapshot(page);
  await waitForActiveScene(page, 'game', INTRO_DURATION_MS + 2500);
  const arrivalStart = await readGameSnapshot(page);
  await waitForArrivalWalkoutBeat(page);
  const arrivalWalkoutBeat = await readGameSnapshot(page);
  await waitForArrivalCloseBeat(page);
  const arrivalCloseBeat = await readGameSnapshot(page);
  await waitForArrivalToResolve(page);
  const arrivalResolved = await readGameSnapshot(page);
  const audioDebug = await readAudioDebug(page);

  return {
    introSnapshot,
    arrivalStart,
    arrivalWalkoutBeat,
    arrivalCloseBeat,
    arrivalResolved,
    audioDebug,
  };
}

async function forceStageCompletion(page) {
  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();

    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    state.stageRuntime.objective = null;
    state.player.x = state.stage.exit.x + 4;
    state.player.y = state.stage.exit.y;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.invulnerableMs = 0;

    bridge.consumeFrame(16);
  });
  await waitForActiveScene(page, 'complete', 12000);
}

async function runReplayFlow(page) {
  await forceStageCompletion(page);
  await page.keyboard.press('r');
  await waitForActiveScene(page, 'stage-intro');
  const introSnapshot = await readStageIntroSnapshot(page);
  await waitForActiveScene(page, 'game', INTRO_DURATION_MS + 2500);
  const arrivalStart = await readGameSnapshot(page);
  await waitForArrivalToResolve(page);
  const arrivalResolved = await readGameSnapshot(page);

  return {
    introSnapshot,
    arrivalStart,
    arrivalResolved,
  };
}

async function runAutoAdvanceFlow(page) {
  await forceStageCompletion(page);
  await waitForActiveScene(page, 'stage-intro', 8000);
  const introSnapshot = await readStageIntroSnapshot(page);
  await waitForActiveScene(page, 'game', INTRO_DURATION_MS + 2500);
  const arrivalStart = await readGameSnapshot(page);
  await waitForArrivalToResolve(page);
  const arrivalResolved = await readGameSnapshot(page);

  return {
    introSnapshot,
    arrivalStart,
    arrivalResolved,
  };
}

async function runCheckpointRespawnFlow(page) {
  const fresh = await startFreshFlow(page, 0);
  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const checkpoint = state.stageRuntime.checkpoints[0];

    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    state.player.vx = 0;
    state.player.vy = 0;
    bridge.consumeFrame(16);

    state.player.health = 1;
    state.player.invulnerableMs = 0;
    bridge.getSession().damagePlayer();
  });

  const beforeRespawn = await readGameSnapshot(page);
  await page.waitForTimeout(950);
  const afterRespawn = await readGameSnapshot(page);

  return {
    fresh,
    beforeRespawn,
    afterRespawn,
  };
}

function hasGameplayLoop(audioDebug) {
  return audioDebug?.events?.some((event) => event.type === 'music' && event.phrase === 'gameplay-loop') ?? false;
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });

  const preview =
    process.platform === 'win32'
      ? spawn('cmd.exe', ['/d', '/s', '/c', `${VITE_PREVIEW_BIN} preview --host 127.0.0.1 --port ${PORT} --strictPort`], {
          cwd: ROOT,
          stdio: 'pipe',
        })
      : spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
          cwd: ROOT,
          stdio: 'pipe',
        });

  preview.stdout.on('data', (chunk) => process.stdout.write(chunk));
  preview.stderr.on('data', (chunk) => process.stderr.write(chunk));

  const cleanup = async () => {
    if (preview.exitCode !== null || !preview.pid) {
      return;
    }

    if (process.platform === 'win32') {
      await new Promise((resolve) => {
        const killer = spawn('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' });
        killer.once('exit', () => resolve());
        killer.once('error', () => resolve());
      });
      return;
    }

    preview.kill('SIGTERM');
  };

  try {
    await waitForServer(`http://127.0.0.1:${PORT}`);
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await openPage(browser);
      try {
        const freshStart = await startFreshFlow(page, 0);
        const replay = await runReplayFlow(page);
        const autoAdvance = await runAutoAdvanceFlow(page);
        const checkpointRespawn = await runCheckpointRespawnFlow(page);

        const result = {
          freshStart: {
            introSeen: freshStart.introSnapshot !== null,
            introAccentMode: freshStart.introSnapshot?.accentMode ?? null,
            arrivalActiveAtGameStart: freshStart.arrivalStart.debug?.stageStartArrivalActive ?? null,
            arrivalPlayerHiddenAtGameStart: freshStart.arrivalStart.debug?.playerVisualVisibleCount === 0,
            arrivalCapsuleVisibleAtGameStart: freshStart.arrivalStart.debug?.arrivalCapsuleVisible ?? null,
            arrivalCabinUsesStageAnchor:
              freshStart.arrivalStart.debug?.arrivalCapsuleCenterX === freshStart.arrivalStart.state.stageStartCabinCenterX,
            arrivalPhaseAtGameStart: freshStart.arrivalStart.debug?.stageStartCapsulePhase ?? null,
            arrivalControlLockedAtGameStart: freshStart.arrivalStart.debug?.stageStartControlLocked ?? null,
            arrivalDoorStillOpenAtGameStart:
              (freshStart.arrivalStart.debug?.stageStartCapsuleDoorClosedProgress ?? Number.NaN) < 0.15,
            arrivalWalkoutInactiveAtGameStart:
              (freshStart.arrivalStart.debug?.stageStartWalkoutProgress ?? Number.NaN) === 0,
            arrivalWalkoutBecameActive:
              freshStart.arrivalWalkoutBeat.debug?.stageStartCapsulePhase === 'walkout' &&
              freshStart.arrivalWalkoutBeat.debug?.stageStartControlLocked === true &&
              freshStart.arrivalWalkoutBeat.debug?.arrivalPlayerVisible === true &&
              (freshStart.arrivalWalkoutBeat.debug?.stageStartWalkoutProgress ?? 0) > 0 &&
              (freshStart.arrivalWalkoutBeat.debug?.stageStartWalkoutProgress ?? 1) < 1,
            arrivalPlayerMovedDuringWalkout:
              (freshStart.arrivalWalkoutBeat.debug?.arrivalPlayerX ?? Number.NEGATIVE_INFINITY) >
              (freshStart.arrivalStart.debug?.arrivalPlayerX ?? Number.POSITIVE_INFINITY),
            arrivalCabinStayedFixedThroughSequence:
              freshStart.arrivalStart.debug?.arrivalCapsuleCenterX === freshStart.arrivalWalkoutBeat.debug?.arrivalCapsuleCenterX &&
              freshStart.arrivalStart.debug?.arrivalCapsuleCenterY === freshStart.arrivalWalkoutBeat.debug?.arrivalCapsuleCenterY &&
              freshStart.arrivalStart.debug?.arrivalCapsuleBaseY === freshStart.arrivalWalkoutBeat.debug?.arrivalCapsuleBaseY &&
              freshStart.arrivalStart.debug?.arrivalCapsuleCenterX === freshStart.arrivalCloseBeat.debug?.arrivalCapsuleCenterX &&
              freshStart.arrivalStart.debug?.arrivalCapsuleCenterY === freshStart.arrivalCloseBeat.debug?.arrivalCapsuleCenterY &&
              freshStart.arrivalStart.debug?.arrivalCapsuleBaseY === freshStart.arrivalCloseBeat.debug?.arrivalCapsuleBaseY &&
              freshStart.arrivalStart.debug?.arrivalCapsuleCenterX === freshStart.arrivalResolved.debug?.arrivalCapsuleCenterX &&
              freshStart.arrivalStart.debug?.arrivalCapsuleCenterY === freshStart.arrivalResolved.debug?.arrivalCapsuleCenterY &&
              freshStart.arrivalStart.debug?.arrivalCapsuleBaseY === freshStart.arrivalResolved.debug?.arrivalCapsuleBaseY,
            arrivalCabinStayedFixedWhilePlayerWalkedOut:
              freshStart.arrivalStart.debug?.arrivalCapsuleCenterX === freshStart.arrivalWalkoutBeat.debug?.arrivalCapsuleCenterX &&
              freshStart.arrivalStart.debug?.arrivalCapsuleCenterY === freshStart.arrivalWalkoutBeat.debug?.arrivalCapsuleCenterY &&
              freshStart.arrivalStart.debug?.arrivalCapsuleBaseY === freshStart.arrivalWalkoutBeat.debug?.arrivalCapsuleBaseY &&
              (freshStart.arrivalWalkoutBeat.debug?.arrivalPlayerX ?? Number.NEGATIVE_INFINITY) !==
                (freshStart.arrivalWalkoutBeat.debug?.arrivalCapsuleCenterX ?? Number.POSITIVE_INFINITY),
            gameplayMusicStartedAtGameStart: freshStart.arrivalStart.debug?.gameplayMusicStarted ?? null,
            arrivalStillActiveDuringCloseBeat: freshStart.arrivalCloseBeat.debug?.stageStartArrivalActive ?? null,
            arrivalDoorClosingDuringCloseBeat:
              freshStart.arrivalCloseBeat.debug?.stageStartCapsulePhase === 'closing' &&
              (freshStart.arrivalCloseBeat.debug?.stageStartCapsuleDoorClosedProgress ?? 0) > 0 &&
              (freshStart.arrivalCloseBeat.debug?.stageStartCapsuleDoorClosedProgress ?? 1) < 1,
            controlStillLockedDuringCloseBeat: freshStart.arrivalCloseBeat.debug?.stageStartControlLocked ?? null,
            arrivalResolved: freshStart.arrivalResolved.debug?.stageStartArrivalActive === false,
            persistentCapsuleVisibleAfterArrival:
              freshStart.arrivalResolved.debug?.persistentStartCapsuleVisible === true,
            persistentCapsuleInertAfterArrival:
              freshStart.arrivalResolved.debug?.stageStartCapsulePhase === 'inert' &&
              freshStart.arrivalResolved.debug?.stageStartCapsuleDoorClosedProgress === 1,
            persistentCapsuleBehindPlayerAfterArrival:
              (freshStart.arrivalResolved.debug?.arrivalCapsuleCenterX ?? Infinity) <
              freshStart.arrivalResolved.state.playerX + 12,
            arrivalUsesExitArt:
              freshStart.arrivalResolved.debug?.arrivalCapsuleUsesExitArt === true &&
              freshStart.arrivalResolved.debug?.arrivalCapsuleShellTextureKey === 'exit-shell' &&
              freshStart.arrivalResolved.debug?.arrivalCapsuleDoorTextureKey === 'exit-door' &&
              freshStart.arrivalResolved.debug?.exitSpriteTextureKey === 'exit-shell',
            gameplayMusicStartedAfterArrival: freshStart.arrivalResolved.debug?.gameplayMusicStarted ?? null,
            gameplayLoopSeen: hasGameplayLoop(freshStart.audioDebug),
          },
          replay: {
            introSeen: replay.introSnapshot !== null,
            arrivalActiveAtReplayStart: replay.arrivalStart.debug?.stageStartArrivalActive ?? null,
            arrivalResolved: replay.arrivalResolved.debug?.stageStartArrivalActive === false,
          },
          autoAdvance: {
            introSeen: autoAdvance.introSnapshot !== null,
            nextStageIndexAtArrival: autoAdvance.arrivalStart.state.stageIndex,
            arrivalActiveAtNextStageStart: autoAdvance.arrivalStart.debug?.stageStartArrivalActive ?? null,
            arrivalResolved: autoAdvance.arrivalResolved.debug?.stageStartArrivalActive === false,
          },
          checkpointRespawn: {
            activeSceneStayedGame: checkpointRespawn.afterRespawn.activeScenes.includes('game'),
            checkpointActivated: checkpointRespawn.beforeRespawn.state.activeCheckpointId !== null,
            playerDiedBeforeRespawn: checkpointRespawn.beforeRespawn.state.playerDead,
            arrivalStayedOffBeforeRespawn: checkpointRespawn.beforeRespawn.debug?.stageStartArrivalActive === false,
            arrivalStayedOffAfterRespawn: checkpointRespawn.afterRespawn.debug?.stageStartArrivalActive === false,
            persistentCapsuleUnaffectedByRespawn:
              checkpointRespawn.beforeRespawn.debug?.persistentStartCapsuleVisible === true &&
              checkpointRespawn.afterRespawn.debug?.persistentStartCapsuleVisible === true &&
              checkpointRespawn.beforeRespawn.debug?.stageStartCapsulePhase === 'inert' &&
              checkpointRespawn.afterRespawn.debug?.stageStartCapsulePhase === 'inert',
            persistentCapsuleStayedAtOriginalAnchor:
              checkpointRespawn.beforeRespawn.debug?.arrivalCapsuleCenterX === checkpointRespawn.afterRespawn.debug?.arrivalCapsuleCenterX &&
              checkpointRespawn.beforeRespawn.debug?.arrivalCapsuleCenterY === checkpointRespawn.afterRespawn.debug?.arrivalCapsuleCenterY &&
              checkpointRespawn.beforeRespawn.debug?.arrivalCapsuleBaseY === checkpointRespawn.afterRespawn.debug?.arrivalCapsuleBaseY,
            playerVisibleAfterRespawn:
              (checkpointRespawn.afterRespawn.debug?.playerVisualVisibleCount ?? 0) > 0 &&
              checkpointRespawn.afterRespawn.state.playerDead === false,
          },
        };

        const passed =
          result.freshStart.introSeen === true &&
          result.freshStart.introAccentMode === 'none' &&
          result.freshStart.arrivalActiveAtGameStart === true &&
          result.freshStart.arrivalPlayerHiddenAtGameStart === true &&
          result.freshStart.arrivalCapsuleVisibleAtGameStart === true &&
          result.freshStart.arrivalCabinUsesStageAnchor === true &&
          result.freshStart.arrivalPhaseAtGameStart === 'rematerialize' &&
          result.freshStart.arrivalControlLockedAtGameStart === true &&
          result.freshStart.arrivalDoorStillOpenAtGameStart === true &&
          result.freshStart.arrivalWalkoutInactiveAtGameStart === true &&
          result.freshStart.arrivalWalkoutBecameActive === true &&
          result.freshStart.arrivalPlayerMovedDuringWalkout === true &&
          result.freshStart.arrivalCabinStayedFixedThroughSequence === true &&
          result.freshStart.arrivalCabinStayedFixedWhilePlayerWalkedOut === true &&
          result.freshStart.gameplayMusicStartedAtGameStart === false &&
          result.freshStart.arrivalStillActiveDuringCloseBeat === true &&
          result.freshStart.arrivalDoorClosingDuringCloseBeat === true &&
          result.freshStart.controlStillLockedDuringCloseBeat === true &&
          result.freshStart.arrivalResolved === true &&
          result.freshStart.persistentCapsuleVisibleAfterArrival === true &&
          result.freshStart.persistentCapsuleInertAfterArrival === true &&
          result.freshStart.persistentCapsuleBehindPlayerAfterArrival === true &&
          result.freshStart.arrivalUsesExitArt === true &&
          result.freshStart.gameplayMusicStartedAfterArrival === true &&
          result.freshStart.gameplayLoopSeen === true &&
          result.replay.introSeen === true &&
          result.replay.arrivalActiveAtReplayStart === true &&
          result.replay.arrivalResolved === true &&
          result.autoAdvance.introSeen === true &&
          result.autoAdvance.nextStageIndexAtArrival === 1 &&
          result.autoAdvance.arrivalActiveAtNextStageStart === true &&
          result.autoAdvance.arrivalResolved === true &&
          result.checkpointRespawn.activeSceneStayedGame === true &&
          result.checkpointRespawn.checkpointActivated === true &&
          result.checkpointRespawn.playerDiedBeforeRespawn === true &&
          result.checkpointRespawn.arrivalStayedOffBeforeRespawn === true &&
          result.checkpointRespawn.arrivalStayedOffAfterRespawn === true &&
          result.checkpointRespawn.persistentCapsuleUnaffectedByRespawn === true &&
          result.checkpointRespawn.persistentCapsuleStayedAtOriginalAnchor === true &&
          result.checkpointRespawn.playerVisibleAfterRespawn === true;

        await fs.writeFile(JSON_REPORT, `${JSON.stringify({ ...result, passed }, null, 2)}\n`, 'utf8');
        await fs.writeFile(
          MD_REPORT,
          [
            '# Separate Grounded Start Cabin Playtest',
            '',
            `- URL: \`${BASE_URL}\``,
            `- Fresh start intro seen: \`${result.freshStart.introSeen}\``,
            `- Fresh start arrival active at game start: \`${result.freshStart.arrivalActiveAtGameStart}\``,
            `- Fresh start cabin used fixed stage anchor: \`${result.freshStart.arrivalCabinUsesStageAnchor}\``,
            `- Fresh start control stayed locked through intro sequence: \`${result.freshStart.arrivalControlLockedAtGameStart && result.freshStart.controlStillLockedDuringCloseBeat}\``,
            `- Fresh start door remained open at arrival start: \`${result.freshStart.arrivalDoorStillOpenAtGameStart}\``,
            `- Fresh start walkout became active before the close beat: \`${result.freshStart.arrivalWalkoutBecameActive}\``,
            `- Fresh start walkout moved the rematerialized player outside the capsule: \`${result.freshStart.arrivalPlayerMovedDuringWalkout}\``,
            `- Fresh start cabin stayed fixed through rematerialize, walkout, close, and inert phases: \`${result.freshStart.arrivalCabinStayedFixedThroughSequence}\``,
            `- Fresh start cabin stayed fixed while the player walked out: \`${result.freshStart.arrivalCabinStayedFixedWhilePlayerWalkedOut}\``,
            `- Fresh start door entered closing beat before control: \`${result.freshStart.arrivalDoorClosingDuringCloseBeat}\``,
            `- Fresh start reused exit shell and door art keys: \`${result.freshStart.arrivalUsesExitArt}\``,
            `- Fresh start persistent inert capsule remained behind player after arrival: \`${result.freshStart.persistentCapsuleVisibleAfterArrival && result.freshStart.persistentCapsuleInertAfterArrival && result.freshStart.persistentCapsuleBehindPlayerAfterArrival}\``,
            `- Fresh start gameplay music delayed until arrival ends: \`${result.freshStart.gameplayMusicStartedAtGameStart === false && result.freshStart.gameplayMusicStartedAfterArrival === true}\``,
            `- Replay arrival active: \`${result.replay.arrivalActiveAtReplayStart}\``,
            `- Auto-advance next stage index: \`${result.autoAdvance.nextStageIndexAtArrival}\``,
            `- Auto-advance arrival active: \`${result.autoAdvance.arrivalActiveAtNextStageStart}\``,
            `- Checkpoint respawn skipped arrival: \`${result.checkpointRespawn.arrivalStayedOffAfterRespawn}\``,
            `- Checkpoint respawn avoided recreating the start capsule: \`${result.checkpointRespawn.persistentCapsuleUnaffectedByRespawn}\``,
            `- Checkpoint respawn kept the start cabin anchored at its original world position: \`${result.checkpointRespawn.persistentCapsuleStayedAtOriginalAnchor}\``,
            `- Overall pass: \`${passed}\``,
            '',
            passed
              ? '- Fresh starts, replay, and next-stage auto-advance all passed through the bounded fixed-cabin arrival beat, while checkpoint respawn stayed on the direct in-scene respawn path and left the cabin anchored in place.'
              : '- One or more stage-start arrival flow checks failed.',
            '',
          ].join('\n'),
          'utf8',
        );

        if (!passed) {
          throw new Error('Separate grounded start cabin playtest failed');
        }
      } finally {
        await page.close();
      }
    } finally {
      await browser.close();
    }
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});