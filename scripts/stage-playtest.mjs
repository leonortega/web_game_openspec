import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  analyzeBlockSpacing,
  analyzeReadability,
  analyzeSafety,
  analyzeSecretRoutes,
  analyzeTerrainRollout,
  blockReport,
  buildMarkdown,
  buildTurretVariantCheck,
  checkpointReport,
  estimateMinutes,
  mechanicReport,
  rewardLockCoverageReport,
  scopeResultsForChange,
  staticLayoutCoverageReport,
} from './stage-playtest-analysis.mjs';

const ROOT = process.cwd();
const CHANGE_NAME = process.env.OPENSPEC_CHANGE ?? 'lightweight-stage-objectives';
const REPORT_DIR = path.join(ROOT, 'test_results', CHANGE_NAME);
const JSON_REPORT = path.join(REPORT_DIR, 'playtest-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'playtest-report.md');
const MUSIC_MANIFEST_PATH = path.join(ROOT, 'src', 'audio', 'musicAssetManifest.json');
const PORT = 4179;
const BASE_URL = `http://127.0.0.1:${PORT}/?debug=1`;
const PLAYTEST_VIEWPORT = { width: 1440, height: 900 };
const CONSTRAINED_VIEWPORT = { width: 430, height: 780 };
const MENU_AUDIO_CAPTURE_MS = 8_200;
const STAGE_GAMEPLAY_CAPTURE_MS = 12_500;
const COMPLETION_AUDIO_CAPTURE_MS = 900;
const PLAYABLE_STAGE_IDS = ['forest-ruins', 'amber-cavern', 'sky-sanctum'];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function attachPlaytestPageLogging(page) {
  page.on('pageerror', (error) => {
    console.error(`browser page error: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      console.error(`browser console error: ${message.text()}`);
    }
  });
}

async function openPlaytestPage(browserContext) {
  const page = await browserContext.newPage();
  attachPlaytestPageLogging(page);
  await page.setViewportSize(PLAYTEST_VIEWPORT);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForActiveScene(page, 'menu');
  return page;
}

async function unlockAudioViaCanvas(page) {
  await page.locator('canvas').click({ position: { x: 24, y: 24 } });
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

function findLastMusicEvent(audioDebug, phrase) {
  if (!audioDebug?.events) {
    return null;
  }

  const events = audioDebug.events.filter((event) => event.type === 'music' && (phrase ? event.phrase === phrase : true));
  return events.length > 0 ? events[events.length - 1] : null;
}

async function readMusicManifest() {
  const manifest = JSON.parse(await fs.readFile(MUSIC_MANIFEST_PATH, 'utf8'));
  manifest.active = await Promise.all(
    manifest.active.map(async (entry) => {
      const assetDiskPath = path.join(ROOT, 'public', entry.localAssetPath.replace(/^\//, '').replaceAll('/', path.sep));
      try {
        await fs.access(assetDiskPath);
        return { ...entry, localAssetPathExists: true };
      } catch {
        return { ...entry, localAssetPathExists: false };
      }
    }),
  );
  return manifest;
}

function findSectionEvents(audioDebug, phrase) {
  if (!audioDebug?.events) {
    return [];
  }

  return audioDebug.events.filter((event) => event.type === 'section' && (phrase ? event.phrase === phrase : true));
}

function firstSuccessfulUnlockIndex(audioDebug) {
  if (!audioDebug?.events) {
    return -1;
  }

  return audioDebug.events.findIndex((event) => event.type === 'unlock' && event.state === 'running');
}

function firstMusicIndex(audioDebug, phrase) {
  if (!audioDebug?.events) {
    return -1;
  }

  return audioDebug.events.findIndex((event) => event.type === 'music' && (phrase ? event.phrase === phrase : true));
}

function musicStartsAfterUnlock(audioDebug, phrase) {
  const unlockIndex = firstSuccessfulUnlockIndex(audioDebug);
  const musicIndex = firstMusicIndex(audioDebug, phrase);
  return unlockIndex >= 0 && musicIndex > unlockIndex;
}

function musicStartsInUnlockedContext(audioDebug, phrase) {
  const unlockIndex = firstSuccessfulUnlockIndex(audioDebug);
  if (unlockIndex === -1) {
    return firstMusicIndex(audioDebug, phrase) >= 0;
  }

  return musicStartsAfterUnlock(audioDebug, phrase);
}

function findManifestEntry(manifest, surface, stageId = null) {
  return manifest.active.find((entry) => entry.surface === surface && (surface === 'menu' || entry.stageId === stageId)) ?? null;
}

async function captureStageThemeFamily(pageTarget, stageIndex) {
  const page = await openPlaytestPage(pageTarget);

  try {
    await resetAudioDebug(page);
    await page.evaluate((targetStageIndex) => {
      const bridge = window.__CRYSTAL_RUN_BRIDGE__;
      const game = window.__CRYSTAL_RUN_GAME__;
      bridge.forceStartStage(targetStageIndex);
      ['menu', 'game', 'complete', 'stage-intro'].forEach((sceneKey) => {
        if (game.scene.getScenes(false).some((scene) => scene.scene.key === sceneKey)) {
          game.scene.stop(sceneKey);
        }
      });
      game.scene.start('stage-intro');
    }, stageIndex);
    await waitForActiveScene(page, 'stage-intro');
    await unlockAudioViaCanvas(page);
    await page.waitForTimeout(180);
    await page.evaluate(() => {
      const game = window.__CRYSTAL_RUN_GAME__;
      game.scene.stop('stage-intro');
      game.scene.start('game');
    });
    await waitForActiveScene(page, 'game');
    await page.waitForTimeout(STAGE_GAMEPLAY_CAPTURE_MS);
    await page.evaluate(() => {
      const game = window.__CRYSTAL_RUN_GAME__;
      game.scene.stop('game');
      game.scene.start('complete');
    });
    await waitForActiveScene(page, 'complete');
    await page.waitForTimeout(COMPLETION_AUDIO_CAPTURE_MS);

    const audioDebug = await readAudioDebug(page);
    const introEvent = findLastMusicEvent(audioDebug, 'stage-intro');
    const gameplayEvent = findLastMusicEvent(audioDebug, 'gameplay-loop');
    const completionEvent =
      findLastMusicEvent(audioDebug, 'final-congrats') ?? findLastMusicEvent(audioDebug, 'stage-clear');

    return {
      stageIndex,
      audioDebug,
      introEvent,
      gameplayEvent,
      completionEvent,
    };
  } finally {
    await page.close();
  }
}

function buildAudioAssetCheck(menuAudio, stageFamilies, manifest) {
  const menuTrack = findManifestEntry(manifest, 'menu');
  const menuEvent = findLastMusicEvent(menuAudio, 'menu-loop');
  const menuTrackMapped =
    Boolean(menuTrack) &&
    menuEvent?.playback === 'asset' &&
    menuEvent.assetKey === menuTrack.assetKey &&
    menuEvent.assetTitle === menuTrack.title &&
    menuEvent.assetLicense === menuTrack.license;
  const menuStartedAfterUnlock = musicStartsAfterUnlock(menuAudio, 'menu-loop');
  const manifestLicensesAllowed = manifest.active.every(
    (entry) => entry.license === 'CC0' || entry.license === 'Public Domain',
  );
  const backupsListed = Array.isArray(manifest.backups) && manifest.backups.length >= 3;
  const activePathsPresent = manifest.active.every(
    (entry) =>
      typeof entry.localAssetPath === 'string' &&
      entry.localAssetPath.length > 0 &&
      entry.localAssetPathExists === true,
  );

  const stageReports = stageFamilies.map((family) => {
    const stageId = PLAYABLE_STAGE_IDS[family.stageIndex] ?? `stage-${family.stageIndex}`;
    const expected = findManifestEntry(manifest, 'stage', stageId);
    const intro = family.introEvent;
    const gameplay = family.gameplayEvent;
    const completion = family.completionEvent;
    const mappedTrackPassed =
      Boolean(expected) &&
      gameplay?.playback === 'asset' &&
      gameplay.assetKey === expected.assetKey &&
      gameplay.assetTitle === expected.title &&
      gameplay.assetLicense === expected.license;
    const startedAfterUnlock = musicStartsInUnlockedContext(family.audioDebug, 'gameplay-loop');
    const synthStingersPreserved = intro?.playback === 'synth' && (!completion || completion.playback === 'synth');
    const singleGameplayLoop =
      family.audioDebug.events.filter(
        (event) => event.type === 'music' && event.playback === 'asset' && event.phrase === 'gameplay-loop',
      ).length === 1;

    return {
      stageName: stageId,
      expectedAssetKey: expected?.assetKey ?? 'missing',
      actualAssetKey: gameplay?.assetKey ?? 'missing',
      actualTitle: gameplay?.assetTitle ?? 'missing',
      mappedTrackPassed,
      startedAfterUnlock,
      synthStingersPreserved,
      singleGameplayLoop,
      passed: Boolean(expected) && mappedTrackPassed && startedAfterUnlock && synthStingersPreserved && singleGameplayLoop,
    };
  });

  return {
    menuAssetKey: menuTrack?.assetKey ?? 'missing',
    menuTrackMapped,
    menuStartedAfterUnlock,
    manifestLicensesAllowed,
    backupsListed,
    activePathsPresent,
    stageReports,
    passed:
      menuTrackMapped &&
      menuStartedAfterUnlock &&
      manifestLicensesAllowed &&
      backupsListed &&
      activePathsPresent &&
      stageReports.length === 3 &&
      stageReports.every((report) => report.passed),
  };
}

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

async function readMenuSnapshot(page) {
  return page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const menu = game.scene.getScene('menu');
    if (!menu) {
      return null;
    }

    if (typeof menu.getDebugSnapshot === 'function') {
      return menu.getDebugSnapshot();
    }

    const textNodes = menu.children
      .getChildren()
      .filter((child) => typeof child.text === 'string');
    const texts = textNodes.map((child) => child.text);
    const selectedText =
      textNodes.find((child) => {
        const backgroundColor = String(child.style?.backgroundColor ?? '').toLowerCase();
        const color = String(child.style?.color ?? '').toLowerCase();
        return backgroundColor.includes('f5cf64') || color.includes('11150f');
      })?.text ?? null;
    return {
      texts,
      joined: texts.join('\n'),
      selectedText,
    };
  });
}

async function emitMenuPointerOver(page, prefix) {
  return page.evaluate((valuePrefix) => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const menu = game.scene.getScene('menu');
    if (!menu) {
      return false;
    }

    const target = menu.children
      .getChildren()
      .find(
        (child) =>
          typeof child.text === 'string' &&
          child.text.startsWith(valuePrefix) &&
          Boolean(child.input?.enabled),
      );
    if (!target) {
      return false;
    }

    target.emit('pointerover');
    return true;
  }, prefix);
}

async function wheelMenu(page, deltaY) {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounds unavailable for wheel input');
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, deltaY);
}

async function readRuntimeSnapshot(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const state = bridge.getSession().getState();
    const activeScenes = game.scene.getScenes(true).map((scene) => scene.scene.key);
    const pausedGameScene = game.scene.getScene('game');
    const gameSnapshot = typeof pausedGameScene?.getDebugSnapshot === 'function' ? pausedGameScene.getDebugSnapshot() : null;

    return {
      playerX: state.player.x,
      playerY: state.player.y,
      playerVx: state.player.vx,
      playerVy: state.player.vy,
      collectedCoins: state.stageRuntime.collectedCoins,
      totalCoins: state.progress.totalCoins,
      firstCollectibleCollected: state.stageRuntime.collectibles[0]?.collected ?? false,
      runSettings: { ...state.progress.runSettings },
      runPaused: bridge.isRunPaused(),
      activeScenes,
      gameScenePaused: Boolean(pausedGameScene?.scene.isPaused()),
      pauseOverlayVisible: gameSnapshot?.pauseOverlayVisible ?? false,
      pauseOverlayText: gameSnapshot?.pauseText ?? null,
      hudVisible: gameSnapshot?.hudVisible ?? true,
    };
  });
}

async function collectFlowResults(page) {
  const musicManifest = await readMusicManifest();
  await waitForActiveScene(page, 'menu');
  const initialMenu = await readMenuSnapshot(page);
  const menuRootStyle = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const menu = game.scene.getScene('menu');
    const queue = [...menu.children.getChildren()];
    const visibleTexts = [];
    const visibleRectangles = [];

    while (queue.length > 0) {
      const child = queue.shift();
      if (!child) {
        continue;
      }

      if (typeof child.text === 'string' && child.visible) {
        visibleTexts.push(child);
      }

      if (child.type === 'Rectangle' && child.visible) {
        visibleRectangles.push(child);
      }

      if (Array.isArray(child.list)) {
        queue.push(...child.list);
      }
    }

    return {
      usesRetroFont: visibleTexts.every((child) => child.style?.fontFamily?.includes('Courier New')),
      hasFlatFrame: visibleRectangles.length >= 3,
      hasHighContrastSelection: visibleTexts.some((child) =>
        String(child.style?.backgroundColor ?? '').toLowerCase().includes('f0b84b'),
      ),
    };
  });
  await resetAudioDebug(page);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(MENU_AUDIO_CAPTURE_MS);
  const mainRootKeyboard = await readMenuSnapshot(page);
  const menuNavigateAudio = await readAudioDebug(page);

  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  const mainOptionsMenu = await readMenuSnapshot(page);
  const menuConfirmAudio = await readAudioDebug(page);

  const pointerHoverWorked = await emitMenuPointerOver(page, 'Volume');
  if (!pointerHoverWorked) {
    throw new Error('Menu pointer validation target not found');
  }
  await page.waitForTimeout(120);
  const mainOptionsPointer = await readMenuSnapshot(page);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(120);
  const mainOptionsUpdatedSettings = await page.evaluate(() => ({
    ...window.__CRYSTAL_RUN_BRIDGE__.getSession().getState().progress.runSettings,
  }));

  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  const mainRootAfterOptions = await readMenuSnapshot(page);

  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  const mainHelpMenu = await readMenuSnapshot(page);
  const menuHelpStyle = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const menu = game.scene.getScene('menu');
    const queue = [...menu.children.getChildren()];
    const visibleTexts = [];
    const visibleRectangles = [];

    while (queue.length > 0) {
      const child = queue.shift();
      if (!child) {
        continue;
      }

      if (typeof child.text === 'string' && child.visible) {
        visibleTexts.push(child);
      }

      if (child.type === 'Rectangle' && child.visible) {
        visibleRectangles.push(child);
      }

      if (Array.isArray(child.list)) {
        queue.push(...child.list);
      }
    }

    return {
      usesRetroFont: visibleTexts.every((child) => child.style?.fontFamily?.includes('Courier New')),
      hasFlatHelpPanel: visibleRectangles.length >= 4,
      hasReadableHelpText:
        visibleTexts.some((child) => child.text === 'Help') && visibleTexts.some((child) => child.text === 'Powers'),
    };
  });
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  const mainHelpAfterKeyboardScroll = await readMenuSnapshot(page);
  await wheelMenu(page, 320);
  await page.waitForTimeout(120);
  const mainHelpAfterWheelScroll = await readMenuSnapshot(page);

  const helpSnapshots = [mainHelpMenu, mainHelpAfterKeyboardScroll, mainHelpAfterWheelScroll].filter(Boolean);
  const mainHelpClippingVerified = helpSnapshots.some(
    (snapshot) =>
      Array.isArray(snapshot.helpParagraphs) &&
      snapshot.helpParagraphs.some(
        (paragraph) => paragraph.visible && (paragraph.cropY > 0 || paragraph.cropHeight < paragraph.bottom - paragraph.top),
      ) &&
      snapshot.helpParagraphs.every(
        (paragraph) =>
          (paragraph.visible &&
            paragraph.cropHeight > 0 &&
            paragraph.visibleTop >= snapshot.helpViewportTop &&
            paragraph.visibleBottom <= snapshot.helpViewportBottom) ||
          (!paragraph.visible && paragraph.cropHeight === 0),
      ),
  );

  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  const mainRootAfterHelp = await readMenuSnapshot(page);
  const menuBackAudio = await readAudioDebug(page);

  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(120);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(120);
  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    state.progress.activePowers.doubleJump = true;
    state.progress.activePowers.invincible = true;
    state.progress.powerTimers.invincibleMs = 4000;
  });
  await resetAudioDebug(page);
  await page.keyboard.press('Enter');

  const roomyShellCheck = await page.evaluate(() => {
    const shellFrame = document.querySelector('.game-shell-frame');
    const shell = document.querySelector('.game-shell');
    if (!shellFrame || !shell) {
      return null;
    }

    const frameRect = shellFrame.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    return {
      centered: Math.abs(frameRect.left - (viewportWidth - frameRect.right)) <= 2,
      desktopGrowth: shellRect.width >= 1240,
      frameMatchesShell: Math.abs(frameRect.width - shellRect.width) <= 1 && Math.abs(frameRect.height - shellRect.height) <= 1,
    };
  });

  await waitForActiveScene(page, 'stage-intro');
  const introCheck = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const intro = game.scene.getScene('stage-intro');
    const debug = typeof intro.getDebugSnapshot === 'function' ? intro.getDebugSnapshot() : null;
    const textNodes = intro.children.getChildren().filter((child) => typeof child.text === 'string');
    const textValues = intro.children
      .getChildren()
      .filter((child) => typeof child.text === 'string')
      .map((child) => child.text);
    const spriteTextureKeys = intro.children
      .getChildren()
      .filter((child) => child.type === 'Sprite')
      .map((child) => child.texture?.key ?? null);
    const retroRectangles = intro.children.getChildren().filter((child) => child.type === 'Rectangle');
    return {
      hasStageLabel: textValues.some((value) => value.includes('Stage 1')),
      hasRunSamples: textValues.some((value) => value.includes('Run research samples:')),
      hasSectorSamples: textValues.some((value) => value.includes('Sector research samples:')),
      hasBeaconStatus: textValues.some((value) => value.includes('Survey beacons online:')),
      hasLoadout: textValues.some((value) => value.includes('Loadout: Thruster Burst, Shield Field')),
      hasRun: textValues.some((value) => value.includes('Run:')),
      hasRetroFrame: retroRectangles.length >= 4,
      hasNoAstronautAccent: !spriteTextureKeys.includes('player'),
      usesRetroFont: textNodes.every((child) => child.style?.fontFamily?.includes('Courier New')),
      noDedicatedAccent:
        debug?.accentMode === 'none' &&
        debug?.accentVisible === false &&
        debug?.accentTweenActive === false &&
        (debug?.accentBurstCount ?? 0) === 0,
    };
  });
  const introAudio = await readAudioDebug(page);
  await waitForActiveScene(page, 'game', 12000);
  const gameplayMusicAudio = await readAudioDebug(page);

  await page.keyboard.press('Space');
  await page.waitForTimeout(180);

  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const checkpoint = state.stageRuntime.checkpoints[0];
    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y - state.player.height + 4;
    state.player.vx = 0;
    state.player.vy = 0;
  });
  await page.waitForTimeout(140);

  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    for (let index = 1; index < state.stageRuntime.collectibles.length; index += 1) {
      state.stageRuntime.collectibles[index].collected = true;
    }
    state.stageRuntime.collectedCoins = Math.max(0, state.stageRuntime.totalCoins - 1);
    state.progress.totalCoins = Math.max(state.progress.totalCoins, state.stageRuntime.collectedCoins);
    const collectible = state.stageRuntime.collectibles[0];
    state.player.x = collectible.position.x - state.player.width / 2;
    state.player.y = collectible.position.y - state.player.height / 2;
    state.player.vx = 0;
    state.player.vy = 0;
  });
  await page.waitForTimeout(140);

  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const rewardBlock = state.stageRuntime.rewardBlocks.find((block) => block.reward.kind === 'coins');
    if (!rewardBlock) {
      return;
    }
    state.player.x = rewardBlock.x + rewardBlock.width / 2 - state.player.width / 2;
    state.player.y = rewardBlock.y + rewardBlock.height + 2;
    state.player.vx = 0;
    state.player.vy = -720;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
  });
  await page.waitForTimeout(180);

  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const powerBlock = state.stageRuntime.rewardBlocks.find((block) => block.reward.kind === 'power');
    if (!powerBlock) {
      return;
    }
    state.player.x = powerBlock.x + powerBlock.width / 2 - state.player.width / 2;
    state.player.y = powerBlock.y + powerBlock.height + 2;
    state.player.vx = 0;
    state.player.vy = -720;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
  });
  await page.waitForTimeout(200);

  const gameplayFeedbackSnapshot = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    return typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
  });

  await resetAudioDebug(page);
  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;

    bridge.forceStartStage(0);
    game.scene.stop('complete');
    game.scene.stop('stage-intro');
    game.scene.start('game');

    const state = bridge.getSession().getState();
    state.stageRuntime.enemies = [];
    state.stageRuntime.hazards = [];
    state.stageRuntime.objective = null;
    state.player.x = state.stage.exit.x + 4;
    state.player.y = state.stage.exit.y;
    state.player.vx = 0;
    state.player.vy = 0;

    bridge.consumeFrame(16);
  });
  await page.waitForTimeout(520);
  const capsuleFinishSnapshot = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    const debug = typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
    return {
      levelCompleted: bridge.getSession().getState().levelCompleted,
      exitFinishActive: bridge.getSession().getState().exitFinish.active,
      playerVisualVisibleCount: debug?.playerVisualVisibleCount ?? null,
      exitSpriteAlpha: debug?.exitSpriteAlpha ?? null,
      activeScenes: game.scene.getScenes(true).map((activeScene) => activeScene.scene.key),
    };
  });
  const capsuleFinishAudio = await readAudioDebug(page);
  await waitForActiveScene(page, 'complete', 12000);

  const runtimeSeed = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const state = bridge.getSession().getState();
    const collectible = state.stageRuntime.collectibles[0];

    state.player.x += 123;
    state.player.y = Math.max(0, state.player.y - 17);
    if (collectible) {
      collectible.collected = true;
      state.stageRuntime.collectedCoins = Math.max(state.stageRuntime.collectedCoins, 1);
      state.progress.totalCoins = Math.max(state.progress.totalCoins, 1);
    }

    return {
      playerX: state.player.x,
      playerY: state.player.y,
      collectedCoins: state.stageRuntime.collectedCoins,
      totalCoins: state.progress.totalCoins,
      firstCollectibleCollected: collectible?.collected ?? false,
    };
  });

  const hudCheck = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.hud-card')];
    const meta = document.querySelector('.hud-meta');
    const scoreboard = document.querySelector('.hud-scoreboard');
    const metaLines = [...document.querySelectorAll('.hud-meta-line')].map((node) => node.textContent?.trim() ?? '');
    const scoreboardStyle = scoreboard ? getComputedStyle(scoreboard) : null;
    return {
      hasFourCards: cards.length === 4,
      hasCornerMeta: Boolean(meta),
      hasRunLine: metaLines.some((value) => value.startsWith('Run')),
      hasSegmentLine: metaLines.some((value) => value.startsWith('Segment')),
      hasScoreboardBand:
        Boolean(scoreboardStyle) &&
        scoreboardStyle.borderStyle === 'solid' &&
        scoreboardStyle.backgroundColor !== 'rgba(0, 0, 0, 0)',
      usesFlatCells: cards.every((card) => getComputedStyle(card).borderRadius === '0px'),
    };
  });

  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  const pauseStableBefore = await readRuntimeSnapshot(page);
  await page.waitForTimeout(220);
  const pauseStableAfter = await readRuntimeSnapshot(page);

  await page.keyboard.press('Escape');
  await waitForActiveScene(page, 'game', 12000);
  const resumedRuntime = await readRuntimeSnapshot(page);

  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const idleInput = {
      left: false,
      right: false,
      jumpHeld: false,
      jumpPressed: false,
      dashPressed: false,
      shootPressed: false,
    };

    bridge.forceStartStage(1);
    game.scene.stop('complete');
    game.scene.stop('stage-intro');
    game.scene.start('game');

    const state = bridge.getSession().getState();
    const enemy = state.stageRuntime.enemies.find((entry) => entry.kind === 'hopper');
    if (enemy) {
      state.stageRuntime.enemies = [enemy];
      state.stageRuntime.hazards = [];
      state.player.x = enemy.x;
      state.player.y = enemy.y - state.player.height - 2;
      state.player.vx = 0;
      state.player.vy = 320;
      state.player.onGround = false;
      state.player.supportPlatformId = null;
      bridge.getSession().update(16, idleInput);
    }

    state.progress.activePowers.doubleJump = false;
    state.progress.activePowers.shooter = false;
    state.progress.activePowers.invincible = false;
    state.progress.activePowers.dash = false;
    state.progress.powerTimers.invincibleMs = 0;
    state.player.health = 1;
    state.player.invulnerableMs = 0;
    bridge.getSession().damagePlayer();
  });
  await page.waitForTimeout(180);
  const defeatFeedbackSnapshot = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const scene = game.scene.getScene('game');
    return typeof scene.getDebugSnapshot === 'function' ? scene.getDebugSnapshot() : null;
  });

  await resetAudioDebug(page);
  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    bridge.forceStartStage(0);
    bridge.getSession().getState().progress.activePowers.doubleJump = true;
    bridge.getSession().getState().progress.activePowers.invincible = true;
    bridge.getSession().getState().progress.powerTimers.invincibleMs = 4000;
    bridge.getSession().getState().progress.unlockedStageIndex = 2;
    game.scene.getScene('game').scene.start('complete');
  });
  await waitForActiveScene(page, 'complete');
  const completionAudio = await readAudioDebug(page);
  const completeCheck = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const complete = game.scene.getScene('complete');
    const debug = typeof complete.getDebugSnapshot === 'function' ? complete.getDebugSnapshot() : null;
    const textNodes = complete.children.getChildren().filter((child) => typeof child.text === 'string');
    const textValues = complete.children
      .getChildren()
      .filter((child) => typeof child.text === 'string')
      .map((child) => child.text);
    const spriteTextureKeys = complete.children
      .getChildren()
      .filter((child) => child.type === 'Sprite')
      .map((child) => child.texture?.key ?? null);
    const retroRectangles = complete.children.getChildren().filter((child) => child.type === 'Rectangle');
    return {
      hasRunSamples: textValues.some((value) => value.includes('Run research samples:')),
      hasSectorSamples: textValues.some((value) => value.includes('Sector research samples:')),
      hasBeaconStatus: textValues.some((value) => value.includes('Survey beacons online:')),
      hasAstronautLoadout: textValues.some((value) => value.includes('Loadout: Thruster Burst, Shield Field')),
      hasStageName: textValues.some((value) => value.includes('Verdant Impact Crater')),
      hasRetroFrame: retroRectangles.length >= 4,
      hasNoAstronautAccent: !spriteTextureKeys.includes('player'),
      usesRetroFont: textNodes.every((child) => child.style?.fontFamily?.includes('Courier New')),
      noDedicatedWidget:
        debug?.accentMode === 'none' &&
        debug?.accentVisible === false &&
        debug?.accentTweenActive === false &&
        (debug?.accentBurstCount ?? 0) === 0 &&
        debug?.sideWidgetVisible === false,
    };
  });
  await waitForActiveScene(page, 'stage-intro', 12000);
  const autoAdvanceCheck = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    return bridge.getSession().getState().stageIndex === 1;
  });

  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    bridge.forceStartStage(2);
    game.scene.getScene('game').scene.start('complete');
  });
  await waitForActiveScene(page, 'complete');
  await page.waitForTimeout(3200);
  const finalStageStayedComplete = await page.evaluate(() => {
    const game = window.__CRYSTAL_RUN_GAME__;
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const active = game.scene.getScenes(true).map((scene) => scene.scene.key);
    return active.includes('complete') && bridge.getSession().getState().stageIndex === 2;
  });

  await resetAudioDebug(page);
  const gameplayAudioCheck = await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    const idleInput = {
      left: false,
      right: false,
      jumpHeld: false,
      jumpPressed: false,
      dashPressed: false,
      shootPressed: false,
    };

    bridge.forceStartStage(1);
    game.scene.stop('complete');
    game.scene.stop('stage-intro');
    game.scene.start('game');

    const state = bridge.getSession().getState();
    const checkpoint = state.stageRuntime.checkpoints[0];
    state.player.x = checkpoint.rect.x;
    state.player.y = checkpoint.rect.y;
    bridge.getSession().update(16, idleInput);
    const checkpointCues = bridge.drainCues();

    const collectible = state.stageRuntime.collectibles[0];
    state.player.x = collectible.position.x - state.player.width / 2;
    state.player.y = collectible.position.y - state.player.height / 2;
    bridge.getSession().update(16, idleInput);
    const collectCues = bridge.drainCues();

    const powerBlock = state.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.reward.kind === 'power');
    state.player.x = powerBlock.x + powerBlock.width / 2 - state.player.width / 2;
    state.player.y = powerBlock.y + powerBlock.height + 2;
    state.player.vx = 0;
    state.player.vy = -720;
    state.player.onGround = false;
    state.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const powerCues = bridge.drainCues();

    state.progress.activePowers.doubleJump = false;
    state.progress.activePowers.shooter = false;
    state.progress.activePowers.invincible = false;
    state.progress.activePowers.dash = false;
    state.progress.powerTimers.invincibleMs = 0;
    state.player.invulnerableMs = 0;
    state.player.health = 1;
    bridge.getSession().damagePlayer();
    const deathCues = bridge.drainCues();

    return { checkpointCues, collectCues, powerCues, deathCues };
  });

  const motionAudioCheck = await page.evaluate(() => {
    const session = window.__CRYSTAL_RUN_BRIDGE__.getSession();
    const idleInput = {
      left: false,
      right: false,
      jumpHeld: false,
      jumpPressed: false,
      dashPressed: false,
      shootPressed: false,
    };

    session.forceStartStage(1);
    let state = session.getState();
    const charger = state.stageRuntime.enemies.find((enemy) => enemy.kind === 'charger');
    state.stageRuntime.enemies = [charger];
    state.stageRuntime.hazards = [];
    state.player.x = charger.x + 10;
    state.player.y = charger.y;
    state.player.vx = 0;
    state.player.vy = 0;
    session.update(16, idleInput);
    const dangerCues = session.consumeCues();

    let remainingWindup = charger.charger.windupMs + 16;
    while (remainingWindup > 0) {
      const step = Math.min(remainingWindup, 16);
      session.update(step, idleInput);
      remainingWindup -= step;
    }
    const chargeCues = session.consumeCues();

    session.restartStage();
    state = session.getState();
    const hopper = state.stageRuntime.enemies.find((enemy) => enemy.kind === 'hopper');
    state.stageRuntime.enemies = [hopper];
    state.stageRuntime.hazards = [];
    let remainingHop = hopper.hop.intervalMs + 32;
    while (remainingHop > 0) {
      const step = Math.min(remainingHop, 16);
      session.update(step, idleInput);
      remainingHop -= step;
    }
    const hopCues = session.consumeCues();

    session.restartStage();
    state = session.getState();
    const movingPlatform = state.stageRuntime.platforms.find((platform) => platform.kind === 'moving');
    const reverseMs = Math.ceil((movingPlatform.move.range / movingPlatform.move.speed) * 1000) + 32;
    let remainingReverse = reverseMs;
    while (remainingReverse > 0) {
      const step = Math.min(remainingReverse, 16);
      session.update(step, idleInput);
      remainingReverse -= step;
    }
    const platformCues = session.consumeCues();

    return {
      dangerCueWorked: dangerCues.includes('danger'),
      movingEnemyCueWorked: chargeCues.includes('enemy-charge') && hopCues.includes('enemy-hop'),
      movingPlatformWorked: platformCues.includes('moving-platform'),
    };
  });

  await resetAudioDebug(page);
  await page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;

    bridge.forceStartStage(2);
    game.scene.stop('game');
    game.scene.stop('stage-intro');
    game.scene.stop('complete');
    game.scene.start('complete');
  });
  await waitForActiveScene(page, 'complete');
  const finalCompletionAudio = await readAudioDebug(page);

  const stageThemeFamilies = [];
  for (const stageIndex of [0, 1, 2]) {
    stageThemeFamilies.push(await captureStageThemeFamily(page.context(), stageIndex));
  }
  const audioAssetChecks = buildAudioAssetCheck(menuNavigateAudio, stageThemeFamilies, musicManifest);

  await resetAudioDebug(page);
  const surfaceDifferentiationCheck = await page.evaluate(() => {
    const scene = window.__CRYSTAL_RUN_GAME__.scene.getScene('complete') ?? window.__CRYSTAL_RUN_GAME__.scene.getScene('game');
    scene.audio.playCue('collect');
    scene.audio.playCue('danger');
    scene.audio.playCue('death');
    scene.audio.playCue('final-congrats');
    const cueEvents = window.__CRYSTAL_RUN_AUDIO_DEBUG__.events.filter((event) => event.type === 'cue');

    return {
      distinctFamilies: new Set(cueEvents.map((event) => event.family)).size >= 4,
      distinctSignatures: new Set(cueEvents.map((event) => event.signature)).size >= 4,
    };
  });

  await page.setViewportSize(CONSTRAINED_VIEWPORT);
  await page.waitForTimeout(120);
  const constrainedShellCheck = await page.evaluate(() => {
    const shellFrame = document.querySelector('.game-shell-frame');
    const shell = document.querySelector('.game-shell');
    if (!shellFrame || !shell) {
      return null;
    }

    const frameRect = shellFrame.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const bodyOverflowX = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - viewportWidth;
    return {
      centered: Math.abs(frameRect.left - (viewportWidth - frameRect.right)) <= 2,
      noHorizontalOverflow: bodyOverflowX <= 1,
      fitsViewport: shellRect.right <= viewportWidth + 1 && shellRect.bottom <= viewportHeight + 1,
      frameMatchesShell: Math.abs(frameRect.width - shellRect.width) <= 1 && Math.abs(frameRect.height - shellRect.height) <= 1,
    };
  });
  await page.setViewportSize(PLAYTEST_VIEWPORT);
  await page.waitForTimeout(120);

  return {
    mainMenuRootVisible:
      Boolean(initialMenu) &&
      initialMenu.mode === 'main' &&
      initialMenu.view === 'root' &&
      initialMenu.joined.includes('Orbital Survey') &&
      initialMenu.joined.includes('Start') &&
      initialMenu.joined.includes('Options') &&
      initialMenu.joined.includes('Help'),
    mainMenuKeyboardUpdate:
      Boolean(initialMenu && mainRootKeyboard) &&
      initialMenu.selectedText === 'Start' &&
      mainRootKeyboard.selectedText === 'Options',
    mainMenuNavigationAudio:
      Boolean(menuNavigateAudio) &&
      menuNavigateAudio.activeOwner === 'menu' &&
      musicStartsAfterUnlock(menuNavigateAudio, 'menu-loop') &&
      menuNavigateAudio.events.some((event) => event.type === 'cue' && event.cue === 'menu-navigate'),
    menuGameplayDifferentiated:
      Boolean(menuNavigateAudio && gameplayMusicAudio) &&
      menuNavigateAudio.events.some(
        (event) =>
          event.type === 'music' &&
          event.playback === 'asset' &&
          gameplayMusicAudio.events.some(
            (next) => next.type === 'music' && next.playback === 'asset' && next.assetKey !== event.assetKey,
          ),
      ),
    mainOptionsVisible:
      Boolean(mainOptionsMenu) &&
      mainOptionsMenu.mode === 'main' &&
      mainOptionsMenu.view === 'options' &&
      mainOptionsMenu.joined.includes('Difficulty') &&
      mainOptionsMenu.joined.includes('Enemies') &&
      mainOptionsMenu.joined.includes('Volume'),
    mainMenuConfirmAudio:
      Boolean(menuConfirmAudio) &&
      menuConfirmAudio.events.some((event) => event.type === 'cue' && event.cue === 'menu-confirm'),
    mainMenuPointerUpdate:
      Boolean(mainOptionsPointer) &&
      mainOptionsPointer.selectedText?.startsWith('Volume'),
    mainOptionsLiveUpdate:
      typeof mainOptionsUpdatedSettings.masterVolume === 'number' &&
      Boolean(mainRootAfterOptions) &&
      mainRootAfterOptions.mode === 'main' &&
      mainRootAfterOptions.view === 'root',
    mainHelpVisible:
      Boolean(mainHelpMenu) &&
      mainHelpMenu.mode === 'main' &&
      mainHelpMenu.view === 'help' &&
      mainHelpMenu.joined.includes('Powers') &&
      mainHelpMenu.joined.includes('Thruster Burst') &&
      mainHelpMenu.joined.includes('Shield Field') &&
      mainHelpMenu.joined.includes('Hazards') &&
      Boolean(mainRootAfterHelp) &&
      mainRootAfterHelp.mode === 'main' &&
      mainRootAfterHelp.view === 'root',
    mainMenuBackAudio:
      Boolean(menuBackAudio) &&
      menuBackAudio.events.some((event) => event.type === 'cue' && event.cue === 'menu-back'),
    mainMenuRetroStyle:
      menuRootStyle.usesRetroFont &&
      menuRootStyle.hasFlatFrame &&
      menuRootStyle.hasHighContrastSelection &&
      menuHelpStyle.usesRetroFont &&
      menuHelpStyle.hasFlatHelpPanel &&
      menuHelpStyle.hasReadableHelpText,
    mainHelpLargerPanelVisible:
      Boolean(mainHelpMenu) &&
      mainHelpMenu.helpPanelHeight >= 360 &&
      mainHelpMenu.helpViewportHeight >= 220,
    mainHelpScrollVisible:
      Boolean(mainHelpMenu) &&
      mainHelpMenu.helpScrollbarVisible &&
      mainHelpMenu.helpScrollMax > 0,
    mainHelpKeyboardScrollWorked:
      Boolean(mainHelpMenu && mainHelpAfterKeyboardScroll) &&
      mainHelpAfterKeyboardScroll.helpScrollOffset > mainHelpMenu.helpScrollOffset,
    mainHelpWheelScrollWorked:
      Boolean(mainHelpAfterKeyboardScroll && mainHelpAfterWheelScroll) &&
      mainHelpAfterWheelScroll.helpScrollOffset > mainHelpAfterKeyboardScroll.helpScrollOffset,
    mainHelpClippingVerified,
    introVisible: true,
    introAudioOwned:
      Boolean(introAudio) &&
      introAudio.activeOwner === 'transition' &&
      introAudio.events.some((event) => event.type === 'owner' && event.owner === 'transition'),
    introStatusVisible:
      introCheck.hasStageLabel &&
      introCheck.hasRunSamples &&
      introCheck.hasSectorSamples &&
      introCheck.hasBeaconStatus &&
      introCheck.hasLoadout &&
      introCheck.hasRun &&
      introCheck.hasRetroFrame &&
      introCheck.hasNoAstronautAccent &&
      introCheck.usesRetroFont &&
      introCheck.noDedicatedAccent,
    completeStatusVisible:
      completeCheck.hasRunSamples &&
      completeCheck.hasSectorSamples &&
      completeCheck.hasBeaconStatus &&
      completeCheck.hasAstronautLoadout &&
      completeCheck.hasStageName &&
      completeCheck.hasRetroFrame &&
      completeCheck.hasNoAstronautAccent &&
      completeCheck.usesRetroFont &&
      completeCheck.noDedicatedWidget,
    capsuleExitFinishWorked:
      Boolean(capsuleFinishSnapshot) &&
      capsuleFinishSnapshot.exitFinishActive &&
      capsuleFinishSnapshot.levelCompleted === false &&
      capsuleFinishSnapshot.playerVisualVisibleCount === 0 &&
      !capsuleFinishSnapshot.activeScenes.includes('complete') &&
      Boolean(capsuleFinishAudio) &&
      capsuleFinishAudio.events.some((event) => event.type === 'cue' && event.cue === 'capsule-teleport'),
    gameplayMusicOwned:
      Boolean(gameplayMusicAudio) &&
      gameplayMusicAudio.activeOwner === 'gameplay' &&
      gameplayMusicAudio.events.some(
        (event) => event.type === 'music' && event.playback === 'asset' && event.phrase === 'gameplay-loop',
      ) &&
      gameplayMusicAudio.events.some((event) => event.type === 'owner' && event.owner === 'gameplay'),
    completionAudioOwned:
      Boolean(completionAudio) &&
      completionAudio.activeOwner === 'transition' &&
      completionAudio.events.some((event) => event.type === 'owner' && event.owner === 'transition'),
    checkpointAudioWorked:
      Boolean(gameplayAudioCheck) &&
      gameplayAudioCheck.checkpointCues.includes('checkpoint'),
    rewardAudioWorked:
      Boolean(gameplayAudioCheck) &&
      gameplayAudioCheck.collectCues.includes('collect') &&
      gameplayAudioCheck.powerCues.includes('reward-reveal') &&
      gameplayAudioCheck.powerCues.includes('power'),
    dangerAudioWorked:
      Boolean(motionAudioCheck) && motionAudioCheck.dangerCueWorked,
    movingEntityAudioWorked:
      Boolean(motionAudioCheck) && motionAudioCheck.movingEnemyCueWorked,
    movingPlatformAudioWorked:
      Boolean(motionAudioCheck) && motionAudioCheck.movingPlatformWorked,
    powerPickupAudioWorked:
      Boolean(gameplayAudioCheck) &&
      gameplayAudioCheck.powerCues.includes('block') &&
      gameplayAudioCheck.powerCues.includes('power'),
    deathAudioWorked:
      Boolean(gameplayAudioCheck) &&
      gameplayAudioCheck.deathCues.includes('death') &&
      !gameplayAudioCheck.deathCues.includes('hurt'),
    completionAudioDifferentiated:
      Boolean(completionAudio && finalCompletionAudio) &&
      completionAudio.events.some((event) => event.type === 'music' && event.phrase !== 'final-congrats') &&
      finalCompletionAudio.events.some((event) => event.type === 'music' && event.phrase === 'final-congrats'),
    finalCongratsAudioWorked:
      Boolean(finalCompletionAudio) &&
      finalCompletionAudio.events.some((event) => event.type === 'music' && event.phrase === 'final-congrats'),
    stageThemeFamilyResolved: audioAssetChecks.stageReports.every((report) => report.synthStingersPreserved),
    audioAssetChecks,
    surfaceDifferentiationVerified:
      Boolean(surfaceDifferentiationCheck) &&
      surfaceDifferentiationCheck.distinctFamilies &&
      surfaceDifferentiationCheck.distinctSignatures,
    hudLayoutPassed:
      hudCheck.hasFourCards &&
      hudCheck.hasCornerMeta &&
      hudCheck.hasRunLine &&
      hudCheck.hasSegmentLine &&
      hudCheck.hasScoreboardBand &&
      hudCheck.usesFlatCells,
    pauseOverlayVisible:
      pauseStableBefore.runPaused &&
      pauseStableBefore.pauseOverlayVisible &&
      pauseStableBefore.pauseOverlayText === 'PAUSED' &&
      !pauseStableBefore.hudVisible,
    pauseMenuSceneRemoved:
      !pauseStableBefore.activeScenes.includes('menu') &&
      !pauseStableAfter.activeScenes.includes('menu'),
    pauseFreezeWorked:
      pauseStableBefore.runPaused &&
      !pauseStableBefore.gameScenePaused &&
      pauseStableAfter.runPaused &&
      !pauseStableAfter.gameScenePaused &&
      pauseStableAfter.pauseOverlayVisible &&
      pauseStableBefore.playerX === pauseStableAfter.playerX &&
      pauseStableBefore.playerY === pauseStableAfter.playerY &&
      pauseStableBefore.playerVx === pauseStableAfter.playerVx &&
      pauseStableBefore.playerVy === pauseStableAfter.playerVy &&
      pauseStableBefore.collectedCoins === pauseStableAfter.collectedCoins &&
      pauseStableBefore.totalCoins === pauseStableAfter.totalCoins,
    pauseMenuActionsRemoved:
      !pauseStableBefore.activeScenes.includes('menu') &&
      !pauseStableBefore.pauseOverlayText?.includes('Continue') &&
      !pauseStableBefore.pauseOverlayText?.includes('Options') &&
      !pauseStableBefore.pauseOverlayText?.includes('Help'),
    pauseResumeExact:
      !resumedRuntime.runPaused &&
      !resumedRuntime.pauseOverlayVisible &&
      resumedRuntime.hudVisible &&
      !resumedRuntime.activeScenes.includes('stage-intro') &&
      resumedRuntime.collectedCoins === runtimeSeed.collectedCoins &&
      resumedRuntime.totalCoins === runtimeSeed.totalCoins &&
      resumedRuntime.firstCollectibleCollected === runtimeSeed.firstCollectibleCollected &&
      resumedRuntime.playerX === pauseStableBefore.playerX &&
      resumedRuntime.playerY === pauseStableBefore.playerY,
    autoAdvanceWorked: autoAdvanceCheck,
    finalStageStopped: finalStageStayedComplete,
    gameplayJumpFeedbackWorked:
      Boolean(gameplayFeedbackSnapshot) &&
      (gameplayFeedbackSnapshot.feedbackCounts?.jump ?? 0) > 0 &&
      gameplayFeedbackSnapshot.playerPose !== 'idle',
    gameplayCheckpointFeedbackWorked: (gameplayFeedbackSnapshot?.feedbackCounts?.checkpoint ?? 0) > 0,
    gameplayCoinFeedbackWorked: (gameplayFeedbackSnapshot?.feedbackCounts?.coin ?? 0) > 0,
    gameplayRewardFeedbackWorked: (gameplayFeedbackSnapshot?.feedbackCounts?.reward ?? 0) > 0,
    gameplayPowerFeedbackWorked: (gameplayFeedbackSnapshot?.feedbackCounts?.power ?? 0) > 0,
    gameplayHealFeedbackWorked: (gameplayFeedbackSnapshot?.feedbackCounts?.heal ?? 0) > 0,
    gameplayPlayerDefeatFeedbackWorked: (defeatFeedbackSnapshot?.feedbackCounts?.playerDefeat ?? 0) > 0,
    gameplayEnemyDefeatFeedbackWorked: (defeatFeedbackSnapshot?.feedbackCounts?.enemyDefeat ?? 0) > 0,
    introNoDedicatedAccent: introCheck.noDedicatedAccent,
    completionNoDedicatedWidget: completeCheck.noDedicatedWidget,
    shellExpandedOnDesktop:
      Boolean(roomyShellCheck) &&
      roomyShellCheck.desktopGrowth &&
      roomyShellCheck.centered &&
      roomyShellCheck.frameMatchesShell,
    shellBoundedOnConstrainedViewport:
      Boolean(constrainedShellCheck) &&
      constrainedShellCheck.centered &&
      constrainedShellCheck.noHorizontalOverflow &&
      constrainedShellCheck.fitsViewport &&
      constrainedShellCheck.frameMatchesShell,
  };
}

async function collectObjectiveResults(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    if (!bridge || !game) {
      throw new Error('Missing debug handles');
    }

    const expandRect = (rect, padding) => ({
      x: rect.x - padding,
      y: rect.y - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const resetToGameScene = () => {
      for (const key of ['menu', 'stage-intro', 'complete']) {
        const scene = game.scene.getScene(key);
        if (scene?.scene.isActive()) {
          scene.scene.stop();
        }
      }
      game.scene.start('game');
    };

    const gravityRoomRolloutAudit = [0, 1, 2].map((stageIndex) => {
      bridge.forceStartStage(stageIndex);
      resetToGameScene();
      const rolloutState = bridge.getSession().getState();
      const gravityCapsuleIds = new Set(rolloutState.stageRuntime.gravityCapsules.map((capsule) => capsule.id));
      return {
        stageId: rolloutState.stage.id,
        allFieldsEnclosed:
          rolloutState.stageRuntime.gravityFields.length > 0 &&
          rolloutState.stageRuntime.gravityCapsules.length === rolloutState.stageRuntime.gravityFields.length &&
          rolloutState.stageRuntime.gravityFields.every(
            (field) => field.gravityCapsuleId && gravityCapsuleIds.has(field.gravityCapsuleId),
          ),
        buttonsReachable: rolloutState.stageRuntime.gravityCapsules.every((capsule) =>
          rolloutState.stageRuntime.platforms.some((platform) => {
            const overlap = Math.max(
              0,
              Math.min(capsule.button.x + capsule.button.width, platform.x + platform.width) -
                Math.max(capsule.button.x, platform.x),
            );
            return (
              overlap >= Math.min(capsule.button.width * 0.55, platform.width) &&
              Math.abs(capsule.button.y + capsule.button.height - platform.y) <= 24
            );
          }),
        ),
      };
    });
    bridge.forceStartStage(2);
    resetToGameScene();

    const initialState = bridge.getSession().getState();
    initialState.stageRuntime.enemies = [];
    initialState.stageRuntime.hazards = [];

    const briefingShown = initialState.stageRuntime.objective?.kind === 'reactivateRelay' &&
      initialState.stageMessage === 'Reactivate relay';

    initialState.player.x = initialState.stage.exit.x + 4;
    initialState.player.y = initialState.stage.exit.y;
    initialState.player.vx = 0;
    initialState.player.vy = 0;
    bridge.consumeFrame(16);

    const blockedState = bridge.getSession().getState();
    const incompleteExitBlocked =
      blockedState.levelCompleted === false &&
      blockedState.stageRuntime.exitReached === false &&
      blockedState.stageMessage === 'Reactivate the relay before exit';

    const scanner = blockedState.stageRuntime.scannerVolumes.find((volume) => volume.id === 'sky-halo-scanner');
    if (!scanner) {
      throw new Error('Objective scanner volume sky-halo-scanner not found');
    }

    blockedState.player.x = scanner.x + 16;
    blockedState.player.y = scanner.y + 16;
    blockedState.player.vx = 0;
    blockedState.player.vy = 0;
    bridge.consumeFrame(16);

    const completedState = bridge.getSession().getState();
    const objectiveCompleted =
      completedState.stageRuntime.objective?.completed === true;

    completedState.player.x = completedState.stage.exit.x + 4;
    completedState.player.y = completedState.stage.exit.y;
    completedState.player.vx = 0;
    completedState.player.vy = 0;
    bridge.consumeFrame(16);

    const exitFinishState = bridge.getSession().getState();
    const completedExitStarted =
      exitFinishState.levelCompleted === false &&
      exitFinishState.stageRuntime.exitReached === true &&
      exitFinishState.exitFinish.active === true;

    let remainingFinish = exitFinishState.exitFinish.durationMs;
    while (remainingFinish > 0) {
      const step = Math.min(remainingFinish, 16);
      bridge.consumeFrame(step);
      remainingFinish -= step;
    }

    const exitCompletedState = bridge.getSession().getState();
    const completedExitCleared =
      completedExitStarted &&
      exitCompletedState.levelCompleted === true &&
      exitCompletedState.stageRuntime.exitReached === true &&
      exitCompletedState.exitFinish.active === false;

    return {
      briefingShown,
      incompleteExitBlocked,
      objectiveCompleted,
      completedExitStarted,
      completedExitCleared,
      passed: briefingShown && incompleteExitBlocked && objectiveCompleted && completedExitCleared,
    };
  });
}

async function collectStageResults(page) {
  return page.evaluate(() => {
    const bridge = window.__CRYSTAL_RUN_BRIDGE__;
    const game = window.__CRYSTAL_RUN_GAME__;
    if (!bridge || !game) {
      throw new Error('Missing debug handles');
    }

    const expandRect = (rect, padding) => ({
      x: rect.x - padding,
      y: rect.y - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const resetToGameScene = () => {
      for (const key of ['menu', 'stage-intro', 'complete']) {
        const scene = game.scene.getScene(key);
        if (scene?.scene.isActive()) {
          scene.scene.stop();
        }
      }
      game.scene.start('game');
    };

    const results = [];
    for (let stageIndex = 0; stageIndex < 3; stageIndex += 1) {
      bridge.forceStartStage(stageIndex);
      resetToGameScene();

      const state = bridge.getSession().getState();
      const checkpoint = state.stageRuntime.checkpoints[state.stageRuntime.checkpoints.length - 1];
      state.player.x = checkpoint.rect.x;
      state.player.y = checkpoint.rect.y;
      bridge.consumeFrame(16);

      const latest = bridge.getSession().getState();
      latest.player.x = checkpoint.rect.x + 12;
      latest.player.y = latest.stage.world.height + 180;
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

    bridge.forceStartStage(0);
    resetToGameScene();
    let state = bridge.getSession().getState();
    state.progress.activePowers.dash = true;
    const movingPlatform = state.stageRuntime.platforms.find((platform) => platform.kind === 'moving');
    state.player.x = movingPlatform.x + 32;
    state.player.y = movingPlatform.y - state.player.height;
    state.player.onGround = true;
    state.player.supportPlatformId = movingPlatform.id;
    const dashStartX = state.player.x;
    const rideStartOffset = state.player.x - movingPlatform.x;
    for (let i = 0; i < 12; i += 1) {
      bridge.consumeFrame(16);
    }
    const rideState = bridge.getSession().getState();
    const ridePlatform = rideState.stageRuntime.platforms.find((platform) => platform.id === movingPlatform.id);
    const rideOffset = rideState.player.x - ridePlatform.x;
    const rideStable =
      rideState.player.onGround &&
      rideState.player.supportPlatformId === ridePlatform.id &&
      Math.abs(rideOffset - rideStartOffset) <= 18;

    bridge.pressDash();
    bridge.consumeFrame(16);
    const dashCooldownStarted = bridge.getSession().getState().player.dashCooldownMs > 0;
    let dashCues = bridge.drainCues();
    for (let i = 0; i < 4; i += 1) {
      bridge.consumeFrame(16);
      dashCues = dashCues.concat(bridge.drainCues());
    }
    const dashState = bridge.getSession().getState();
    const movingJumpPlatform = dashState.stageRuntime.platforms.find((platform) => platform.id === movingPlatform.id);
    dashState.player.dashTimerMs = 0;
    dashState.player.x = movingJumpPlatform.x + 32;
    dashState.player.y = movingJumpPlatform.y - dashState.player.height;
    dashState.player.onGround = true;
    dashState.player.supportPlatformId = movingJumpPlatform.id;
    bridge.pressJump();
    let movingJumpState = bridge.getSession().getState();
    for (let i = 0; i < 3; i += 1) {
      bridge.consumeFrame(16);
      movingJumpState = bridge.getSession().getState();
      if (movingJumpState.player.vy < 0 && movingJumpState.player.supportPlatformId === null && !movingJumpState.player.onGround) {
        break;
      }
    }

    bridge.forceStartStage(0);
    resetToGameScene();
    let collapseProbeState = bridge.getSession().getState();
    const fallingPlatform = collapseProbeState.stageRuntime.platforms.find((platform) => platform.kind === 'falling');
    collapseProbeState.player.x = fallingPlatform.x + 8;
    collapseProbeState.player.y = fallingPlatform.y - collapseProbeState.player.height;
    collapseProbeState.player.onGround = true;
    collapseProbeState.player.supportPlatformId = fallingPlatform.id;
    collapseProbeState.player.vy = 0;
    bridge.consumeFrame(16);
    for (let i = 0; i < 70; i += 1) {
      bridge.consumeFrame(16);
    }
    const collapseState = bridge.getSession().getState();

    bridge.forceStartStage(0);
    resetToGameScene();
    let fallingJumpState = bridge.getSession().getState();
    let fallingJumpPlatform = fallingJumpState.stageRuntime.platforms.find((platform) => platform.kind === 'falling');
    fallingJumpState.player.x = fallingJumpPlatform.x + 28;
    fallingJumpState.player.y = fallingJumpPlatform.y - fallingJumpState.player.height;
    fallingJumpState.player.onGround = true;
    fallingJumpState.player.supportPlatformId = fallingJumpPlatform.id;
    fallingJumpState.player.vy = 0;
    bridge.consumeFrame(16);
    for (let i = 0; i < 48; i += 1) {
      bridge.consumeFrame(16);
    }
    const fallingRideState = bridge.getSession().getState();
    const fallingRidePlatform = fallingRideState.stageRuntime.platforms.find((platform) => platform.id === fallingJumpPlatform.id);
    bridge.pressJump();
    bridge.consumeFrame(16);
    fallingJumpState = bridge.getSession().getState();

    bridge.forceStartStage(0);
    resetToGameScene();
    let springProbeState = bridge.getSession().getState();
    const springPlatform = springProbeState.stageRuntime.platforms.find((platform) => platform.kind === 'spring');
    springProbeState.player.x = springPlatform.x + 10;
    springProbeState.player.y = springPlatform.y - springProbeState.player.height;
    springProbeState.player.vy = 60;
    let springMinVy = springProbeState.player.vy;
    let springCues = [];
    bridge.consumeFrame(16);
    springCues = springCues.concat(bridge.drainCues());
    let springState = bridge.getSession().getState();
    springMinVy = Math.min(springMinVy, springState.player.vy);
    for (let i = 0; i < 4; i += 1) {
      bridge.consumeFrame(16);
      springCues = springCues.concat(bridge.drainCues());
      springState = bridge.getSession().getState();
      springMinVy = Math.min(springMinVy, springState.player.vy);
    }

    bridge.forceStartStage(0);
    resetToGameScene();
    let bounceLauncherState = bridge.getSession().getState();
    bounceLauncherState.stageRuntime.enemies = [];
    bounceLauncherState.stageRuntime.hazards = [];
    const bouncePod = bounceLauncherState.stageRuntime.launchers.find((launcher) => launcher.kind === 'bouncePod');
    const bounceSupportPlatform = bounceLauncherState.stageRuntime.platforms.find(
      (platform) => platform.id === bouncePod.supportPlatformId,
    );
    bounceLauncherState.player.x = bouncePod.x + Math.min(bouncePod.width - 12, 12) - bounceLauncherState.player.width / 2;
    bounceLauncherState.player.y = bounceSupportPlatform.y - bounceLauncherState.player.height - 1;
    bounceLauncherState.player.vx = 0;
    bounceLauncherState.player.vy = 160;
    bounceLauncherState.player.onGround = false;
    bounceLauncherState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const bounceLauncherResult = bridge.getSession().getState();
    const bounceLauncherCues = bridge.drainCues();
    const bouncePodLaunchWorked =
      bounceLauncherCues.includes('bounce-pod') &&
      Math.abs(bounceLauncherResult.player.vx) > 250 &&
      bounceLauncherResult.player.vy < -900;

    bridge.forceStartStage(2);
    resetToGameScene();
    let gasLauncherState = bridge.getSession().getState();
    gasLauncherState.stageRuntime.enemies = [];
    gasLauncherState.stageRuntime.hazards = [];
    const gasVent = gasLauncherState.stageRuntime.launchers.find((launcher) => launcher.kind === 'gasVent');
    const gasVentSupportPlatform = gasLauncherState.stageRuntime.platforms.find(
      (platform) => platform.id === gasVent.supportPlatformId,
    );
    const gasVentGravityCapsule = gasLauncherState.stageRuntime.gravityCapsules.find((capsule) => capsule.id === 'sky-anti-grav-capsule');
    const gasVentButtonSupport = gasLauncherState.stageRuntime.platforms.find((platform) => {
      const overlap = Math.max(
        0,
        Math.min(gasVentGravityCapsule.button.x + gasVentGravityCapsule.button.width, platform.x + platform.width) -
          Math.max(gasVentGravityCapsule.button.x, platform.x),
      );
      return (
        overlap >= Math.min(gasVentGravityCapsule.button.width * 0.55, platform.width) &&
        Math.abs(gasVentGravityCapsule.button.y + gasVentGravityCapsule.button.height - platform.y) <= 24
      );
    });
    gasLauncherState.player.x = gasVentGravityCapsule.button.x + gasVentGravityCapsule.button.width / 2 - gasLauncherState.player.width / 2;
    gasLauncherState.player.y = gasVentButtonSupport.y - gasLauncherState.player.height;
    gasLauncherState.player.vx = 0;
    gasLauncherState.player.vy = 0;
    gasLauncherState.player.onGround = true;
    gasLauncherState.player.supportPlatformId = gasVentButtonSupport.id;
    bridge.consumeFrame(16);
    gasLauncherState = bridge.getSession().getState();
    gasLauncherState.player.x = gasVent.x + Math.min(gasVent.width - 12, 12) - gasLauncherState.player.width / 2;
    gasLauncherState.player.y = gasVentSupportPlatform.y - gasLauncherState.player.height - 1;
    gasLauncherState.player.vx = 0;
    gasLauncherState.player.vy = 160;
    gasLauncherState.player.onGround = false;
    gasLauncherState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const gasLauncherResult = bridge.getSession().getState();
    const gasLauncherCues = bridge.drainCues();
    bridge.consumeFrame(16);
    const gasLauncherFieldState = bridge.getSession().getState();
    const gasVentLaunchWorked =
      gasLauncherCues.includes('gas-vent') &&
      Math.abs(gasLauncherResult.player.vx) > 120 &&
      gasLauncherResult.player.vy < -780 &&
      gasLauncherFieldState.player.gravityFieldKind === 'anti-grav-stream';

    bridge.forceStartStage(0);
    resetToGameScene();
    let chargerProbeState = bridge.getSession().getState();
    const charger = chargerProbeState.stageRuntime.enemies.find((enemy) => enemy.kind === 'charger');
    chargerProbeState.player.x = charger.x + 40;
    chargerProbeState.player.y = charger.y;
    let chargerSawWindup = false;
    let chargerSawCharge = false;
    for (let i = 0; i < 70; i += 1) {
      bridge.consumeFrame(16);
      const iterState = bridge.getSession().getState();
      const iterCharger = iterState.stageRuntime.enemies.find((enemy) => enemy.id === charger.id);
      if (iterCharger?.charger?.state === 'windup') {
        chargerSawWindup = true;
      }
      if (iterCharger?.charger?.state === 'charge') {
        chargerSawCharge = true;
      }
    }

    bridge.forceStartStage(2);
    resetToGameScene();
    state = bridge.getSession().getState();
    const flyer = state.stageRuntime.enemies.find((enemy) => enemy.kind === 'flyer');
    const flyerStart = { x: flyer.x, y: flyer.y };
    for (let i = 0; i < 30; i += 1) {
      bridge.consumeFrame(16);
    }
    const flyerState = bridge.getSession().getState();
    const flyerAfter = flyerState.stageRuntime.enemies.find((enemy) => enemy.id === flyer.id);

    bridge.forceStartStage(2);
    resetToGameScene();
    const hopperTuneState = bridge.getSession().getState();
    const hopperImpulses = hopperTuneState.stage.enemies
      .filter((enemy) => enemy.kind === 'hopper' && enemy.hop)
      .map((enemy) => enemy.hop.impulse);

    const gameScene = game.scene.getScene('game');
    const capturePowerSignature = (power) => {
      const powerState = bridge.getSession().getState();
      for (const key of Object.keys(powerState.progress.activePowers)) {
        powerState.progress.activePowers[key] = false;
      }
      powerState.progress.powerTimers.invincibleMs = 0;
      powerState.player.presentationPower = null;
      if (power === 'invincible') {
        powerState.progress.activePowers.invincible = true;
        powerState.progress.powerTimers.invincibleMs = 9000;
      } else {
        powerState.progress.activePowers[power] = true;
      }
      bridge.consumeFrame(16);
      gameScene.syncView();
      return JSON.stringify({
        fill: gameScene.player.fillColor,
        stroke: gameScene.player.strokeColor,
        aura: gameScene.playerAura.visible,
        accent: gameScene.playerAccent.visible,
        headband: gameScene.playerHeadband.visible,
        wingLeft: gameScene.playerWingLeft.visible,
        wingRight: gameScene.playerWingRight.visible,
      });
    };
    const powerSignatures = ['doubleJump', 'shooter', 'invincible', 'dash'].map(capturePowerSignature);
    const powerVariantDistinct = new Set(powerSignatures).size === powerSignatures.length;

    bridge.forceStartStage(0);
    resetToGameScene();
    const readabilityState = bridge.getSession().getState();
    const readabilityScene = game.scene.getScene('game');
    readabilityScene.syncView();
    const groundPlatform = readabilityState.stageRuntime.platforms.find(
      (platform) => platform.kind === 'static' && !platform.temporaryBridge && !platform.magnetic,
    );
    const firstCheckpoint = readabilityState.stageRuntime.checkpoints[0];
    const firstCollectible = readabilityState.stageRuntime.collectibles[0];
    const firstRewardBlock = readabilityState.stageRuntime.rewardBlocks[0];
    const firstHazard = readabilityState.stageRuntime.hazards[0];
    const groundFill = groundPlatform ? readabilityScene.platformSprites.get(groundPlatform.id)?.fillColor : null;
    const checkpointTint = firstCheckpoint ? readabilityScene.checkpointSprites.get(firstCheckpoint.id)?.tintTopLeft : null;
    const collectibleTint = firstCollectible ? readabilityScene.collectibleSprites.get(firstCollectible.id)?.tintTopLeft : null;
    const rewardBlockFill = firstRewardBlock ? readabilityScene.rewardBlockSprites.get(firstRewardBlock.id)?.fillColor : null;
    const hazardFill = firstHazard ? readabilityScene.hazardSprites.get(firstHazard.id)?.fillColor : null;
    const backdropColors = [
      readabilityScene.retroPalette.background,
      readabilityScene.retroPalette.skyline,
      readabilityScene.retroPalette.groundBand,
      readabilityScene.retroPalette.backdropColumn,
      readabilityScene.retroPalette.backdropAccent,
    ];
    const toRgb = (color) => {
      if (typeof color === 'number') {
        return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
      }
      if (typeof color !== 'string') {
        return null;
      }
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
    };
    const toLuminance = (color) => {
      const channels = toRgb(color);
      if (!channels) {
        return null;
      }
      const [red, green, blue] = channels.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };
    const contrastRatio = (left, right) => {
      const leftLuminance = toLuminance(left);
      const rightLuminance = toLuminance(right);
      if (leftLuminance === null || rightLuminance === null) {
        return 0;
      }
      const lighter = Math.max(leftLuminance, rightLuminance);
      const darker = Math.min(leftLuminance, rightLuminance);
      return (lighter + 0.05) / (darker + 0.05);
    };
    const backdropRouteSeparationReadable =
      Boolean(groundFill && rewardBlockFill && hazardFill) &&
      backdropColors.every(
        (color) => color !== groundFill && color !== rewardBlockFill && color !== hazardFill && color !== readabilityScene.retroPalette.panelAlt,
      );
    const stageZeroBackdropSignature = backdropColors.join(':');
    const routingInteractablesReadable =
      Boolean(groundFill && checkpointTint && collectibleTint && rewardBlockFill && hazardFill) &&
      checkpointTint !== groundFill &&
      collectibleTint !== groundFill &&
      rewardBlockFill !== groundFill &&
      checkpointTint !== collectibleTint;
    const hazardContrastReadable = Boolean(
      groundFill &&
        hazardFill &&
        hazardFill !== groundFill,
    );

    bridge.forceStartStage(1);
    resetToGameScene();
    let turretState = bridge.getSession().getState();
    const turretScene = game.scene.getScene('game');
    turretScene.syncView();
    const stageOneBackdropSignature = [
      turretScene.retroPalette.background,
      turretScene.retroPalette.skyline,
      turretScene.retroPalette.groundBand,
      turretScene.retroPalette.backdropColumn,
      turretScene.retroPalette.backdropAccent,
    ].join(':');
    const authoredBackdropResponsive = stageOneBackdropSignature !== stageZeroBackdropSignature;
    const variantTurret = turretState.stageRuntime.enemies.find((enemy) => enemy.kind === 'turret' && enemy.variant);
    if (!variantTurret?.turret || !variantTurret.supportPlatformId) {
      throw new Error('Expected biome-linked turret fixture for retro readability checks.');
    }
    variantTurret.turret.telegraphMs = Math.max(1, Math.floor(variantTurret.turret.telegraphDurationMs / 2));
    turretScene.syncView();
    const turretTelegraphReadable =
      turretScene.enemySprites.get(variantTurret.id)?.tintTopLeft !==
        turretScene.platformSprites.get(variantTurret.supportPlatformId)?.fillColor &&
      (turretScene.enemySprites.get(variantTurret.id)?.scaleX ?? 1) > 1;
    bridge.setCameraViewBox({ x: 0, y: 0, width: 960, height: 540 });
    let offscreenTurretCue = false;
    for (let i = 0; i < 180; i += 1) {
      bridge.consumeFrame(16);
      offscreenTurretCue ||= bridge.drainCues().includes('turret-fire');
    }
    const offscreenProjectileCount = bridge.getSession().getState().stageRuntime.projectiles.filter((shot) => shot.owner === 'enemy').length;
    const firstTurret = turretState.stageRuntime.enemies.find((enemy) => enemy.kind === 'turret');
    turretState.player.x = firstTurret.x - 140;
    turretState.player.y = Math.max(0, firstTurret.y);
    bridge.setCameraViewBox({ x: firstTurret.x - 1040, y: Math.max(0, firstTurret.y - 160), width: 960, height: 540 });
    let leadMarginTurretCue = false;
    for (let i = 0; i < 180; i += 1) {
      bridge.consumeFrame(16);
      leadMarginTurretCue ||= bridge.drainCues().includes('turret-fire');
    }
    const leadMarginProjectileCount = bridge.getSession().getState().stageRuntime.projectiles.filter((shot) => shot.owner === 'enemy').length;
    const turretVisibilityGated =
      !offscreenTurretCue &&
      offscreenProjectileCount === 0 &&
      (leadMarginTurretCue || leadMarginProjectileCount > 0);

    bridge.forceStartStage(2);
    resetToGameScene();
    let gravityFieldProbeState = bridge.getSession().getState();
    const antiGravStream = gravityFieldProbeState.stageRuntime.gravityFields.find(
      (field) => field.kind === 'anti-grav-stream',
    );
    const inversionColumn = gravityFieldProbeState.stageRuntime.gravityFields.find(
      (field) => field.kind === 'gravity-inversion-column',
    );
    const revealTrigger = gravityFieldProbeState.stageRuntime.revealVolumes[0];
    const hiddenPlatform = gravityFieldProbeState.stageRuntime.platforms.find((platform) => platform.reveal);
    const scannerTrigger = gravityFieldProbeState.stageRuntime.scannerVolumes.find((volume) => volume.id === 'sky-halo-scanner');
    const temporaryBridgePlatform = gravityFieldProbeState.stageRuntime.platforms.find((platform) => platform.id === 'sky-temporary-bridge-1');
    const timedRevealTrigger = gravityFieldProbeState.stageRuntime.revealVolumes.find((volume) => volume.id === 'sky-timed-route-trigger');
    const timedRevealRoute = gravityFieldProbeState.stage.secretRoutes?.find((route) => route.id === 'sky-halo-timed-secret-route');
    const haloCheckpoint = gravityFieldProbeState.stageRuntime.checkpoints.find((checkpoint) => checkpoint.id === 'cp-5');
    const gravityCapsule = gravityFieldProbeState.stageRuntime.gravityCapsules.find((capsule) => capsule.id === 'sky-anti-grav-capsule');
    if (!antiGravStream || !inversionColumn || !haloCheckpoint || !gravityCapsule) {
      throw new Error('Expected Halo Spire gravity capsule fixtures.');
    }
    const bridgeStateId = 'sky-temporary-bridge-1';
    const supportsRouteRect = (platform, rect) => {
      const overlap = Math.max(
        0,
        Math.min(rect.x + rect.width, platform.x + platform.width) - Math.max(rect.x, platform.x),
      );
      return overlap >= Math.min(rect.width * 0.55, platform.width) && Math.abs(rect.y + rect.height - platform.y) <= 24;
    };
    const rectWithinRect = (inner, outer) =>
      inner.x >= outer.x &&
      inner.y >= outer.y &&
      inner.x + inner.width <= outer.x + outer.width &&
      inner.y + inner.height <= outer.y + outer.height;
    const probeGravityRoomBottomEdge = (stageIndex, capsuleId, expectBlocked) => {
      bridge.forceStartStage(stageIndex);
      resetToGameScene();
      const probeState = bridge.getSession().getState();
      const probeCapsule = probeState.stageRuntime.gravityCapsules.find((capsule) => capsule.id === capsuleId);
      const shellBottom = probeCapsule.shell.y + probeCapsule.shell.height;

      probeState.stageRuntime.enemies = [];
      probeState.stageRuntime.hazards = [];
      probeState.player.x = probeCapsule.shell.x + probeCapsule.shell.width / 2 - probeState.player.width / 2;
      probeState.player.y = shellBottom + 2;
      probeState.player.vx = 0;
      probeState.player.vy = -400;
      probeState.player.onGround = false;
      probeState.player.supportPlatformId = null;
      bridge.consumeFrame(16);

      const afterProbe = bridge.getSession().getState();
      return expectBlocked ? afterProbe.player.y >= shellBottom : afterProbe.player.y < shellBottom;
    };
    const probeGravityRoomSideDoor = (stageIndex, capsuleId, side, expectPassThrough) => {
      bridge.forceStartStage(stageIndex);
      resetToGameScene();
      const probeState = bridge.getSession().getState();
      const probeCapsule = probeState.stageRuntime.gravityCapsules.find((capsule) => capsule.id === capsuleId);
      const shellRight = probeCapsule.shell.x + probeCapsule.shell.width;
      const door = side === 'left' ? probeCapsule.entryDoor : probeCapsule.exitDoor;

      probeState.stageRuntime.enemies = [];
      probeState.stageRuntime.hazards = [];
      probeState.player.x =
        side === 'left' ? probeCapsule.shell.x - probeState.player.width + 2 : shellRight - 2;
      probeState.player.y = door.y + door.height / 2 - probeState.player.height / 2;
      probeState.player.vx = side === 'left' ? 420 : 420;
      probeState.player.vy = 0;
      probeState.player.onGround = false;
      probeState.player.supportPlatformId = null;
      bridge.consumeFrame(16);

      const afterProbe = bridge.getSession().getState();
      return expectPassThrough
        ? side === 'left'
          ? afterProbe.player.x >= probeCapsule.shell.x
          : afterProbe.player.x >= shellRight
        : side === 'left'
          ? afterProbe.player.x < probeCapsule.shell.x
          : afterProbe.player.x < shellRight;
    };
    const gravityRoomWallContainmentAcrossStages = (() => {
      const audit = [0, 1, 2].map((stageIndex) => {
        bridge.forceStartStage(stageIndex);
        resetToGameScene();
        const rolloutState = bridge.getSession().getState();

        return rolloutState.stageRuntime.gravityCapsules.every((capsule) => {
          return (
            probeGravityRoomSideDoor(stageIndex, capsule.id, 'left', true) &&
            probeGravityRoomSideDoor(stageIndex, capsule.id, 'right', true) &&
            probeGravityRoomBottomEdge(stageIndex, capsule.id, true)
          );
        });
      });

      return audit.every(Boolean);
    })();

    const gameSceneDebugSnapshot = game.scene.getScene('game').getDebugSnapshot();
    const gravityFieldVisuals = gameSceneDebugSnapshot.gravityFieldVisuals;
    const gravityCapsuleVisual = gameSceneDebugSnapshot.gravityCapsuleVisuals.find(
      (capsule) => capsule.id === gravityCapsule.id,
    );
    const gravityCapsuleDormantVisible = Boolean(
      gravityCapsuleVisual &&
        gravityCapsuleVisual.shellVisible &&
        gravityCapsuleVisual.entryDoorVisible &&
        gravityCapsuleVisual.exitDoorVisible &&
        gravityCapsuleVisual.buttonVisible &&
        gravityCapsuleVisual.enabled &&
        gravityCapsuleVisual.shellFillAlpha > 0,
    );
      const gravityCapsuleRoutesAuthored = Boolean(
        gravityCapsule.entryRoute && gravityCapsule.buttonRoute && gravityCapsule.exitRoute && gravityCapsule.shell,
      );
    const gravityCapsuleRouteContained = Boolean(
        gravityCapsuleRoutesAuthored &&
          rectWithinRect(gravityCapsule.entryRoute, gravityCapsule.shell) &&
          rectWithinRect(gravityCapsule.buttonRoute, gravityCapsule.shell) &&
          rectWithinRect(gravityCapsule.exitRoute, gravityCapsule.shell) &&
        gravityFieldProbeState.stageRuntime.platforms.some(
          (platform) => !platform.temporaryBridge && supportsRouteRect(platform, gravityCapsule.entryRoute),
        ) &&
        gravityFieldProbeState.stageRuntime.platforms.some(
          (platform) => !platform.temporaryBridge && supportsRouteRect(platform, gravityCapsule.buttonRoute),
        ) &&
        gravityFieldProbeState.stageRuntime.platforms.some(
          (platform) => !platform.temporaryBridge && supportsRouteRect(platform, gravityCapsule.exitRoute),
        ),
    );
    const gravityFieldRouteReadable = Boolean(
      antiGravStream &&
        inversionColumn &&
        antiGravStream.x < inversionColumn.x &&
        gravityFieldVisuals.find((field) => field.id === antiGravStream.id)?.visible &&
        gravityFieldVisuals.find((field) => field.id === inversionColumn.id)?.visible &&
        gravityFieldVisuals.find((field) => field.id === antiGravStream.id)?.fillAlpha <
          gravityFieldVisuals.find((field) => field.id === inversionColumn.id)?.fillAlpha,
    );
    const gravityFieldCheckpointSafe = Boolean(
      haloCheckpoint &&
        !gravityFieldProbeState.stageRuntime.gravityFields.some((field) => {
          const paddedField = expandRect(field, 56);
          return (
            paddedField.x < haloCheckpoint.rect.x + haloCheckpoint.rect.width &&
            paddedField.x + paddedField.width > haloCheckpoint.rect.x &&
            paddedField.y < haloCheckpoint.rect.y + haloCheckpoint.rect.height &&
            paddedField.y + paddedField.height > haloCheckpoint.rect.y
          );
        }),
    );

    gravityFieldProbeState.player.x = antiGravStream.x + 40;
    gravityFieldProbeState.player.y = antiGravStream.y + 48;
    gravityFieldProbeState.player.vx = 0;
    gravityFieldProbeState.player.vy = 0;
    gravityFieldProbeState.player.onGround = false;
    gravityFieldProbeState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const dormantAntiGravState = bridge.getSession().getState();
    const gravityCapsuleDormantBlocked =
      dormantAntiGravState.player.gravityFieldKind === 'anti-grav-stream' &&
      dormantAntiGravState.player.gravityScale < 0 &&
      dormantAntiGravState.stageRuntime.gravityCapsules.find((capsule) => capsule.id === gravityCapsule.id).enabled === true;

    const gravityButtonSupport = dormantAntiGravState.stageRuntime.platforms.find((platform) => {
      const overlap = Math.max(
        0,
        Math.min(gravityCapsule.button.x + gravityCapsule.button.width, platform.x + platform.width) -
          Math.max(gravityCapsule.button.x, platform.x),
      );
      return overlap >= Math.min(gravityCapsule.button.width * 0.55, platform.width) && Math.abs(gravityCapsule.button.y + gravityCapsule.button.height - platform.y) <= 24;
    });
    dormantAntiGravState.player.x = gravityCapsule.button.x + gravityCapsule.button.width / 2 - dormantAntiGravState.player.width / 2;
    dormantAntiGravState.player.y = gravityButtonSupport.y - dormantAntiGravState.player.height;
    dormantAntiGravState.player.vx = 0;
    dormantAntiGravState.player.vy = 0;
    dormantAntiGravState.player.onGround = true;
    dormantAntiGravState.player.supportPlatformId = gravityButtonSupport.id;
    bridge.consumeFrame(16);
    const capsuleActivationState = bridge.getSession().getState();
    const gravityCapsuleActivationTriggered = Boolean(
      gravityCapsuleDormantBlocked &&
        !capsuleActivationState.stageRuntime.gravityCapsules.find((capsule) => capsule.id === gravityCapsule.id).enabled &&
        capsuleActivationState.stageRuntime.gravityCapsules.find((capsule) => capsule.id === gravityCapsule.id).button.activated,
    );

    capsuleActivationState.player.x = antiGravStream.x + 40;
    capsuleActivationState.player.y = antiGravStream.y + 48;
    capsuleActivationState.player.vx = 0;
    capsuleActivationState.player.vy = 0;
    capsuleActivationState.player.onGround = false;
    capsuleActivationState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const antiGravState = bridge.getSession().getState();
    const antiGravStreamApplied =
      gravityCapsuleActivationTriggered &&
      antiGravState.player.gravityFieldKind === null &&
      antiGravState.player.gravityScale === 1;
    antiGravState.progress.activePowers.dash = true;
    antiGravState.player.x = antiGravStream.x + 52;
    antiGravState.player.y = antiGravStream.y + 48;
    antiGravState.player.vx = 0;
    antiGravState.player.vy = 60;
    antiGravState.player.onGround = false;
    antiGravState.player.supportPlatformId = null;
    bridge.pressDash();
    bridge.consumeFrame(16);
    const gravityFieldDashState = bridge.getSession().getState();
    const gravityFieldDashSuppressed =
      gravityFieldDashState.player.dashTimerMs > 0 &&
      gravityFieldDashState.player.gravityFieldId === null &&
      gravityFieldDashState.player.gravityScale === 1;

    gravityFieldDashState.player.dashTimerMs = 0;
    gravityFieldDashState.player.x = inversionColumn.x + 36;
    gravityFieldDashState.player.y = inversionColumn.y + 52;
    gravityFieldDashState.player.vx = 0;
    gravityFieldDashState.player.vy = 0;
    gravityFieldDashState.player.onGround = false;
    gravityFieldDashState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const inversionState = bridge.getSession().getState();
    const gravityInversionApplied =
      inversionState.player.gravityFieldKind === 'gravity-inversion-column' &&
      inversionState.player.gravityScale < 0 &&
      inversionState.player.vy < 0;

    inversionState.player.x = inversionColumn.x + inversionColumn.width + 56;
    inversionState.player.y = inversionColumn.y + 52;
    inversionState.player.vx = 0;
    inversionState.player.vy = 0;
    inversionState.player.onGround = false;
    inversionState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    const gravityFieldExitState = bridge.getSession().getState();
    const gravityFieldExitRestored =
      gravityFieldExitState.player.gravityFieldId === null &&
      gravityFieldExitState.player.gravityScale === 1 &&
      gravityFieldExitState.player.vy > 0;

    const hiddenInitiallyInactive = !gravityFieldExitState.stageRuntime.revealedPlatformIds.includes(hiddenPlatform.reveal.id);

    gravityFieldExitState.player.x = revealTrigger.x + 16;
    gravityFieldExitState.player.y = revealTrigger.y + 16;
    gravityFieldExitState.player.vx = 0;
    gravityFieldExitState.player.vy = 0;
    bridge.consumeFrame(16);
    const revealState = bridge.getSession().getState();
    const revealRouteUnlocked =
      hiddenInitiallyInactive && revealState.stageRuntime.revealedPlatformIds.includes(hiddenPlatform.reveal.id);

    const bridgeInitiallyInactive = !revealState.stageRuntime.temporaryBridges.find((bridge) => bridge.id === bridgeStateId).active;
    revealState.player.x = scannerTrigger.x + 16;
    revealState.player.y = scannerTrigger.y + 16;
    revealState.player.vx = 0;
    revealState.player.vy = 0;
    bridge.consumeFrame(16);
    const blockedActivationState = bridge.getSession().getState();
    const timedRevealActivationGuard =
      bridgeInitiallyInactive &&
      !blockedActivationState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).active;

    blockedActivationState.player.x = scannerTrigger.x - blockedActivationState.player.width - 24;
    blockedActivationState.player.y = scannerTrigger.y + 16;
    bridge.consumeFrame(16);

    const discoveryState = bridge.getSession().getState();
    discoveryState.player.x = timedRevealTrigger.x + 16;
    discoveryState.player.y = timedRevealTrigger.y + 16;
    discoveryState.player.vx = 0;
    discoveryState.player.vy = 0;
    bridge.consumeFrame(16);

    const timedRevealState = bridge.getSession().getState();
    const timedRevealDiscovered = timedRevealState.stageRuntime.revealedPlatformIds.includes(
      timedRevealState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).revealId,
    );
    const timedRevealSkipFallback = Boolean(
      timedRevealRoute &&
        timedRevealState.stageRuntime.platforms.some(
          (platform) => !platform.temporaryBridge && supportsRouteRect(platform, timedRevealRoute.mainPath),
        ) &&
        !timedRevealState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).active,
    );

    timedRevealState.player.x = scannerTrigger.x + 16;
    timedRevealState.player.y = scannerTrigger.y + 16;
    timedRevealState.player.vx = 0;
    timedRevealState.player.vy = 0;
    bridge.consumeFrame(16);
    const scannerActivationState = bridge.getSession().getState();
    const scannerBridgeActivated =
      bridgeInitiallyInactive &&
      scannerActivationState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).active &&
      scannerActivationState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).remainingMs ===
        scannerActivationState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).durationMs;
    const timedRevealActivated =
      scannerBridgeActivated &&
      scannerActivationState.stageRuntime.revealedPlatformIds.includes(
        scannerActivationState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).revealId,
      );

    bridge.consumeFrame(16);
    const scannerStayState = bridge.getSession().getState();
    const scannerBridgeNoStayRefresh =
      scannerStayState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).remainingMs <
      scannerStayState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).durationMs;

    scannerStayState.player.x = scannerTrigger.x - scannerStayState.player.width - 24;
    scannerStayState.player.y = scannerTrigger.y + 16;
    bridge.consumeFrame(16);

    const scannerLeaveState = bridge.getSession().getState();
    scannerLeaveState.player.x = scannerTrigger.x + scannerTrigger.width - 20;
    scannerLeaveState.player.y = scannerTrigger.y + 16;
    bridge.consumeFrame(16);

    const scannerReentryState = bridge.getSession().getState();
    const scannerBridgeReentryRefresh =
      scannerReentryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).remainingMs ===
      scannerReentryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).durationMs;

    const liveBridge = scannerReentryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId);
    liveBridge.remainingMs = 1;
    scannerReentryState.player.x = temporaryBridgePlatform.x + 24;
    scannerReentryState.player.y = temporaryBridgePlatform.y - scannerReentryState.player.height;
    scannerReentryState.player.vx = 0;
    scannerReentryState.player.vy = 0;
    scannerReentryState.player.onGround = true;
    scannerReentryState.player.supportPlatformId = liveBridge.id;
    bridge.consumeFrame(16);

    const occupiedExpiryState = bridge.getSession().getState();
    const heldBridgeSupport =
      occupiedExpiryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).active &&
      occupiedExpiryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).pendingHide;

    occupiedExpiryState.player.x = temporaryBridgePlatform.x + temporaryBridgePlatform.width + 36;
    occupiedExpiryState.player.y = temporaryBridgePlatform.y - occupiedExpiryState.player.height;
    occupiedExpiryState.player.onGround = true;
    occupiedExpiryState.player.supportPlatformId = liveBridge.id;
    bridge.consumeFrame(16);

    const releasedExpiryState = bridge.getSession().getState();
    const scannerBridgeOccupiedExpiry =
      heldBridgeSupport && !releasedExpiryState.stageRuntime.temporaryBridges.find((entry) => entry.id === bridgeStateId).active;
    const timedRevealReconnectionReady = Boolean(
      timedRevealRoute &&
        releasedExpiryState.stageRuntime.platforms.some(
          (platform) => !platform.temporaryBridge && supportsRouteRect(platform, timedRevealRoute.reconnect),
        ),
    );

    bridge.forceStartStage(2);
    resetToGameScene();
    let gravityFieldResetState = bridge.getSession().getState();
    gravityFieldResetState.player.x = haloCheckpoint.rect.x;
    gravityFieldResetState.player.y = haloCheckpoint.rect.y;
    gravityFieldResetState.player.vx = 0;
    gravityFieldResetState.player.vy = 0;
    bridge.consumeFrame(16);
    gravityFieldResetState = bridge.getSession().getState();
    gravityFieldResetState.player.x = antiGravStream.x + 40;
    gravityFieldResetState.player.y = antiGravStream.y + 48;
    gravityFieldResetState.player.vx = 0;
    gravityFieldResetState.player.vy = 0;
    gravityFieldResetState.player.onGround = false;
    gravityFieldResetState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    gravityFieldResetState = bridge.getSession().getState();
    gravityFieldResetState.player.health = 1;
    bridge.getSession().damagePlayer();
    bridge.getSession().respawnPlayer();
    gravityFieldResetState = bridge.getSession().getState();
    const gravityFieldResetConsistent =
      gravityFieldResetState.activeCheckpointId === 'cp-5' &&
      gravityFieldResetState.player.gravityFieldId === null &&
      gravityFieldResetState.player.gravityFieldKind === null &&
      gravityFieldResetState.player.gravityScale === 1 &&
      gravityFieldResetState.stageRuntime.gravityFields.length === 2;
    const gravityCapsuleResetConsistent = Boolean(
      gravityFieldResetConsistent &&
        gravityFieldResetState.stageRuntime.gravityCapsules.find((capsule) => capsule.id === gravityCapsule.id).enabled === true &&
        gravityFieldResetState.stageRuntime.gravityCapsules.find((capsule) => capsule.id === gravityCapsule.id).button.activated === false,
    );

    bridge.forceStartStage(0);
    resetToGameScene();
    let magneticState = bridge.getSession().getState();
    magneticState.stageRuntime.enemies = [];
    magneticState.stageRuntime.hazards = [];
    const magneticNode = magneticState.stageRuntime.activationNodes.find((node) => node.id === 'forest-magnetic-node-1');
    const magneticPlatform = magneticState.stageRuntime.platforms.find((platform) => platform.id === 'forest-magnetic-platform-1');
    const magneticFallback = magneticState.stageRuntime.platforms.find((platform) => platform.id === 'platform-9920-540');
    const magneticCheckpoint = magneticState.stageRuntime.checkpoints.find((checkpoint) => checkpoint.id === 'cp-5');
    if (!magneticNode || !magneticPlatform?.magnetic || !magneticFallback || !magneticCheckpoint) {
      throw new Error('Expected forest magnetic fixtures.');
    }
    const magneticScene = game.scene.getScene('game');
    magneticScene.syncView();
    const dormantMagneticVisual = magneticScene
      .getDebugSnapshot()
      .magneticPlatformVisuals.find((platform) => platform.id === magneticPlatform.id);
    const dormantNodeVisual = magneticScene
      .getDebugSnapshot()
      .activationNodeVisuals.find((node) => node.id === magneticNode.id);
    const magneticDormantVisible = Boolean(
      dormantMagneticVisual?.visible &&
        dormantNodeVisual?.visible &&
        dormantMagneticVisual.alpha < 1 &&
        dormantMagneticVisual.fillColor !== dormantNodeVisual.fillColor,
    );

    magneticState.player.x = magneticCheckpoint.rect.x;
    magneticState.player.y = magneticCheckpoint.rect.y;
    magneticState.player.vx = 0;
    magneticState.player.vy = 0;
    bridge.consumeFrame(16);

    magneticState = bridge.getSession().getState();
    magneticState.player.x = magneticNode.x + 2;
    magneticState.player.y = magneticNode.y + 2;
    magneticState.player.vx = 0;
    magneticState.player.vy = 0;
    magneticState.player.onGround = false;
    magneticState.player.supportPlatformId = null;
    bridge.consumeFrame(16);

    magneticState = bridge.getSession().getState();
    magneticScene.syncView();
    const poweredMagneticVisual = magneticScene
      .getDebugSnapshot()
      .magneticPlatformVisuals.find((platform) => platform.id === magneticPlatform.id);
    const poweredNodeVisual = magneticScene
      .getDebugSnapshot()
      .activationNodeVisuals.find((node) => node.id === magneticNode.id);
    const magneticNodeTriggered =
      magneticState.stageRuntime.activationNodes.find((node) => node.id === magneticNode.id)?.activated === true &&
      magneticState.stageRuntime.platforms.find((platform) => platform.id === magneticPlatform.id)?.magnetic?.powered === true;
    const magneticVisualDistinct = Boolean(
      dormantMagneticVisual &&
        poweredMagneticVisual &&
        poweredNodeVisual &&
        (poweredMagneticVisual.fillColor !== dormantMagneticVisual.fillColor ||
          poweredMagneticVisual.alpha > dormantMagneticVisual.alpha) &&
        poweredNodeVisual.fillColor !== dormantNodeVisual?.fillColor,
    );

    magneticState.player.x = magneticPlatform.x + 32;
    magneticState.player.y = magneticPlatform.y - magneticState.player.height - 4;
    magneticState.player.vx = 0;
    magneticState.player.vy = 220;
    magneticState.player.onGround = false;
    magneticState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    bridge.consumeFrame(16);

    magneticState = bridge.getSession().getState();
    const magneticPoweredSupport = magneticState.player.onGround && magneticState.player.supportPlatformId === magneticPlatform.id;

    magneticState.player.health = 1;
    bridge.getSession().damagePlayer();
    bridge.getSession().respawnPlayer();
    magneticState = bridge.getSession().getState();
    const magneticRespawnReset =
      magneticState.activeCheckpointId === 'cp-5' &&
      magneticState.stageRuntime.activationNodes.find((node) => node.id === magneticNode.id)?.activated === false &&
      magneticState.stageRuntime.platforms.find((platform) => platform.id === magneticPlatform.id)?.magnetic?.powered === false;

    magneticState.player.x = magneticFallback.x + 32;
    magneticState.player.y = magneticFallback.y - magneticState.player.height - 4;
    magneticState.player.vx = 0;
    magneticState.player.vy = 220;
    magneticState.player.onGround = false;
    magneticState.player.supportPlatformId = null;
    bridge.consumeFrame(16);
    bridge.consumeFrame(16);
    magneticState = bridge.getSession().getState();
    const magneticRetrySafeFallback =
      magneticState.player.onGround && magneticState.player.supportPlatformId === magneticFallback.id;

    bridge.getSession().restartStage();
    resetToGameScene();
    magneticState = bridge.getSession().getState();
    const magneticFreshAttemptReset =
      magneticState.stageRuntime.activationNodes.find((node) => node.id === magneticNode.id)?.activated === false &&
      magneticState.stageRuntime.platforms.find((platform) => platform.id === magneticPlatform.id)?.magnetic?.powered === false;

    bridge.forceStartStage(2);
    resetToGameScene();
    let surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    const brittleSurface = surfaceProbeState.stageRuntime.terrainSurfaces.find((surface) => surface.kind === 'brittleCrystal');
    const stickySurface = surfaceProbeState.stageRuntime.terrainSurfaces.find((surface) => surface.kind === 'stickySludge');
    const brittleSupportPlatform = surfaceProbeState.stageRuntime.platforms.find((platform) => platform.id === brittleSurface.supportPlatformId);
    const stickySupportPlatform = surfaceProbeState.stageRuntime.platforms.find((platform) => platform.id === stickySurface.supportPlatformId);
    const normalSupportPlatform = surfaceProbeState.stageRuntime.platforms.find((platform) => platform.id === 'platform-8740-560');
    const surfaceScene = game.scene.getScene('game');
    surfaceScene.syncView();
    let surfaceVisuals = surfaceScene.getDebugSnapshot().terrainSurfaceVisuals;
    const brittleVisual = surfaceVisuals.find((surface) => surface.id === brittleSurface.id);
    const stickyVisual = surfaceVisuals.find((surface) => surface.id === stickySurface.id);
    const terrainSurfaceExtentsRendered =
      Boolean(brittleVisual?.visible) &&
      Boolean(stickyVisual?.visible) &&
      brittleVisual.x === brittleSurface.x &&
      brittleVisual.y === brittleSurface.y &&
      brittleVisual.width === brittleSurface.width &&
      brittleVisual.height === brittleSurface.height &&
      stickyVisual.x === stickySurface.x &&
      stickyVisual.y === stickySurface.y &&
      stickyVisual.width === stickySurface.width &&
      stickyVisual.height === stickySurface.height;
    const terrainSurfaceCueShapesVisible =
      brittleVisual?.detailVisibleCount === 3 &&
      stickyVisual?.detailVisibleCount === 3 &&
      brittleVisual.detailWidths.every((width) => width <= brittleSurface.width * 0.2) &&
      stickyVisual.detailHeights.every((height) => height <= Math.max(4, stickySurface.height * 0.34));

    surfaceProbeState.player.x = brittleSurface.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = brittleSupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = brittleSupportPlatform.id;
    bridge.consumeFrame(16);
    let brittleState = bridge.getSession().getState();
    surfaceScene.syncView();
    surfaceVisuals = surfaceScene.getDebugSnapshot().terrainSurfaceVisuals;
    const warnedBrittleVisual = surfaceVisuals.find((surface) => surface.id === brittleSurface.id);
    const brittleWarningTriggered =
      brittleState.stageRuntime.terrainSurfaces.find((surface) => surface.id === brittleSurface.id).brittle.phase === 'warning';
    const brittleWarningVisualStrengthened =
      brittleWarningTriggered === true &&
      warnedBrittleVisual?.fillColor !== brittleVisual?.fillColor &&
      warnedBrittleVisual?.accentAlpha > brittleVisual?.accentAlpha;
    brittleState.stageRuntime.terrainSurfaces.find((surface) => surface.id === brittleSurface.id).brittle.warningMs = 1;
    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.consumeFrame(16);
    bridge.setJumpHeld(false);
    brittleState = bridge.getSession().getState();
    surfaceScene.syncView();
    surfaceVisuals = surfaceScene.getDebugSnapshot().terrainSurfaceVisuals;
    const brokenBrittleVisual = surfaceVisuals.find((surface) => surface.id === brittleSurface.id);
    const brittleEscapeJumpWorked =
      brittleState.player.vy < 0 &&
      brittleState.stageRuntime.terrainSurfaces.find((surface) => surface.id === brittleSurface.id).brittle.phase === 'broken';
    const brittleBrokenVisualDistinct =
      brittleEscapeJumpWorked === true &&
      brokenBrittleVisual?.fillColor !== warnedBrittleVisual?.fillColor &&
      brokenBrittleVisual?.fillAlpha < warnedBrittleVisual?.fillAlpha &&
      brokenBrittleVisual?.detailHeights[1] < warnedBrittleVisual?.detailHeights[1];

    bridge.forceStartStage(2);
    resetToGameScene();
    surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    surfaceProbeState.stageRuntime.terrainSurfaces = surfaceProbeState.stageRuntime.terrainSurfaces.filter(
      (surface) => surface.id !== stickySurface.id,
    );
    const brittleFreshAttemptReset =
      surfaceProbeState.stageRuntime.terrainSurfaces.find((surface) => surface.id === brittleSurface.id).brittle.phase === 'intact';

    surfaceProbeState.player.x = normalSupportPlatform.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = normalSupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = normalSupportPlatform.id;
    bridge.setRight(true);
    for (let index = 0; index < 5; index += 1) {
      bridge.consumeFrame(16);
    }
    const normalGroundSpeed = bridge.getSession().getState().player.vx;

    bridge.forceStartStage(2);
    resetToGameScene();
    surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    surfaceProbeState.player.x = stickySurface.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = stickySupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = stickySupportPlatform.id;
    bridge.setRight(true);
    for (let index = 0; index < 5; index += 1) {
      bridge.consumeFrame(16);
    }
    const stickyGroundedSpeed = bridge.getSession().getState().player.vx;
    bridge.setRight(false);
    const stickyGroundedTraversalReduced = stickyGroundedSpeed < normalGroundSpeed;
    const stickyVisualBeforeMotion = game.scene.getScene('game').getDebugSnapshot().terrainSurfaceVisuals.find(
      (surface) => surface.id === stickySurface.id,
    );

    bridge.forceStartStage(2);
    resetToGameScene();
    surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    surfaceProbeState.player.x = stickySurface.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = stickySupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = stickySupportPlatform.id;
    for (let index = 0; index < 8; index += 1) {
      bridge.consumeFrame(16);
    }
    const stickyVisualAfterMotion = game.scene.getScene('game').getDebugSnapshot().terrainSurfaceVisuals.find(
      (surface) => surface.id === stickySurface.id,
    );
    const stickyLayeredCueVisible =
      stickyVisualBeforeMotion?.detailVisibleCount === 3 &&
      new Set(stickyVisualBeforeMotion?.detailWidths ?? []).size > 1 &&
      new Set((stickyVisualBeforeMotion?.detailOffsets ?? []).map((detail) => detail.y)).size > 1;
    const stickyMotionDriftVisible =
      stickyVisualBeforeMotion?.detailOffsets.some(
        (detail, index) =>
          detail.x !== stickyVisualAfterMotion?.detailOffsets[index]?.x ||
          detail.y !== stickyVisualAfterMotion?.detailOffsets[index]?.y ||
          stickyVisualBeforeMotion?.detailWidths[index] !== stickyVisualAfterMotion?.detailWidths[index],
      ) ?? false;
    const stickyMotionCueVisible = stickyLayeredCueVisible || stickyMotionDriftVisible;

    bridge.forceStartStage(2);
    resetToGameScene();
    surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    surfaceProbeState.stageRuntime.terrainSurfaces = surfaceProbeState.stageRuntime.terrainSurfaces.filter(
      (surface) => surface.id !== stickySurface.id,
    );
    surfaceProbeState.player.x = normalSupportPlatform.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = normalSupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = normalSupportPlatform.id;
    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.consumeFrame(16);
    bridge.setJumpHeld(false);
    const normalJumpVy = bridge.getSession().getState().player.vy;

    bridge.forceStartStage(2);
    resetToGameScene();
    surfaceProbeState = bridge.getSession().getState();
    surfaceProbeState.stageRuntime.enemies = [];
    surfaceProbeState.player.x = stickySurface.x + 28 - surfaceProbeState.player.width / 2;
    surfaceProbeState.player.y = stickySupportPlatform.y - surfaceProbeState.player.height;
    surfaceProbeState.player.vx = 0;
    surfaceProbeState.player.vy = 0;
    surfaceProbeState.player.onGround = true;
    surfaceProbeState.player.supportPlatformId = stickySupportPlatform.id;
    bridge.setJumpHeld(true);
    bridge.pressJump();
    bridge.consumeFrame(16);
    bridge.setJumpHeld(false);
    const stickyAntiGravJumpState = bridge.getSession().getState();
    const stickyAntiGravJumpSequenced =
      stickyAntiGravJumpState.player.gravityFieldKind === null &&
      stickyAntiGravJumpState.player.vy <= normalJumpVy + 1;

    results.push({
      stageName: 'Mechanic Checks',
        targetDurationMinutes: 0,
        stage: {
        world: { width: 0 },
        segments: [],
        platforms: [],
        enemies: [],
        hazards: [],
        collectibles: [],
        checkpoints: [],
        playerSpawn: { x: 0 },
      },
      checkpoint: {
        activatedId: 'mechanics',
        checkpointX: 0,
        respawnedX: 0,
        health: 3,
      },
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      mechanics: {
        dashUnlocked: dashState.progress.activePowers.dash,
        dashTriggered: dashCues.includes('dash') || dashState.player.x - dashStartX > 80,
        dashCooldownStarted,
        movingRideStable: rideStable,
        movingJumpStable:
          movingJumpState.player.vy < 0 && movingJumpState.player.supportPlatformId === null && !movingJumpState.player.onGround,
        collapseTriggered: collapseState.stageRuntime.platforms.some(
          (platform) => platform.kind === 'falling' && platform.fall?.triggered,
        ),
        collapseFell: collapseState.stageRuntime.platforms.some(
          (platform) => platform.kind === 'falling' && platform.y > platform.startY + 8,
        ),
        fallingJumpResponsive:
          fallingRidePlatform.fall?.falling === true &&
          fallingJumpState.player.vy < 0 &&
          fallingJumpState.player.supportPlatformId === null,
        springBoosted: springCues.includes('spring') || springMinVy < -700,
        bouncePodLaunchWorked,
        gasVentLaunchWorked,
        hopperHighJump: hopperImpulses.length > 0 && hopperImpulses.every((impulse) => impulse >= 820),
        chargerWindup: chargerSawWindup,
        chargerCharged: chargerSawCharge,
        flyerMoved:
          Math.abs(flyerAfter.x - flyerStart.x) > 8 || Math.abs(flyerAfter.y - flyerStart.y) > 4,
        gravityRoomRolloutComplete: (() => {
          const audit = [0, 1, 2].map((stageIndex) => {
            bridge.forceStartStage(stageIndex);
            resetToGameScene();
            const rolloutState = bridge.getSession().getState();
            const gravityCapsuleIds = new Set(rolloutState.stageRuntime.gravityCapsules.map((capsule) => capsule.id));
            return (
              rolloutState.stageRuntime.gravityFields.length > 0 &&
              rolloutState.stageRuntime.gravityCapsules.length === rolloutState.stageRuntime.gravityFields.length &&
              rolloutState.stageRuntime.gravityFields.every(
                (field) => field.gravityCapsuleId && gravityCapsuleIds.has(field.gravityCapsuleId),
              )
            );
          });
          return audit.every(Boolean);
        })(),
        gravityRoomButtonsReachable: (() => {
          const audit = [0, 1, 2].map((stageIndex) => {
            bridge.forceStartStage(stageIndex);
            resetToGameScene();
            const rolloutState = bridge.getSession().getState();
            return rolloutState.stageRuntime.gravityCapsules.every((capsule) =>
              rolloutState.stageRuntime.platforms.some((platform) => {
                const overlap = Math.max(
                  0,
                  Math.min(capsule.button.x + capsule.button.width, platform.x + platform.width) -
                    Math.max(capsule.button.x, platform.x),
                );
                return (
                  overlap >= Math.min(capsule.button.width * 0.55, platform.width) &&
                  Math.abs(capsule.button.y + capsule.button.height - platform.y) <= 24
                );
              }),
            );
          });
          return audit.every(Boolean);
        })(),
        gravityRoomWallsBlockOutsideDoors: gravityRoomWallContainmentAcrossStages,
        gravityCapsuleDormantVisible,
        gravityCapsuleRouteContained,
        gravityCapsuleActivationTriggered,
        gravityFieldRouteReadable,
        antiGravStreamApplied,
        gravityInversionApplied,
        gravityFieldDashSuppressed,
        gravityFieldExitRestored,
        gravityFieldResetConsistent,
        gravityCapsuleResetConsistent,
        gravityFieldCheckpointSafe,
        magneticDormantVisible,
        magneticNodeTriggered,
        magneticPoweredSupport,
        magneticVisualDistinct,
        magneticRespawnReset,
        magneticFreshAttemptReset,
        magneticRetrySafeFallback,
        revealRouteUnlocked,
        timedRevealActivationGuard,
        timedRevealDiscovered,
        timedRevealActivated,
        scannerBridgeActivated,
        scannerBridgeNoStayRefresh,
        scannerBridgeReentryRefresh,
        scannerBridgeOccupiedExpiry,
        timedRevealSkipFallback,
        timedRevealReconnectionReady,
        terrainSurfaceExtentsRendered,
        terrainSurfaceCueShapesVisible,
        brittleWarningTriggered,
        brittleWarningVisualStrengthened,
        brittleEscapeJumpWorked,
        brittleBrokenVisualDistinct,
        brittleFreshAttemptReset,
        stickyGroundedTraversalReduced,
        stickyMotionCueVisible,
        stickyAntiGravJumpSequenced,
        powerVariantDistinct,
        backdropRouteSeparationReadable,
        authoredBackdropResponsive,
        routingInteractablesReadable,
        hazardContrastReadable,
        turretTelegraphReadable,
        turretVisibilityGated,
      },
    });

    bridge.forceStartStage(1);
    resetToGameScene();
    let secretRouteState = bridge.getSession().getState();
    const secretRoute = secretRouteState.stage.secretRoutes?.[0] ?? null;
    if (secretRoute) {
      const intersectsRect = (a, b) =>
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
      const rectContainsPoint = (rect, point) =>
        point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
      const enemyRect = (enemy) => ({
        x: enemy.position.x,
        y: enemy.position.y,
        width: enemy.kind === 'turret' ? 28 : 34,
        height: enemy.kind === 'turret' ? 38 : enemy.kind === 'flyer' ? 24 : 30,
      });
      const findSupport = (rect) => {
        const centerX = rect.x + rect.width / 2;
        const bottom = rect.y + rect.height;
        return (
          secretRouteState.stageRuntime.platforms
            .filter((platform) => centerX >= platform.x && centerX <= platform.x + platform.width && platform.y >= bottom)
            .sort((left, right) => left.y - right.y)[0] ?? null
        );
      };

      const cueSupport = findSupport(secretRoute.cue.rect);
      secretRouteState.player.x = secretRoute.cue.rect.x + 24;
      secretRouteState.player.y = (cueSupport?.y ?? secretRoute.cue.rect.y + secretRoute.cue.rect.height) - secretRouteState.player.height;
      secretRouteState.player.vx = 0;
      secretRouteState.player.vy = 0;
      secretRouteState.player.onGround = true;
      secretRouteState.player.supportPlatformId = cueSupport?.id ?? null;
      bridge.consumeFrame(16);

      let revealTriggered = true;
      if (secretRoute.cue.revealVolumeIds?.length) {
        const trigger = secretRouteState.stageRuntime.revealVolumes.find(
          (volume) => volume.id === secretRoute.cue.revealVolumeIds[0],
        );
        secretRouteState.player.x = trigger.x + 16;
        secretRouteState.player.y = trigger.y + 16;
        secretRouteState.player.vx = 0;
        secretRouteState.player.vy = 0;
        secretRouteState.player.onGround = false;
        secretRouteState.player.supportPlatformId = null;
        bridge.consumeFrame(16);
        const revealState = bridge.getSession().getState();
        revealTriggered = secretRoute.cue.revealPlatformIds.every((platformId) =>
          revealState.stageRuntime.revealedPlatformIds.includes(platformId),
        );
      }

      bridge.forceStartStage(1);
      resetToGameScene();
      secretRouteState = bridge.getSession().getState();
      const rewardCollectibleIds = [];
      for (const collectibleId of secretRoute.reward.collectibleIds) {
        const collectible = secretRouteState.stageRuntime.collectibles.find((entry) => entry.id === collectibleId);
        if (!collectible) {
          continue;
        }

        secretRouteState.player.x = collectible.position.x - secretRouteState.player.width / 2;
        secretRouteState.player.y = collectible.position.y - secretRouteState.player.height / 2;
        secretRouteState.player.vx = 0;
        secretRouteState.player.vy = 0;
        secretRouteState.player.onGround = false;
        secretRouteState.player.supportPlatformId = null;
        bridge.consumeFrame(16);
        if (bridge.getSession().getState().stageRuntime.collectibles.find((entry) => entry.id === collectibleId)?.collected) {
          rewardCollectibleIds.push(collectibleId);
        }
      }

      bridge.forceStartStage(1);
      resetToGameScene();
      secretRouteState = bridge.getSession().getState();
      const reconnectSupport = findSupport(secretRoute.reconnect);
      secretRouteState.player.x = secretRoute.reconnect.x + 12;
      secretRouteState.player.y = (reconnectSupport?.y ?? secretRoute.reconnect.y + secretRoute.reconnect.height) - secretRouteState.player.height;
      secretRouteState.player.vx = 0;
      secretRouteState.player.vy = 0;
      secretRouteState.player.onGround = true;
      secretRouteState.player.supportPlatformId = reconnectSupport?.id ?? null;
      bridge.setRight(true);
      for (let index = 0; index < 10; index += 1) {
        bridge.consumeFrame(16);
      }
      const reconnectState = bridge.getSession().getState();
      bridge.setRight(false);
      const reconnectProgressed = !reconnectState.player.dead && reconnectState.player.x > secretRoute.reconnect.x + 18;

      bridge.forceStartStage(1);
      resetToGameScene();
      secretRouteState = bridge.getSession().getState();
      const mainPathSupport = findSupport(secretRoute.mainPath);
      secretRouteState.player.x = secretRoute.mainPath.x + 12;
      secretRouteState.player.y = (mainPathSupport?.y ?? secretRoute.mainPath.y + secretRoute.mainPath.height) - secretRouteState.player.height;
      secretRouteState.player.vx = 0;
      secretRouteState.player.vy = 0;
      secretRouteState.player.onGround = true;
      secretRouteState.player.supportPlatformId = mainPathSupport?.id ?? null;
      bridge.setRight(true);
      for (let index = 0; index < 10; index += 1) {
        bridge.consumeFrame(16);
      }
      const skipState = bridge.getSession().getState();
      bridge.setRight(false);
      const skipMainRouteWorked = !skipState.player.dead && skipState.player.x > secretRoute.mainPath.x + 18;
      const rewardCollectibles = skipState.stage.collectibles.filter((collectible) =>
        secretRoute.reward.collectibleIds.includes(collectible.id),
      );
      const rewardBlocks = skipState.stage.rewardBlocks.filter((rewardBlock) =>
        secretRoute.reward.rewardBlockIds.includes(rewardBlock.id),
      );
      const rewardScore =
        rewardCollectibles.length +
        rewardBlocks.reduce(
          (total, rewardBlock) => total + (rewardBlock.reward.kind === 'coins' ? rewardBlock.reward.amount : 3),
          0,
        );
      const cueReadable = Boolean(cueSupport);
      const rewardInsidePocket =
        rewardCollectibles.every((collectible) => rectContainsPoint(secretRoute.interior, collectible.position)) &&
        rewardBlocks.every((rewardBlock) => intersectsRect(secretRoute.interior, rewardBlock));
      const reconnectSupported = Boolean(reconnectSupport);
      const mainPathSupported = Boolean(mainPathSupport);
      const reconnectSafe =
        !skipState.stage.hazards.some((hazard) => intersectsRect(expandRect(secretRoute.reconnect, 32), hazard.rect)) &&
        !skipState.stage.enemies.some((enemy) => intersectsRect(expandRect(secretRoute.reconnect, 44), enemyRect(enemy)));
      const primaryRouteReport = {
        id: secretRoute.id,
        title: secretRoute.title,
        cueReadable,
        rewardScore,
        rewardInsidePocket,
        reconnectSupported,
        mainPathSupported,
        reconnectSafe,
        downstreamReconnect: secretRoute.reconnect.x > secretRoute.entry.x + 120,
      };
      primaryRouteReport.passed =
        primaryRouteReport.cueReadable &&
        primaryRouteReport.rewardScore >= 3 &&
        primaryRouteReport.rewardInsidePocket &&
        primaryRouteReport.reconnectSupported &&
        primaryRouteReport.mainPathSupported &&
        primaryRouteReport.reconnectSafe &&
        primaryRouteReport.downstreamReconnect;
      const secretRouteSummary = {
        routeCount: 1,
        routeReports: [primaryRouteReport],
        passed: primaryRouteReport.passed,
      };

      results.push({
        stageName: 'Secret Route Checks',
        targetDurationMinutes: 0,
        stage: JSON.parse(JSON.stringify(skipState.stage)),
        checkpoint: {
          activatedId: 'secret-route',
          checkpointX: 0,
          respawnedX: 0,
          health: skipState.player.health,
        },
        readability: {
          segmentCount: 0,
          collectibleZones: [],
          maxCheckpointGap: 0,
          elevatedRoutePlatforms: 0,
          elevatedRouteRewards: 0,
          maxMainRouteThreatWindow: 0,
          optionalThreatCount: 0,
          segmentPass: true,
          collectiblePass: true,
          checkpointPass: true,
          routePass: true,
          encounterPass: true,
        },
        mechanics: { passed: true },
        secretRoutes: {
          ...secretRouteSummary,
          revealTriggered,
          rewardCollectibleIds,
          reconnectProgressed,
          skipMainRouteWorked,
          passed:
            secretRouteSummary.passed &&
            revealTriggered &&
            rewardCollectibleIds.length >= 2 &&
            reconnectProgressed &&
            skipMainRouteWorked,
        },
      });
    }

    bridge.forceStartStage(0);
    resetToGameScene();
    let blockState = bridge.getSession().getState();
    const coinStartTotal = blockState.progress.totalCoins;
    const coinBlock = blockState.stageRuntime.rewardBlocks.find(
      (rewardBlock) => rewardBlock.reward.kind === 'coins' && rewardBlock.reward.amount > 1,
    );

    const punchBlock = (blockId) => {
      const activeState = bridge.getSession().getState();
      const activeBlock = activeState.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === blockId);
      activeState.player.x = activeBlock.x + activeBlock.width / 2 - activeState.player.width / 2;
      activeState.player.y = activeBlock.y + activeBlock.height + 2;
      activeState.player.vx = 0;
      activeState.player.vy = -720;
      activeState.player.onGround = false;
      activeState.player.supportPlatformId = null;
      bridge.consumeFrame(16);
      return bridge.getSession().getState();
    };

    const firstCoinPunch = punchBlock(coinBlock.id);
    const firstCoinState = firstCoinPunch.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === coinBlock.id);
    const firstCoinSnapshot = {
      remainingHits: firstCoinState.remainingHits,
      coinsGained: firstCoinPunch.progress.totalCoins - coinStartTotal,
      used: firstCoinState.used,
    };
    const coinRevealVisible = firstCoinPunch.stageRuntime.rewardReveals.length > 0;
    for (let i = 0; i < 70; i += 1) {
      bridge.consumeFrame(16);
    }
    const coinRevealExpired = bridge.getSession().getState().stageRuntime.rewardReveals.length === 0;

    const secondCoinPunch = punchBlock(coinBlock.id);
    const secondCoinState = secondCoinPunch.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === coinBlock.id);
    const secondCoinSnapshot = {
      remainingHits: secondCoinState.remainingHits,
      coinsGained: secondCoinPunch.progress.totalCoins - coinStartTotal,
      used: secondCoinState.used,
    };

    bridge.forceStartStage(1);
    resetToGameScene();
    blockState = bridge.getSession().getState();
    const powerBlock = blockState.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.reward.kind === 'power');
    const firstPowerPunch = punchBlock(powerBlock.id);
    const firstPowerState = firstPowerPunch.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === powerBlock.id);
    const firstPowerSnapshot = {
      remainingHits: firstPowerState.remainingHits,
      used: firstPowerState.used,
    };
    const powerRevealVisible = firstPowerPunch.stageRuntime.rewardReveals.length > 0;
    for (let i = 0; i < 70; i += 1) {
      bridge.consumeFrame(16);
    }
    const powerRevealExpired = bridge.getSession().getState().stageRuntime.rewardReveals.length === 0;
    const secondPowerPunch = punchBlock(powerBlock.id);
    const secondPowerState = secondPowerPunch.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === powerBlock.id);
    const secondPowerSnapshot = {
      remainingHits: secondPowerState.remainingHits,
      used: secondPowerState.used,
    };
    const rewardLockCoverage = (() => {
      const findFixtureSupport = (fixture, rect) => {
        const centerX = rect.x + rect.width / 2;
        const bottom = rect.y + rect.height;
        return (
          fixture.platforms
            .filter(
              (platform) =>
                centerX >= platform.x &&
                centerX <= platform.x + platform.width &&
                platform.y >= bottom,
            )
            .sort((left, right) => left.y - right.y)[0] ?? null
        );
      };
      const analyzeFixtureLocks = (fixture) => {
        const invalidBlocks = [];
        const isImmediateContinuationSupport = (blockSupport, candidateSupport) => {
          if (blockSupport.id === candidateSupport.id) {
            return true;
          }
          const horizontalSupportGap =
            candidateSupport.x > blockSupport.x + blockSupport.width
              ? candidateSupport.x - (blockSupport.x + blockSupport.width)
              : blockSupport.x > candidateSupport.x + candidateSupport.width
                ? blockSupport.x - (candidateSupport.x + candidateSupport.width)
                : 0;
          return horizontalSupportGap <= 56 && Math.abs(candidateSupport.y - blockSupport.y) <= 96;
        };
        const isBlockingRectAheadOfRewardBlock = (block, rect) => {
          const forwardGap = rect.x - (block.x + block.width);
          return rect.x >= block.x - 16 && forwardGap <= 150 && rect.x + rect.width > block.x;
        };
        for (const block of fixture.rewardBlocks) {
          const blockSupport = findFixtureSupport(fixture, block);
          if (!blockSupport) {
            invalidBlocks.push(block.id);
            continue;
          }
          for (const enemy of fixture.enemies) {
            const enemyBounds = {
              x: enemy.position.x,
              y: enemy.position.y,
              width: enemy.kind === 'turret' ? 28 : 34,
              height: enemy.kind === 'turret' ? 38 : enemy.kind === 'flyer' ? 24 : 30,
            };
            const enemySupport = findFixtureSupport(fixture, enemyBounds);
            if (['walker', 'hopper', 'charger'].includes(enemy.kind) && enemySupport?.id === blockSupport.id) {
              const horizontalOverlap = Math.max(
                0,
                Math.min(block.x + block.width, enemyBounds.x + enemyBounds.width) - Math.max(block.x, enemyBounds.x),
              );
              const verticalGap = Math.abs(block.y + block.height - enemyBounds.y);
              if (horizontalOverlap > 0 && verticalGap <= 96) {
                invalidBlocks.push(block.id);
                break;
              }
            }

            if (!isBlockingRectAheadOfRewardBlock(block, enemyBounds)) {
              continue;
            }

            if (enemySupport && isImmediateContinuationSupport(blockSupport, enemySupport)) {
              invalidBlocks.push(block.id);
              break;
            }
          }

          if (invalidBlocks.includes(block.id)) {
            continue;
          }

          for (const hazard of fixture.hazards ?? []) {
            const hazardSupport = findFixtureSupport(fixture, hazard.rect);
            if (!hazardSupport || !isImmediateContinuationSupport(blockSupport, hazardSupport)) {
              continue;
            }
            if (isBlockingRectAheadOfRewardBlock(block, hazard.rect)) {
              invalidBlocks.push(block.id);
              break;
            }
          }
        }
        return {
          passed: invalidBlocks.length === 0,
        };
      };
      const blockedFixture = {
        platforms: [{ id: 'floor', kind: 'static', x: 0, y: 120, width: 240, height: 24 }],
        rewardBlocks: [{ id: 'blocked', x: 84, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 1 } }],
        enemies: [{ id: 'enemy', kind: 'walker', position: { x: 92, y: 76 } }],
      };
      const forcedHitFixture = {
        platforms: [{ id: 'floor', kind: 'static', x: 0, y: 120, width: 240, height: 24 }],
        rewardBlocks: [{ id: 'forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
        enemies: [{ id: 'enemy', kind: 'walker', position: { x: 136, y: 90 } }],
      };
      const safeFixture = {
        platforms: [
          { id: 'pickup-floor', kind: 'static', x: 0, y: 120, width: 140, height: 24 },
          { id: 'next-floor', kind: 'static', x: 196, y: 120, width: 180, height: 24 },
        ],
        rewardBlocks: [{ id: 'safe', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
        enemies: [{ id: 'enemy', kind: 'walker', position: { x: 292, y: 90 } }],
        hazards: [],
      };
      const hazardForcedHitFixture = {
        platforms: [{ id: 'floor', kind: 'static', x: 0, y: 120, width: 240, height: 24 }],
        rewardBlocks: [{ id: 'hazard-forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
        enemies: [],
        hazards: [{ id: 'spikes', kind: 'spikes', rect: { x: 128, y: 104, width: 56, height: 16 } }],
      };
      const hazardSafeFixture = {
        platforms: [
          { id: 'pickup-floor', kind: 'static', x: 0, y: 120, width: 180, height: 24 },
          { id: 'next-floor', kind: 'static', x: 240, y: 120, width: 180, height: 24 },
        ],
        rewardBlocks: [{ id: 'hazard-safe', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'power', power: 'shooter' } }],
        enemies: [],
        hazards: [{ id: 'spikes', kind: 'spikes', rect: { x: 260, y: 104, width: 56, height: 16 } }],
      };
      return {
        blockedRejected: !analyzeFixtureLocks(blockedFixture).passed,
        forcedHitRejected: !analyzeFixtureLocks(forcedHitFixture).passed,
        safeAllowed: analyzeFixtureLocks(safeFixture).passed,
        hazardForcedHitRejected: !analyzeFixtureLocks(hazardForcedHitFixture).passed,
        hazardSafeAllowed: analyzeFixtureLocks(hazardSafeFixture).passed,
        coinForcedHitRejected: !analyzeFixtureLocks({
          platforms: forcedHitFixture.platforms,
          rewardBlocks: [{ id: 'coin-forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 2 } }],
          enemies: forcedHitFixture.enemies,
          hazards: [],
        }).passed,
        coinHazardForcedHitRejected: !analyzeFixtureLocks({
          platforms: hazardForcedHitFixture.platforms,
          rewardBlocks: [{ id: 'coin-hazard-forced-hit', x: 72, y: 36, width: 40, height: 40, reward: { kind: 'coins', amount: 2 } }],
          enemies: [],
          hazards: hazardForcedHitFixture.hazards,
        }).passed,
      };
    })();

    bridge.forceStartStage(1);
    resetToGameScene();
    const runtimeRouteState = bridge.getSession().getState();
    const runtimeRouteBlock = runtimeRouteState.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === 'amber-dash');
    const runtimePowerKind = runtimeRouteBlock.reward.kind === 'power' ? runtimeRouteBlock.reward.power : null;
    const pickupState = punchBlock(runtimeRouteBlock.id);
    const routeStartHealth = pickupState.player.health;
    const routeTargetX = runtimeRouteBlock.x + runtimeRouteBlock.width + 32;
    let runtimeAfterRoute = pickupState;
    bridge.setRight(true);
    for (let i = 0; i < 75; i += 1) {
      bridge.consumeFrame(16);
      runtimeAfterRoute = bridge.getSession().getState();
      if (
        runtimeAfterRoute.player.x >= routeTargetX ||
        runtimeAfterRoute.player.health !== routeStartHealth ||
        runtimeAfterRoute.player.dead
      ) {
        break;
      }
    }
    bridge.setRight(false);
    const runtimeSafeContinuation =
      runtimeAfterRoute.player.health === routeStartHealth &&
      !runtimeAfterRoute.player.dead &&
      runtimeAfterRoute.player.x >= routeTargetX &&
      runtimePowerKind !== null &&
      runtimeAfterRoute.progress.activePowers[runtimePowerKind];

    bridge.forceStartStage(1);
    resetToGameScene();
    const runtimeHazardState = bridge.getSession().getState();
    const runtimeHazardBlock = runtimeHazardState.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === 'amber-shooter');
    const runtimeHazardPowerKind = runtimeHazardBlock.reward.kind === 'power' ? runtimeHazardBlock.reward.power : null;
    const hazardPickupState = punchBlock(runtimeHazardBlock.id);
    const hazardRouteStartHealth = hazardPickupState.player.health;
    const hazardRouteTargetX = runtimeHazardBlock.x + runtimeHazardBlock.width + 52;
    let runtimeAfterHazardRoute = hazardPickupState;
    bridge.setRight(true);
    for (let i = 0; i < 75; i += 1) {
      bridge.consumeFrame(16);
      runtimeAfterHazardRoute = bridge.getSession().getState();
      if (
        runtimeAfterHazardRoute.player.x >= hazardRouteTargetX ||
        runtimeAfterHazardRoute.player.health !== hazardRouteStartHealth ||
        runtimeAfterHazardRoute.player.dead
      ) {
        break;
      }
    }
    bridge.setRight(false);
    const runtimeHazardSafeContinuation =
      runtimeAfterHazardRoute.player.health === hazardRouteStartHealth &&
      !runtimeAfterHazardRoute.player.dead &&
      runtimeAfterHazardRoute.player.x >= hazardRouteTargetX &&
      runtimeHazardPowerKind !== null &&
      runtimeAfterHazardRoute.progress.activePowers[runtimeHazardPowerKind];

    bridge.forceStartStage(0);
    resetToGameScene();
    const runtimeCoinState = bridge.getSession().getState();
    const runtimeCoinBlock = runtimeCoinState.stageRuntime.rewardBlocks.find((rewardBlock) => rewardBlock.id === 'forest-coin-1');
    const coinPickupStartTotal = runtimeCoinState.progress.totalCoins;
    const coinPickupState = punchBlock(runtimeCoinBlock.id);
    const coinRouteStartHealth = coinPickupState.player.health;
    const coinRouteTargetX = runtimeCoinBlock.x + runtimeCoinBlock.width + 36;
    let runtimeAfterCoinRoute = coinPickupState;
    bridge.setRight(true);
    for (let i = 0; i < 60; i += 1) {
      bridge.consumeFrame(16);
      runtimeAfterCoinRoute = bridge.getSession().getState();
      if (
        runtimeAfterCoinRoute.player.x >= coinRouteTargetX ||
        runtimeAfterCoinRoute.player.health !== coinRouteStartHealth ||
        runtimeAfterCoinRoute.player.dead
      ) {
        break;
      }
    }
    bridge.setRight(false);
    const runtimeCoinSafeContinuation =
      runtimeAfterCoinRoute.player.health === coinRouteStartHealth &&
      !runtimeAfterCoinRoute.player.dead &&
      runtimeAfterCoinRoute.player.x >= coinRouteTargetX &&
      runtimeAfterCoinRoute.progress.totalCoins > coinPickupStartTotal;

    results.push({
      stageName: 'Block Checks',
      targetDurationMinutes: 0,
      stage: {
        world: { width: 0 },
        segments: [],
        platforms: [],
        enemies: [],
        hazards: [],
        collectibles: [],
        checkpoints: [],
        rewardBlocks: [],
      },
      checkpoint: {
        activatedId: 'blocks',
        checkpointX: 0,
        respawnedX: 0,
        health: 3,
      },
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      blocks: {
        coinHitStates: [
          firstCoinSnapshot,
          secondCoinSnapshot,
        ],
        coinRevealVisible,
        coinRevealExpired,
        powerRevealVisible,
        powerRevealExpired,
        powerSingleUse:
          firstPowerSnapshot.used === true &&
          firstPowerSnapshot.remainingHits === 0 &&
          secondPowerSnapshot.remainingHits === 0 &&
          secondPowerSnapshot.used === true &&
          secondPowerPunch.stageRuntime.rewardReveals.length === 0,
        blockedPlacementRejected: rewardLockCoverage.blockedRejected,
        forcedHitRejected: rewardLockCoverage.forcedHitRejected,
        safePlacementAllowed: rewardLockCoverage.safeAllowed,
        hazardForcedHitRejected: rewardLockCoverage.hazardForcedHitRejected,
        hazardSafePlacementAllowed: rewardLockCoverage.hazardSafeAllowed,
        coinForcedHitRejected: rewardLockCoverage.coinForcedHitRejected,
        coinHazardForcedHitRejected: rewardLockCoverage.coinHazardForcedHitRejected,
        runtimeSafeContinuation,
        runtimeHazardSafeContinuation,
        runtimeCoinSafeContinuation,
        spacingPassed: [0, 1, 2].every((stageIndex) => {
          bridge.forceStartStage(stageIndex);
          resetToGameScene();
          const spacingState = bridge.getSession().getState();
          return spacingState.stage.rewardBlocks.every((rewardBlock) => {
            const support = spacingState.stage.platforms
              .filter(
                (platform) =>
                  rewardBlock.x + rewardBlock.width / 2 >= platform.x &&
                  rewardBlock.x + rewardBlock.width / 2 <= platform.x + platform.width &&
                  platform.y >= rewardBlock.y + rewardBlock.height,
              )
              .sort((left, right) => left.y - right.y)[0];
            if (!support) {
              return false;
            }
            const clearance = support.y - (rewardBlock.y + rewardBlock.height);
            return clearance >= 56;
          });
        }),
      },
    });

    return results;
  });
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });

  const preview = spawn('cmd.exe', ['/c', 'npm.cmd', 'run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: ROOT,
    stdio: 'ignore',
  });

  try {
    await waitForServer(`http://127.0.0.1:${PORT}`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: PLAYTEST_VIEWPORT });
    const page = await openPlaytestPage(context);

    const flowChecks = await collectFlowResults(page);
    const audioAssetChecks = flowChecks.audioAssetChecks;
    const objectiveChecks = await collectObjectiveResults(page);
    const rawResults = await collectStageResults(page);
    const turretVariantChecks = buildTurretVariantCheck(rawResults);
    await context.close();
    await browser.close();

    const results = rawResults.map((result) => {
      if (result.stageName === 'Mechanic Checks') {
        const mechanics = mechanicReport(result.mechanics);
        const notes = [];
        notes.push(mechanics.dashTriggered ? 'dash activation passed' : 'dash activation failed');
        notes.push(mechanics.movingRideStable ? 'moving platform ride passed' : 'moving platform ride failed');
        notes.push(
          mechanics.movingJumpStable ? 'moving platform jump passed' : 'moving platform jump probe unstable (non-blocking)',
        );
        notes.push(mechanics.collapseFell ? 'falling platform timing passed' : 'falling platform timing failed');
        notes.push(mechanics.fallingJumpResponsive ? 'falling platform jump passed' : 'falling platform jump failed');
        notes.push(mechanics.springBoosted ? 'spring launch passed' : 'spring launch failed');
        notes.push(mechanics.bouncePodLaunchWorked ? 'bounce pod route passed' : 'bounce pod route failed');
        notes.push(mechanics.gasVentLaunchWorked ? 'gas vent route passed' : 'gas vent route failed');
        notes.push(mechanics.hopperHighJump ? 'hopper jump height passed' : 'hopper jump height failed');
        notes.push(mechanics.chargerCharged ? 'charger state transition passed' : 'charger state transition failed');
        notes.push(mechanics.flyerMoved ? 'flyer patrol passed' : 'flyer patrol failed');
        notes.push(
          mechanics.gravityRoomRolloutComplete
            ? 'all current playable gravity fields load inside linked gravity rooms'
            : 'one or more current playable gravity fields still load as open sections',
        );
        notes.push(
          mechanics.gravityRoomButtonsReachable
            ? 'all current playable gravity room buttons keep supported interior footing'
            : 'a current playable gravity room button lost supported interior footing',
        );
        notes.push(
          mechanics.gravityCapsuleDormantVisible
            ? 'gravity room shell, side-wall doors, and disable button stay readable while the field is active'
            : 'gravity room active presentation is missing before disable contact',
        );
        notes.push(
          mechanics.gravityCapsuleRouteContained
            ? 'gravity room keeps supported entry, button, and exit routing inside the authored shell'
            : 'gravity room routing or contained support geometry escapes the authored shell',
        );
        notes.push(
          mechanics.gravityCapsuleActivationTriggered
            ? 'gravity room button contact disables the linked field on the same update'
            : 'gravity room button contact did not disable the linked field on the same update',
        );
        notes.push(
          mechanics.gravityFieldRouteReadable
            ? 'Halo Spire gravity field route reads clearly in the live scene'
            : 'Halo Spire gravity field route readability failed in the live scene',
        );
        notes.push(
          mechanics.antiGravStreamApplied ? 'anti-grav stream acceleration passed' : 'anti-grav stream acceleration failed',
        );
        notes.push(
          mechanics.gravityInversionApplied
            ? 'gravity inversion column acceleration passed'
            : 'gravity inversion column acceleration failed',
        );
        notes.push(
          mechanics.gravityFieldDashSuppressed
            ? 'dash suppression over gravity fields passed'
            : 'dash suppression over gravity fields failed',
        );
        notes.push(
          mechanics.gravityFieldExitRestored
            ? 'gravity field exit restore passed'
            : 'gravity field exit restore failed',
        );
        notes.push(
          mechanics.gravityFieldResetConsistent
            ? 'gravity field reset consistency passed'
            : 'gravity field reset consistency failed',
        );
        notes.push(
          mechanics.gravityCapsuleResetConsistent
            ? 'gravity room reset consistency passed'
            : 'gravity room reset consistency failed',
        );
        notes.push(
          mechanics.gravityFieldCheckpointSafe
            ? 'gravity field checkpoint placement passed'
            : 'gravity field checkpoint placement failed',
        );
        notes.push(
          mechanics.magneticDormantVisible
            ? 'magnetic platform dormant presentation stayed visible in the live scene'
            : 'magnetic platform dormant presentation was not visible in the live scene',
        );
        notes.push(
          mechanics.magneticNodeTriggered
            ? 'activation node powered its linked magnetic platform'
            : 'activation node did not power its linked magnetic platform',
        );
        notes.push(
          mechanics.magneticPoweredSupport
            ? 'powered magnetic platform supported the player from above'
            : 'powered magnetic platform did not support the player from above',
        );
        notes.push(
          mechanics.magneticVisualDistinct
            ? 'magnetic dormant and powered visuals stayed distinct'
            : 'magnetic dormant and powered visuals were not distinct',
        );
        notes.push(
          mechanics.magneticRespawnReset
            ? 'magnetic power reset on checkpoint respawn'
            : 'magnetic power did not reset on checkpoint respawn',
        );
        notes.push(
          mechanics.magneticFreshAttemptReset
            ? 'magnetic power reset on fresh attempt restart'
            : 'magnetic power did not reset on fresh attempt restart',
        );
        notes.push(
          mechanics.magneticRetrySafeFallback
            ? 'magnetic route kept a retry-safe fallback surface after reset'
            : 'magnetic route lost its retry-safe fallback surface after reset',
        );
        notes.push(mechanics.revealRouteUnlocked ? 'reveal platform route passed' : 'reveal platform route failed');
        notes.push(
          mechanics.timedRevealActivationGuard
            ? 'timed-reveal scanner guard passed before discovery'
            : 'timed-reveal scanner guard failed before discovery',
        );
        notes.push(
          mechanics.timedRevealDiscovered ? 'timed-reveal discovery cue passed' : 'timed-reveal discovery cue failed',
        );
        notes.push(
          mechanics.timedRevealActivated ? 'timed-reveal activation ordering passed' : 'timed-reveal activation ordering failed',
        );
        notes.push(mechanics.scannerBridgeActivated ? 'scanner bridge activation passed' : 'scanner bridge activation failed');
        notes.push(mechanics.scannerBridgeNoStayRefresh ? 'scanner bridge stay-inside refresh guard passed' : 'scanner bridge stay-inside refresh guard failed');
        notes.push(mechanics.scannerBridgeReentryRefresh ? 'scanner bridge re-entry refresh passed' : 'scanner bridge re-entry refresh failed');
        notes.push(mechanics.scannerBridgeOccupiedExpiry ? 'scanner bridge occupied expiry passed' : 'scanner bridge occupied expiry failed');
        notes.push(
          mechanics.timedRevealSkipFallback
            ? 'timed-reveal skip fallback passed'
            : 'timed-reveal skip fallback failed',
        );
        notes.push(
          mechanics.timedRevealReconnectionReady
            ? 'timed-reveal reconnection remained safe'
            : 'timed-reveal reconnection was not ready',
        );
        notes.push(mechanics.terrainSurfaceExtentsRendered ? 'terrain variant extents render in the live scene' : 'terrain variant extents drift from the live scene');
        notes.push(
          mechanics.terrainSurfaceCueShapesVisible
            ? 'terrain variants keep distinct full-platform cue shapes in the live scene'
            : 'terrain variants lose their distinct full-platform cue shapes in the live scene',
        );
        notes.push(mechanics.brittleWarningTriggered ? 'brittle floor warning passed' : 'brittle floor warning failed');
        notes.push(
          mechanics.brittleWarningVisualStrengthened
            ? 'brittle warning visuals strengthen before the floor breaks'
            : 'brittle warning visuals do not strengthen before the floor breaks',
        );
        notes.push(mechanics.brittleEscapeJumpWorked ? 'brittle escape jump passed' : 'brittle escape jump failed');
        notes.push(
          mechanics.brittleBrokenVisualDistinct
            ? 'brittle broken visuals stay distinct after collapse'
            : 'brittle broken visuals do not stay distinct after collapse',
        );
        notes.push(mechanics.brittleFreshAttemptReset ? 'brittle fresh-attempt reset passed' : 'brittle fresh-attempt reset failed');
        notes.push(mechanics.stickyGroundedTraversalReduced ? 'sticky grounded traversal penalty passed' : 'sticky grounded traversal penalty failed');
        notes.push(
          mechanics.stickyMotionCueVisible
            ? 'sticky sludge layered or motion cues remain visible during traversal'
            : 'sticky sludge layered or motion cues are not visible during traversal',
        );
        notes.push(
          mechanics.stickyAntiGravJumpSequenced
            ? 'sticky anti-grav jump sequencing keeps full jump strength'
            : 'sticky anti-grav jump sequencing lost full jump strength',
        );
        notes.push(
          mechanics.powerVariantDistinct ? 'power variants are visually distinct' : 'power variants are not visually distinct',
        );
        notes.push(
          mechanics.backdropRouteSeparationReadable
            ? 'backdrop bands and structures stay in a separate color lane from the playable route'
            : 'backdrop bands or structures blend into route-critical gameplay colors',
        );
        notes.push(
          mechanics.authoredBackdropResponsive
            ? 'authored sky and ground palettes produce distinct backdrop treatments across stages'
            : 'stage-authored sky and ground palettes do not materially change the backdrop treatment',
        );
        notes.push(
          mechanics.routingInteractablesReadable
            ? 'routing-critical interactables stay visually distinct against the flatter stage palette'
            : 'routing-critical interactables blend into the flatter stage palette',
        );
        notes.push(
          mechanics.hazardContrastReadable
            ? 'hazards keep reserved contrast against gameplay surfaces'
            : 'hazards lose contrast against gameplay surfaces',
        );
        notes.push(
          mechanics.turretTelegraphReadable
            ? 'turret telegraphs remain visually distinct before firing'
            : 'turret telegraphs are not visually distinct before firing',
        );
        notes.push(mechanics.turretVisibilityGated ? 'turret lead-margin gate passed' : 'turret lead-margin gate failed');

        return {
          stageName: result.stageName,
          targetDurationMinutes: 0,
          estimatedMinutes: 0,
          readability: {
            segmentCount: 0,
            collectibleZones: [],
            maxCheckpointGap: 0,
            elevatedRoutePlatforms: 0,
            elevatedRouteRewards: 0,
            maxMainRouteThreatWindow: 0,
            optionalThreatCount: 0,
            segmentPass: true,
            collectiblePass: true,
            checkpointPass: true,
            routePass: true,
            encounterPass: true,
          },
          checkpoint: { passed: true },
          safety: { passed: true },
          mechanics,
          flow: { passed: true },
          notes,
        };
      }

      if (result.stageName === 'Block Checks') {
        const blocks = blockReport(result.blocks);
        const notes = [];
        notes.push(blocks.coinRevealVisible ? 'coin reveal spawned on hit' : 'coin reveal missing on hit');
        notes.push(blocks.coinRevealExpired ? 'coin reveal faded after 1 second' : 'coin reveal lingered too long');
        notes.push(blocks.powerRevealVisible ? 'power reveal spawned on hit' : 'power reveal missing on hit');
        notes.push(blocks.powerRevealExpired ? 'power reveal faded after 1 second' : 'power reveal lingered too long');
        notes.push(blocks.powerSingleUse ? 'power block remained single-use' : 'power block triggered more than once');
        notes.push(blocks.blockedPlacementRejected ? 'blocked reward-block fixture rejected' : 'blocked reward-block fixture accepted incorrectly');
        notes.push(blocks.forcedHitRejected ? 'forced-hit power route rejected' : 'forced-hit power route accepted incorrectly');
        notes.push(blocks.safePlacementAllowed ? 'safe reward-block fixture accepted' : 'safe reward-block fixture rejected incorrectly');
        notes.push(blocks.hazardForcedHitRejected ? 'hazard forced-hit route rejected' : 'hazard forced-hit route accepted incorrectly');
        notes.push(blocks.coinForcedHitRejected ? 'coin forced-hit route rejected' : 'coin forced-hit route accepted incorrectly');
        notes.push(
          blocks.coinHazardForcedHitRejected
            ? 'coin hazard forced-hit route rejected'
            : 'coin hazard forced-hit route accepted incorrectly',
        );
        notes.push(blocks.hazardSafePlacementAllowed ? 'safe hazard fixture accepted' : 'safe hazard fixture rejected incorrectly');
        notes.push(blocks.runtimeSafeContinuation ? 'live enemy-route continuation passed' : 'live enemy-route continuation failed');
        notes.push(
          blocks.runtimeHazardSafeContinuation ? 'live hazard-route continuation passed' : 'live hazard-route continuation failed',
        );
        notes.push(blocks.runtimeCoinSafeContinuation ? 'live coin-route continuation passed' : 'live coin-route continuation failed');
        notes.push(blocks.spacingPassed ? 'punch-block spacing passed' : 'punch-block spacing failed');

        return {
          stageName: result.stageName,
          targetDurationMinutes: 0,
          estimatedMinutes: 0,
          readability: {
            segmentCount: 0,
            collectibleZones: [],
            maxCheckpointGap: 0,
            elevatedRoutePlatforms: 0,
            elevatedRouteRewards: 0,
            maxMainRouteThreatWindow: 0,
            optionalThreatCount: 0,
            segmentPass: true,
            collectiblePass: true,
            checkpointPass: true,
            routePass: true,
            encounterPass: true,
          },
          checkpoint: { passed: true },
          safety: { passed: true },
          mechanics: { passed: true },
          blocks,
          flow: { passed: true },
          notes,
        };
      }

      if (result.stageName === 'Secret Route Checks') {
        const notes = [];
        const secretRoutes = result.secretRoutes;
        const primaryRoute = secretRoutes.routeReports[0];
        notes.push(secretRoutes.routeCount > 0 ? `${secretRoutes.routeCount} secret route authored` : 'no secret routes authored');
        notes.push(primaryRoute?.cueReadable ? 'discovery cue reads from the main route' : 'discovery cue is not readable');
        notes.push(secretRoutes.revealTriggered ? 'hidden bridge reveal probe passed' : 'hidden bridge reveal probe failed');
        notes.push(
          secretRoutes.rewardCollectibleIds.length >= 2
            ? `optional sample payoff reached ${secretRoutes.rewardCollectibleIds.length} collectible rewards`
            : 'optional sample payoff was not collected reliably',
        );
        notes.push(primaryRoute?.reconnectSafe ? 'downstream reconnection remained safe' : 'downstream reconnection felt unsafe');
        notes.push(secretRoutes.reconnectProgressed ? 'reconnection probe advanced downstream' : 'reconnection probe stalled');
        notes.push(secretRoutes.skipMainRouteWorked ? 'main route skip probe stayed completable' : 'main route skip probe stalled');

        return {
          stageName: result.stageName,
          targetDurationMinutes: 0,
          estimatedMinutes: 0,
          readability: {
            segmentCount: 0,
            collectibleZones: [],
            maxCheckpointGap: 0,
            elevatedRoutePlatforms: 0,
            elevatedRouteRewards: 0,
            maxMainRouteThreatWindow: 0,
            optionalThreatCount: 0,
            segmentPass: true,
            collectiblePass: true,
            checkpointPass: true,
            routePass: true,
            encounterPass: true,
          },
          checkpoint: { passed: true },
          safety: { passed: true },
          mechanics: { passed: true },
          flow: { passed: true },
          secretRoutes,
          notes,
        };
      }

      const estimatedMinutes = estimateMinutes(result.stage);
      const readability = analyzeReadability(result.stage);
      const terrainRollout = analyzeTerrainRollout(result.stage);
      const terrainVariantCount = result.stage.platforms.filter((platform) => platform.terrainVariant).length;
      const checkpoint = checkpointReport(result.checkpoint);
      const safetyScan = analyzeSafety(result.stage);
      const blockSpacing = analyzeBlockSpacing(result.stage);
      const mechanics = {
        terrainRolloutPresent: terrainVariantCount > 0,
        terrainKindMinimumsPassed: terrainRollout.minimumsPassed,
        terrainBeatCoveragePassed: terrainRollout.beatCoveragePassed,
        gravityRolloutPresent: result.stage.gravityFields.length > 0,
        checkpointBeforeExit: result.stage.checkpoints.every(
          (checkpoint) => checkpoint.rect.x < result.stage.exit.x + result.stage.exit.width,
        ),
        passed:
          terrainVariantCount > 0 &&
          terrainRollout.minimumsPassed &&
          terrainRollout.beatCoveragePassed &&
          result.stage.gravityFields.length > 0 &&
          result.stage.checkpoints.every((checkpoint) => checkpoint.rect.x < result.stage.exit.x + result.stage.exit.width),
      };
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
          : 'collectibles do not cover early/mid/late pacing zones',
      );
      notes.push(
        readability.routePass
          ? `${readability.elevatedRoutePlatforms} elevated route anchors and ${readability.elevatedRouteRewards} elevated rewards support optional detours`
          : `optional route coverage is thin (${readability.elevatedRoutePlatforms} anchors, ${readability.elevatedRouteRewards} rewards)`,
      );
      notes.push(
        readability.encounterPass
          ? `main-route late windows peak at ${readability.maxMainRouteThreatWindow} threats while ${readability.optionalThreatCount} optional threats stay off the critical path`
          : `late-route threat density is too high (${readability.maxMainRouteThreatWindow}) or optional pressure is missing (${readability.optionalThreatCount})`,
      );
      notes.push(checkpoint.passed ? 'late checkpoint respawn passed' : 'late checkpoint respawn failed');
      notes.push(
        safetyScan.checkpointPass && safetyScan.hazardPass && safetyScan.enemyPass
          ? 'checkpoints, hazards, grounded enemies, and static elements are on supported routes'
          : `unsafe authored elements found: checkpoints [${safetyScan.unsafeCheckpoints.join(', ')}], hazards [${safetyScan.unsafeHazards.join(', ')}], enemy spawns [${safetyScan.unsafeEnemySpawns.join(', ')}], enemy lanes [${safetyScan.invalidEnemyLanes.join(', ')}], edge threats [${safetyScan.edgeThreats.join(', ')}], static overlaps [${safetyScan.overlappingStatics.join(', ')}]`,
      );
      notes.push(
        blockSpacing.passed
          ? 'reward blocks keep punchable clearance above stable floors'
          : `reward block spacing failed for [${blockSpacing.invalidBlocks.join(', ')}]`,
      );
      notes.push(mechanics.terrainRolloutPresent ? 'terrain variant rollout is authored on the stage' : 'terrain variant rollout is missing from the stage');
      notes.push(
        mechanics.terrainKindMinimumsPassed
          ? `terrain kind minimums passed with brittle=${terrainRollout.brittleCount} and sticky=${terrainRollout.stickyCount}`
          : `terrain kind minimums failed with brittle=${terrainRollout.brittleCount} and sticky=${terrainRollout.stickyCount}`,
      );
      notes.push(
        mechanics.terrainBeatCoveragePassed
          ? `terrain beats stay distributed across brittle [${terrainRollout.brittleBeats.join(', ')}] and sticky [${terrainRollout.stickyBeats.join(', ')}]`
          : `terrain beats collapsed to brittle [${terrainRollout.brittleBeats.join(', ')}] and sticky [${terrainRollout.stickyBeats.join(', ')}]`,
      );
      notes.push(mechanics.gravityRolloutPresent ? 'gravity-field rollout is authored on the stage' : 'gravity-field rollout is missing from the stage');
      notes.push(mechanics.checkpointBeforeExit ? 'all checkpoints stay before the terminal exit' : 'a checkpoint is authored beyond the terminal exit');

      return {
        stageName: result.stageName,
        targetDurationMinutes: result.targetDurationMinutes,
        estimatedMinutes,
        readability,
        checkpoint,
        safety: { passed: safetyScan.checkpointPass && safetyScan.hazardPass && safetyScan.enemyPass },
        blockSpacing,
        mechanics,
        flow: { passed: true },
        notes,
      };
    });

    const mechanicChecks = results.find((result) => result.stageName === 'Mechanic Checks');
    const retroMechanics = mechanicChecks?.mechanics ?? { passed: false };

    results.push({
      stageName: 'Retro Presentation Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: {
        powerVariantDistinct: retroMechanics.powerVariantDistinct === true,
        backdropRouteSeparationReadable: retroMechanics.backdropRouteSeparationReadable === true,
        authoredBackdropResponsive: retroMechanics.authoredBackdropResponsive === true,
        routingInteractablesReadable: retroMechanics.routingInteractablesReadable === true,
        hazardContrastReadable: retroMechanics.hazardContrastReadable === true,
        turretTelegraphReadable: retroMechanics.turretTelegraphReadable === true,
        passed:
          retroMechanics.powerVariantDistinct === true &&
          retroMechanics.backdropRouteSeparationReadable === true &&
          retroMechanics.authoredBackdropResponsive === true &&
          retroMechanics.routingInteractablesReadable === true &&
          retroMechanics.hazardContrastReadable === true &&
          retroMechanics.turretTelegraphReadable === true,
      },
      flow: { passed: true },
      notes: [
        retroMechanics.powerVariantDistinct === true
          ? 'player power variants remain distinct through silhouette and accent changes'
          : 'player power variants do not remain distinct through silhouette and accent changes',
        retroMechanics.backdropRouteSeparationReadable === true
          ? 'backdrop bands and decorative structures remain visually secondary to the route'
          : 'backdrop bands or decorative structures compete with route-critical gameplay colors',
        retroMechanics.authoredBackdropResponsive === true
          ? 'different authored stage palettes drive visibly different backdrop treatments'
          : 'different authored stage palettes do not drive visibly different backdrop treatments',
        retroMechanics.routingInteractablesReadable === true
          ? 'routing-critical interactables stay distinct against the flatter gameplay palette'
          : 'routing-critical interactables blend into the flatter gameplay palette',
        retroMechanics.hazardContrastReadable === true
          ? 'hazards keep reserved contrast against gameplay surfaces'
          : 'hazards lose reserved contrast against gameplay surfaces',
        retroMechanics.turretTelegraphReadable === true
          ? 'turret telegraphs stay visually distinct before firing'
          : 'turret telegraphs do not stay visually distinct before firing',
      ],
    });

    results.push({
      stageName: 'Turret Variant Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: { passed: turretVariantChecks.passed },
      turretVariantChecks,
      notes: turretVariantChecks.variantReports.flatMap((report) => [
        `${report.stageName}: ${report.variant} teaching beat ${report.teachingId ?? 'missing'} ${report.teachingIsolated ? 'stays isolated' : 'has nearby forced pressure'}`,
        `${report.stageName}: ${report.variant} teaching foothold ${report.teachingFoothold ? 'stays readable' : 'is missing a clear approach foothold'}`,
        `${report.stageName}: ${report.variant} mixed reuse ${report.mixedId ?? 'missing'} ${report.mixedPressure ? 'includes later pressure' : 'does not show later mixed pressure'}`,
        `${report.stageName}: ${report.variant} mixed foothold ${report.mixedFoothold ? 'preserves a response window' : 'compresses the response window too far'}`,
      ]),
    });

    results.push({
      stageName: 'Objective Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: { passed: objectiveChecks.passed },
      objectiveChecks,
      notes: [
        objectiveChecks.briefingShown ? 'objective briefing appeared on stage start' : 'objective briefing missing on stage start',
        objectiveChecks.incompleteExitBlocked ? 'incomplete objective blocked exit completion' : 'incomplete objective did not block exit completion',
        objectiveChecks.objectiveCompleted ? 'relay objective activation completed in-stage' : 'relay objective activation failed',
        objectiveChecks.completedExitCleared ? 'completed objective allowed exit clear' : 'completed objective did not allow exit clear',
      ],
    });

    results.push({
      stageName: 'Audio Asset Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: { passed: audioAssetChecks.passed },
      audioAssets: audioAssetChecks,
      notes: [
        audioAssetChecks.menuTrackMapped
          ? `menu track ${audioAssetChecks.menuAssetKey} matched the approved manifest entry`
          : 'menu track did not match the approved manifest entry',
        audioAssetChecks.manifestLicensesAllowed
          ? 'all active sustained music manifest entries use an allowed CC0 or Public Domain license'
          : 'one or more active sustained music manifest entries used a disallowed license',
        audioAssetChecks.backupsListed
          ? 'backup candidates remained recorded in the source manifest'
          : 'backup candidates were missing from the source manifest',
        audioAssetChecks.menuStartedAfterUnlock
          ? 'menu sustained music started only after a successful unlock'
          : 'menu sustained music started before a successful unlock',
        ...audioAssetChecks.stageReports.flatMap((report) => [
          `${report.stageName}: expected ${report.expectedAssetKey} and heard ${report.actualAssetKey}`,
          `${report.stageName}: manifest-backed mapping ${report.mappedTrackPassed ? 'passed' : 'failed'}`,
          `${report.stageName}: synthesized stingers ${report.synthStingersPreserved ? 'stayed in place' : 'were not preserved cleanly'}`,
          `${report.stageName}: realized gameplay asset startedAfterUnlock=${report.startedAfterUnlock}`,
          `${report.stageName}: single gameplay loop ownership ${report.singleGameplayLoop ? 'passed' : 'failed'}`,
        ]),
      ],
    });

    results.push({
      stageName: 'Retro Motion Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: {
        jumpFeedbackWorked: flowChecks.gameplayJumpFeedbackWorked,
        checkpointFeedbackWorked: flowChecks.gameplayCheckpointFeedbackWorked,
        coinFeedbackWorked: flowChecks.gameplayCoinFeedbackWorked,
        rewardFeedbackWorked: flowChecks.gameplayRewardFeedbackWorked,
        powerFeedbackWorked: flowChecks.gameplayPowerFeedbackWorked,
        healFeedbackWorked: flowChecks.gameplayHealFeedbackWorked,
          playerDefeatFeedbackWorked: flowChecks.gameplayPlayerDefeatFeedbackWorked,
          enemyDefeatFeedbackWorked: flowChecks.gameplayEnemyDefeatFeedbackWorked,
        introNoDedicatedAccent: flowChecks.introNoDedicatedAccent,
        completionNoDedicatedWidget: flowChecks.completionNoDedicatedWidget,
        shellExpandedOnDesktop: flowChecks.shellExpandedOnDesktop,
        shellBoundedOnConstrainedViewport: flowChecks.shellBoundedOnConstrainedViewport,
        passed:
          flowChecks.gameplayJumpFeedbackWorked &&
          flowChecks.gameplayCheckpointFeedbackWorked &&
          flowChecks.gameplayCoinFeedbackWorked &&
          flowChecks.gameplayRewardFeedbackWorked &&
          flowChecks.gameplayPowerFeedbackWorked &&
          flowChecks.gameplayHealFeedbackWorked &&
            flowChecks.gameplayPlayerDefeatFeedbackWorked &&
            flowChecks.gameplayEnemyDefeatFeedbackWorked &&
          flowChecks.introNoDedicatedAccent &&
          flowChecks.completionNoDedicatedWidget &&
          flowChecks.shellExpandedOnDesktop &&
          flowChecks.shellBoundedOnConstrainedViewport,
      },
      flow: { passed: true },
      notes: [
        flowChecks.gameplayJumpFeedbackWorked ? 'jump feedback triggered without losing readable pose changes' : 'jump feedback or airborne pose changes did not trigger',
        flowChecks.gameplayCheckpointFeedbackWorked ? 'checkpoint feedback triggered once on activation' : 'checkpoint feedback did not trigger on activation',
        flowChecks.gameplayCoinFeedbackWorked ? 'coin pickup feedback triggered once on collection' : 'coin pickup feedback did not trigger on collection',
        flowChecks.gameplayRewardFeedbackWorked ? 'reward reveal feedback triggered on a block reveal' : 'reward reveal feedback did not trigger on a block reveal',
        flowChecks.gameplayPowerFeedbackWorked ? 'power acquisition feedback triggered on gain' : 'power acquisition feedback did not trigger on gain',
        flowChecks.gameplayHealFeedbackWorked ? 'full-collection recovery feedback triggered on the final sample' : 'full-collection recovery feedback did not trigger on the final sample',
        flowChecks.gameplayPlayerDefeatFeedbackWorked ? 'player defeat burst triggered on the existing respawn path' : 'player defeat burst did not trigger on the existing respawn path',
        flowChecks.gameplayEnemyDefeatFeedbackWorked ? 'enemy defeat particles triggered on local defeats' : 'enemy defeat particles did not trigger on local defeats',
        flowChecks.introNoDedicatedAccent ? 'intro scene stayed text-focused with no dedicated accent during the existing intro duration' : 'intro scene did not satisfy the no-accent transition contract',
        flowChecks.completionNoDedicatedWidget ? 'completion surface stayed centered with no dedicated side widget during the existing results duration' : 'completion surface still exposed dedicated side-widget state during the existing results duration',
        flowChecks.shellExpandedOnDesktop ? 'game shell expanded on roomy desktop viewports without losing centering' : 'game shell did not expand cleanly on roomy desktop viewports',
        flowChecks.shellBoundedOnConstrainedViewport ? 'game shell stayed bounded on constrained viewports without horizontal overflow' : 'game shell overflowed or lost centering on constrained viewports',
      ],
    });

    results.push({
      stageName: 'Flow Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: {
        introVisible: flowChecks.introVisible,
        mainMenuRootVisible: flowChecks.mainMenuRootVisible,
        mainMenuKeyboardUpdate: flowChecks.mainMenuKeyboardUpdate,
        mainMenuNavigationAudio: flowChecks.mainMenuNavigationAudio,
        mainOptionsVisible: flowChecks.mainOptionsVisible,
        mainMenuConfirmAudio: flowChecks.mainMenuConfirmAudio,
        mainMenuPointerUpdate: flowChecks.mainMenuPointerUpdate,
        mainOptionsLiveUpdate: flowChecks.mainOptionsLiveUpdate,
        mainHelpVisible: flowChecks.mainHelpVisible,
        mainMenuBackAudio: flowChecks.mainMenuBackAudio,
        mainMenuRetroStyle: flowChecks.mainMenuRetroStyle,
        mainHelpLargerPanelVisible: flowChecks.mainHelpLargerPanelVisible,
        mainHelpScrollVisible: flowChecks.mainHelpScrollVisible,
        mainHelpKeyboardScrollWorked: flowChecks.mainHelpKeyboardScrollWorked,
        mainHelpWheelScrollWorked: flowChecks.mainHelpWheelScrollWorked,
        mainHelpClippingVerified: flowChecks.mainHelpClippingVerified,
        introAudioOwned: flowChecks.introAudioOwned,
        introStatusVisible: flowChecks.introStatusVisible,
        capsuleExitFinishWorked: flowChecks.capsuleExitFinishWorked,
        completeStatusVisible: flowChecks.completeStatusVisible,
        gameplayMusicOwned: flowChecks.gameplayMusicOwned,
        completionAudioOwned: flowChecks.completionAudioOwned,
        powerPickupAudioWorked: flowChecks.powerPickupAudioWorked,
        deathAudioWorked: flowChecks.deathAudioWorked,
        hudLayoutPassed: flowChecks.hudLayoutPassed,
        pauseOverlayVisible: flowChecks.pauseOverlayVisible,
        pauseMenuSceneRemoved: flowChecks.pauseMenuSceneRemoved,
        pauseFreezeWorked: flowChecks.pauseFreezeWorked,
        pauseMenuActionsRemoved: flowChecks.pauseMenuActionsRemoved,
        pauseResumeExact: flowChecks.pauseResumeExact,
        autoAdvanceWorked: flowChecks.autoAdvanceWorked,
        finalStageStopped: flowChecks.finalStageStopped,
        shellExpandedOnDesktop: flowChecks.shellExpandedOnDesktop,
        shellBoundedOnConstrainedViewport: flowChecks.shellBoundedOnConstrainedViewport,
        passed:
          flowChecks.mainMenuRootVisible &&
          flowChecks.mainMenuKeyboardUpdate &&
          flowChecks.mainMenuNavigationAudio &&
          flowChecks.menuGameplayDifferentiated &&
          flowChecks.mainOptionsVisible &&
          flowChecks.mainMenuConfirmAudio &&
          flowChecks.mainMenuPointerUpdate &&
          flowChecks.mainOptionsLiveUpdate &&
          flowChecks.mainHelpVisible &&
          flowChecks.mainMenuBackAudio &&
          flowChecks.mainMenuRetroStyle &&
          flowChecks.mainHelpLargerPanelVisible &&
          flowChecks.mainHelpScrollVisible &&
          flowChecks.mainHelpKeyboardScrollWorked &&
          flowChecks.mainHelpWheelScrollWorked &&
          flowChecks.mainHelpClippingVerified &&
          flowChecks.introVisible &&
          flowChecks.introAudioOwned &&
          flowChecks.introStatusVisible &&
          flowChecks.capsuleExitFinishWorked &&
          flowChecks.completeStatusVisible &&
          flowChecks.gameplayMusicOwned &&
          flowChecks.completionAudioOwned &&
          flowChecks.checkpointAudioWorked &&
          flowChecks.rewardAudioWorked &&
          flowChecks.dangerAudioWorked &&
          flowChecks.movingEntityAudioWorked &&
          flowChecks.movingPlatformAudioWorked &&
          flowChecks.powerPickupAudioWorked &&
          flowChecks.deathAudioWorked &&
          flowChecks.completionAudioDifferentiated &&
          flowChecks.finalCongratsAudioWorked &&
          flowChecks.stageThemeFamilyResolved &&
          flowChecks.surfaceDifferentiationVerified &&
          flowChecks.hudLayoutPassed &&
          flowChecks.pauseOverlayVisible &&
          flowChecks.pauseMenuSceneRemoved &&
          flowChecks.pauseFreezeWorked &&
          flowChecks.pauseMenuActionsRemoved &&
          flowChecks.pauseResumeExact &&
          flowChecks.autoAdvanceWorked &&
          flowChecks.finalStageStopped &&
          flowChecks.shellExpandedOnDesktop &&
          flowChecks.shellBoundedOnConstrainedViewport,
      },
      notes: [
        flowChecks.mainMenuRootVisible ? 'main menu root actions passed' : 'main menu root actions failed',
        flowChecks.mainMenuKeyboardUpdate ? 'main root keyboard navigation passed' : 'main root keyboard navigation failed',
        flowChecks.mainMenuNavigationAudio ? 'main root navigation cue passed' : 'main root navigation cue failed',
        flowChecks.menuGameplayDifferentiated ? 'menu theme stayed distinct from gameplay music' : 'menu theme and gameplay music collapsed together',
        flowChecks.mainOptionsVisible ? 'main options view passed' : 'main options view failed',
        flowChecks.mainMenuConfirmAudio ? 'menu confirm cue passed' : 'menu confirm cue failed',
        flowChecks.mainMenuPointerUpdate ? 'main options pointer navigation passed' : 'main options pointer navigation failed',
        flowChecks.mainOptionsLiveUpdate ? 'main options live updates passed' : 'main options live updates failed',
        flowChecks.mainHelpVisible ? 'main help view passed' : 'main help view failed',
        flowChecks.mainMenuBackAudio ? 'menu back cue passed' : 'menu back cue failed',
        flowChecks.mainMenuRetroStyle ? 'main menu retro style passed' : 'main menu retro style failed',
        flowChecks.mainHelpLargerPanelVisible ? 'main help panel sizing passed' : 'main help panel sizing failed',
        flowChecks.mainHelpScrollVisible ? 'main help scrollbar appeared for overflow' : 'main help scrollbar missing',
        flowChecks.mainHelpKeyboardScrollWorked ? 'main help keyboard scroll passed' : 'main help keyboard scroll failed',
        flowChecks.mainHelpWheelScrollWorked ? 'main help wheel scroll passed' : 'main help wheel scroll failed',
        flowChecks.mainHelpClippingVerified ? 'main help viewport clipping passed' : 'main help viewport clipping failed',
        flowChecks.introVisible ? 'stage intro scene appeared' : 'stage intro scene missing',
        flowChecks.introAudioOwned ? 'stage intro audio ownership passed' : 'stage intro audio ownership failed',
        flowChecks.introStatusVisible ? 'intro status summary passed' : 'intro status summary failed',
        flowChecks.capsuleExitFinishWorked ? 'capsule exit finish passed' : 'capsule exit finish failed',
        flowChecks.completeStatusVisible ? 'results summary passed' : 'results summary failed',
        flowChecks.gameplayMusicOwned ? 'gameplay music ownership passed' : 'gameplay music ownership failed',
        flowChecks.completionAudioOwned ? 'completion audio ownership passed' : 'completion audio ownership failed',
        flowChecks.checkpointAudioWorked ? 'checkpoint confirmation cue passed' : 'checkpoint confirmation cue failed',
        flowChecks.rewardAudioWorked ? 'reward pickup and reveal cues passed' : 'reward pickup and reveal cues failed',
        flowChecks.dangerAudioWorked ? 'danger telegraph cue passed' : 'danger telegraph cue failed',
        flowChecks.movingEntityAudioWorked ? 'moving enemy cues passed' : 'moving enemy cues failed',
        flowChecks.movingPlatformAudioWorked ? 'moving platform cadence cue passed' : 'moving platform cadence cue failed',
        flowChecks.powerPickupAudioWorked ? 'power pickup audio cues passed' : 'power pickup audio cues failed',
        flowChecks.deathAudioWorked ? 'fatal death audio cue passed' : 'fatal death audio cue failed',
        flowChecks.completionAudioDifferentiated ? 'stage clear and final congratulations audio stayed distinct' : 'stage clear and final congratulations audio collapsed together',
        flowChecks.finalCongratsAudioWorked ? 'final congratulations phrase passed' : 'final congratulations phrase failed',
        flowChecks.stageThemeFamilyResolved ? 'transition stingers stayed synthesized while gameplay loops remained asset-backed' : 'transition stingers or gameplay loop ownership drifted from the approved split audio model',
        flowChecks.surfaceDifferentiationVerified ? 'menu, reward, danger, death, and completion signatures stayed distinct' : 'major audio surfaces still read as interchangeable',
        flowChecks.hudLayoutPassed ? 'hud layout passed' : 'hud layout failed',
        flowChecks.pauseOverlayVisible ? 'pause overlay visibility passed' : 'pause overlay visibility failed',
        flowChecks.pauseMenuSceneRemoved ? 'pause menu scene no longer launched' : 'pause menu scene still launched',
        flowChecks.pauseFreezeWorked ? 'pause freeze check passed' : 'pause freeze check failed',
        flowChecks.pauseMenuActionsRemoved ? 'pause-only actions were removed' : 'pause-only actions still appeared',
        flowChecks.pauseResumeExact ? 'pause resume returned to the exact run' : 'pause resume rebuilt or lost runtime state',
        flowChecks.autoAdvanceWorked ? 'results auto-advance passed' : 'results auto-advance failed',
        flowChecks.finalStageStopped ? 'final stage stayed on results screen' : 'final stage auto-advanced incorrectly',
        flowChecks.shellExpandedOnDesktop ? 'roomy desktop shell sizing stayed enlarged and centered' : 'roomy desktop shell sizing regressed',
        flowChecks.shellBoundedOnConstrainedViewport ? 'constrained viewport shell sizing stayed bounded and centered' : 'constrained viewport shell sizing regressed',
      ],
    });

    const rewardLockCoverage = rewardLockCoverageReport();
    results.push({
      stageName: 'Reward Lock Coverage',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: { passed: true },
      rewardLockCoverage,
      notes: [
        rewardLockCoverage.blockedRejected ? 'blocked fixture rejected' : 'blocked fixture accepted incorrectly',
        rewardLockCoverage.forcedHitRejected ? 'forced-hit fixture rejected' : 'forced-hit fixture accepted incorrectly',
        rewardLockCoverage.safeAllowed ? 'safe fixture accepted' : 'safe fixture rejected incorrectly',
        rewardLockCoverage.hazardForcedHitRejected ? 'hazard forced-hit fixture rejected' : 'hazard forced-hit fixture accepted incorrectly',
        rewardLockCoverage.coinForcedHitRejected ? 'coin forced-hit fixture rejected' : 'coin forced-hit fixture accepted incorrectly',
        rewardLockCoverage.coinHazardForcedHitRejected ? 'coin hazard forced-hit fixture rejected' : 'coin hazard forced-hit fixture accepted incorrectly',
        rewardLockCoverage.hazardSafeAllowed ? 'safe hazard fixture accepted' : 'safe hazard fixture rejected incorrectly',
      ],
    });

    const staticLayoutCoverage = staticLayoutCoverageReport();
    results.push({
      stageName: 'Static Layout Coverage',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: true },
      flow: { passed: true },
      staticLayoutCoverage,
      notes: [
        staticLayoutCoverage.overlappingRejected
          ? 'overlapping static fixture rejected'
          : 'overlapping static fixture accepted incorrectly',
        staticLayoutCoverage.safeAllowed ? 'safe adjacent static fixture accepted' : 'safe adjacent static fixture rejected incorrectly',
      ],
    });

    const terrainVariantStageResults = results.filter((result) => result.targetDurationMinutes > 0);
    const terrainVariantStageChecksPassed = terrainVariantStageResults.every(
      (result) =>
        result.mechanics?.terrainRolloutPresent === true &&
        result.mechanics?.terrainKindMinimumsPassed === true &&
        result.mechanics?.terrainBeatCoveragePassed === true &&
        result.mechanics?.gravityRolloutPresent === true &&
        result.mechanics?.checkpointBeforeExit === true,
    );

    results.push({
      stageName: 'Terrain Variant Stage Checks',
      targetDurationMinutes: 0,
      estimatedMinutes: 0,
      readability: {
        segmentCount: 0,
        collectibleZones: [],
        maxCheckpointGap: 0,
        elevatedRoutePlatforms: 0,
        elevatedRouteRewards: 0,
        maxMainRouteThreatWindow: 0,
        optionalThreatCount: 0,
        segmentPass: true,
        collectiblePass: true,
        checkpointPass: true,
        routePass: true,
        encounterPass: true,
      },
      checkpoint: { passed: true },
      safety: { passed: true },
      mechanics: { passed: terrainVariantStageChecksPassed },
      flow: { passed: true },
      notes: terrainVariantStageResults.flatMap((result) => [
        `${result.stageName}: ${result.mechanics.terrainRolloutPresent ? 'platform terrain variants are authored' : 'platform terrain variants are missing'}`,
        `${result.stageName}: ${result.mechanics.terrainKindMinimumsPassed ? 'brittle and sticky minimum counts passed' : 'brittle and sticky minimum counts failed'}`,
        `${result.stageName}: ${result.mechanics.terrainBeatCoveragePassed ? 'terrain beat coverage passed' : 'terrain beat coverage failed'}`,
        `${result.stageName}: ${result.mechanics.gravityRolloutPresent ? 'linked gravity-room rollout is authored' : 'linked gravity-room rollout is missing'}`,
        `${result.stageName}: ${result.mechanics.checkpointBeforeExit ? 'checkpoints remain before the exit' : 'checkpoint placement crosses the exit'}`,
      ]),
    });

    const scopedResults = scopeResultsForChange(results, CHANGE_NAME);

    const failures = scopedResults.filter(
      (result) =>
        result.estimatedMinutes < result.targetDurationMinutes ||
        !result.readability.segmentPass ||
        !result.readability.checkpointPass ||
        !result.readability.collectiblePass ||
        !result.readability.routePass ||
        !result.readability.encounterPass ||
        !result.checkpoint.passed ||
        !result.safety.passed ||
        result.blockSpacing?.passed === false ||
        result.blocks?.passed === false ||
        result.rewardLockCoverage?.passed === false ||
        result.staticLayoutCoverage?.passed === false ||
        result.secretRoutes?.passed === false ||
        !result.mechanics.passed ||
        !result.flow.passed,
    );

      await fs.writeFile(JSON_REPORT, `${JSON.stringify(scopedResults, null, 2)}\n`);
      await fs.writeFile(MD_REPORT, buildMarkdown(scopedResults, CHANGE_NAME));

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
