import Phaser from 'phaser';
import {
  PLAYER_POWER_VARIANTS,
  type CheckpointState,
  type CollectibleState,
  type EnemyState,
  type PlatformState,
  type ProjectileState,
  type RewardBlockState,
  type RewardRevealState,
} from '../../game/simulation/state';
import { createHud } from '../../ui/hud/hud';
import { SceneBridge } from '../adapters/sceneBridge';
import { SynthAudio } from '../audio/SynthAudio';
import { configureCamera } from '../view/camera/configureCamera';

export class GameScene extends Phaser.Scene {
  private bridge!: SceneBridge;

  private audio!: SynthAudio;

  private playerAura!: Phaser.GameObjects.Ellipse;

  private player!: Phaser.GameObjects.Rectangle;

  private playerHeadband!: Phaser.GameObjects.Rectangle;

  private playerAccent!: Phaser.GameObjects.Rectangle;

  private playerWingLeft!: Phaser.GameObjects.Rectangle;

  private playerWingRight!: Phaser.GameObjects.Rectangle;

  private platformSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private enemySprites = new Map<string, Phaser.GameObjects.Sprite>();

  private checkpointSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private collectibleSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private rewardBlockSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private rewardBlockLabels = new Map<string, Phaser.GameObjects.Text>();

  private rewardRevealTexts = new Map<string, Phaser.GameObjects.Text>();

  private projectileSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private exitSprite!: Phaser.GameObjects.Sprite;

  private pauseOverlay!: Phaser.GameObjects.Rectangle;

  private pauseText!: Phaser.GameObjects.Text;

  private hud = createHud(document.createElement('div'));

  constructor() {
    super('game');
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as SceneBridge;
    this.audio = new SynthAudio(this, () => this.bridge.getSession().getState().progress.runSettings.masterVolume);
    const mount = this.game.canvas.parentElement as HTMLElement;
    this.hud.root.remove();
    this.hud = createHud(mount);

    const state = this.bridge.getSession().getState();
    const { stage } = state;

    this.cameras.main.fadeIn(150);
    configureCamera(this.cameras.main, stage.world.width, stage.world.height);

    const bg = this.add.graphics();
    bg.fillGradientStyle(stage.palette.skyTop, stage.palette.skyTop, stage.palette.skyBottom, stage.palette.skyBottom, 1);
    bg.fillRect(0, 0, stage.world.width, stage.world.height);
    bg.fillStyle(stage.palette.accent, 0.1);
    bg.fillCircle(220, 160, 180);
    bg.fillCircle(stage.world.width - 220, 120, 120);

    for (const platform of state.stageRuntime.platforms) {
      const sprite = this.add
        .rectangle(
          platform.x + platform.width / 2,
          platform.y + platform.height / 2,
          platform.width,
          platform.height,
          this.platformColor(platform),
        )
        .setOrigin(0.5);
      this.platformSprites.set(platform.id, sprite);
    }

    for (const hazard of state.stageRuntime.hazards) {
      this.drawHazard(hazard);
    }

    this.playerAura = this.add.ellipse(0, 0, 44, 58, 0x92f7ff, 0.22).setVisible(false);
    this.player = this.add.rectangle(0, 0, 26, 42, 0xf5cf64).setOrigin(0, 0);
    this.playerHeadband = this.add.rectangle(0, 0, 18, 6, 0xf7f3d6).setVisible(false);
    this.playerAccent = this.add.rectangle(0, 0, 10, 8, 0xf7f3d6).setVisible(false);
    this.playerWingLeft = this.add.rectangle(0, 0, 8, 16, 0xeafff0).setVisible(false);
    this.playerWingRight = this.add.rectangle(0, 0, 8, 16, 0xeafff0).setVisible(false);

    for (const checkpoint of state.stageRuntime.checkpoints) {
      const sprite = this.add.sprite(checkpoint.rect.x, checkpoint.rect.y, 'checkpoint').setOrigin(0, 0);
      this.checkpointSprites.set(checkpoint.id, sprite);
    }

    for (const collectible of state.stageRuntime.collectibles) {
      const sprite = this.add.sprite(collectible.position.x, collectible.position.y, 'collectible');
      this.collectibleSprites.set(collectible.id, sprite);
    }

    for (const rewardBlock of state.stageRuntime.rewardBlocks) {
      const blockSprite = this.add
        .rectangle(
          rewardBlock.x + rewardBlock.width / 2,
          rewardBlock.y + rewardBlock.height / 2,
          rewardBlock.width,
          rewardBlock.height,
          this.rewardBlockColor(rewardBlock),
        )
        .setStrokeStyle(2, 0xf7f3d6, 0.3)
        .setOrigin(0.5);
      const label = this.add
        .text(rewardBlock.x + rewardBlock.width / 2, rewardBlock.y + rewardBlock.height / 2, this.rewardBlockLabel(rewardBlock), {
          fontFamily: 'Trebuchet MS',
          fontSize: '14px',
          color: '#11150f',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.rewardBlockSprites.set(rewardBlock.id, blockSprite);
      this.rewardBlockLabels.set(rewardBlock.id, label);
    }

    for (const enemy of state.stageRuntime.enemies) {
      const sprite = this.add.sprite(enemy.x, enemy.y, enemy.kind).setOrigin(0, 0);
      this.enemySprites.set(enemy.id, sprite);
    }

    this.exitSprite = this.add.sprite(stage.exit.x, stage.exit.y, 'exit').setOrigin(0, 0).setTint(stage.palette.accent);

    this.pauseOverlay = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x08100d, 0.7)
      .setDepth(100)
      .setScrollFactor(0)
      .setVisible(false);
    this.pauseText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'PAUSE', {
        fontFamily: 'Trebuchet MS',
        fontSize: '44px',
        color: '#f7f3d6',
        fontStyle: 'bold',
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setScrollFactor(0)
      .setVisible(false);

    this.setupInput();
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.syncView();
    this.bridge.syncHud(this.hud);
    this.audio.startStageMusic(stage.id);

    const syncPauseOverlayLayout = ({ width, height }: { width: number; height: number }): void => {
      this.pauseOverlay.setPosition(width / 2, height / 2).setSize(width, height);
      this.pauseText.setPosition(width / 2, height / 2);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, syncPauseOverlayLayout);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, syncPauseOverlayLayout);
    });
  }

  update(_: number, delta: number): void {
    const view = this.cameras.main.worldView;
    this.bridge.setCameraViewBox({ x: view.x, y: view.y, width: view.width, height: view.height });
    this.bridge.consumeFrame(delta);
    const cues = this.bridge.drainCues();
    for (const cue of cues) {
      this.audio.playCue(cue);
    }

    const state = this.bridge.getSession().getState();
    this.syncView();
    this.bridge.syncHud(this.hud);

    if (state.levelJustCompleted) {
      this.time.delayedCall(350, () => {
        this.scene.start('complete');
      });
    }
  }

  shutdown(): void {
    this.audio.stopMusic();
    this.setPauseOverlayVisible(false);
    this.hud.root.remove();
    this.platformSprites.clear();
    this.enemySprites.clear();
    this.checkpointSprites.clear();
    this.collectibleSprites.clear();
    this.projectileSprites.clear();
    this.rewardBlockSprites.clear();
    this.rewardBlockLabels.clear();
    this.rewardRevealTexts.clear();
  }

  private setupInput(): void {
    const cursors = this.input.keyboard?.createCursorKeys();
    const left = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const right = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    const up = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const shift = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    const space = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const f = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    const r = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const esc = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    const unlockAudio = () => this.audio.unlock();
    this.input.keyboard?.once('keydown', unlockAudio);
    this.input.once('pointerdown', unlockAudio);

    const updateInput = () => {
      const moveLeft = Boolean(cursors?.left.isDown || left?.isDown);
      const moveRight = Boolean(cursors?.right.isDown || right?.isDown);
      const jumpHeld = Boolean(cursors?.up.isDown || up?.isDown || space?.isDown);

      this.bridge.setLeft(moveLeft);
      this.bridge.setRight(moveRight);
      this.bridge.setJumpHeld(jumpHeld);
    };

    this.events.on(Phaser.Scenes.Events.UPDATE, updateInput);

    for (const key of [cursors?.up, up, space]) {
      key?.on('down', () => this.bridge.pressJump());
    }
    shift?.on('down', () => this.bridge.pressDash());
    f?.on('down', () => this.bridge.pressShoot());

    r?.on('down', () => {
      this.bridge.restartStage();
      this.setPauseOverlayVisible(false);
      this.scene.restart();
    });

    esc?.on('down', () => {
      if (this.bridge.isRunPaused()) {
        if (!this.bridge.resumeRun()) {
          return;
        }

        this.setPauseOverlayVisible(false);
        return;
      }

      if (!this.bridge.pauseRun()) {
        return;
      }

      this.setPauseOverlayVisible(true);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.UPDATE, updateInput);
      this.hud.root.remove();
      this.audio.stopMusic();
    });
  }

  private drawHazard(hazard: { kind: string; rect: { x: number; y: number; width: number; height: number } }): void {
    this.add
      .rectangle(
        hazard.rect.x + hazard.rect.width / 2,
        hazard.rect.y + hazard.rect.height / 2,
        hazard.rect.width,
        hazard.rect.height,
        0xe75b5b,
      )
      .setOrigin(0.5);
  }

  private syncView(): void {
    const state = this.bridge.getSession().getState();
    const { player } = state;
    const variantKey = state.player.presentationPower ?? 'base';
    const variant = PLAYER_POWER_VARIANTS[variantKey];
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    this.player.setPosition(player.x, player.y);
    this.player.setAlpha(player.invulnerableMs > 0 && Math.floor(player.invulnerableMs / 90) % 2 === 0 ? 0.45 : 1);
    this.player.setFillStyle(variant.bodyColor);
    this.player.setStrokeStyle(2, variant.detailColor, 0.95);
    this.playerAura
      .setPosition(centerX, centerY)
      .setFillStyle(variant.auraColor ?? variant.accentColor, variant.auraColor ? 0.24 : 0.12)
      .setVisible(Boolean(variant.auraColor))
      .setAlpha(variant.auraColor ? 0.18 + Math.abs(Math.sin(this.time.now / 140)) * 0.22 : 0);
    this.playerHeadband.setVisible(false);
    this.playerAccent.setVisible(false);
    this.playerWingLeft.setVisible(false);
    this.playerWingRight.setVisible(false);
    this.syncPlayerAccessories(variantKey, variant, player);

    for (const platform of state.stageRuntime.platforms) {
      this.syncPlatform(platform);
    }

    for (const checkpoint of state.stageRuntime.checkpoints) {
      this.syncCheckpoint(checkpoint);
    }

    for (const collectible of state.stageRuntime.collectibles) {
      this.syncCollectible(collectible);
    }

    for (const rewardBlock of state.stageRuntime.rewardBlocks) {
      this.syncRewardBlock(rewardBlock);
    }

    for (const rewardReveal of state.stageRuntime.rewardReveals) {
      this.syncRewardReveal(rewardReveal);
    }

    for (const enemy of state.stageRuntime.enemies) {
      this.syncEnemy(enemy);
    }

    for (const projectile of state.stageRuntime.projectiles) {
      this.syncProjectile(projectile);
    }

    for (const [id, sprite] of this.projectileSprites.entries()) {
      if (!state.stageRuntime.projectiles.find((projectile) => projectile.id === id && projectile.alive)) {
        sprite.destroy();
        this.projectileSprites.delete(id);
      }
    }

    for (const [id, text] of this.rewardRevealTexts.entries()) {
      if (!state.stageRuntime.rewardReveals.find((rewardReveal) => rewardReveal.id === id)) {
        text.destroy();
        this.rewardRevealTexts.delete(id);
      }
    }

    this.exitSprite.setAlpha(state.stageRuntime.exitReached ? 0.55 : 1);
  }

  getDebugSnapshot(): {
    runPaused: boolean;
    pauseOverlayVisible: boolean;
    pauseText: string | null;
    hudVisible: boolean;
  } {
    return {
      runPaused: this.bridge.isRunPaused(),
      pauseOverlayVisible: this.pauseOverlay.visible && this.pauseText.visible,
      pauseText: this.pauseText.visible ? this.pauseText.text : null,
      hudVisible: this.hud.root.style.visibility !== 'hidden',
    };
  }

  private setPauseOverlayVisible(visible: boolean): void {
    this.pauseOverlay.setVisible(visible);
    this.pauseText.setVisible(visible);
    this.hud.root.style.visibility = visible ? 'hidden' : 'visible';
  }

  private syncPlatform(platform: PlatformState): void {
    const sprite = this.platformSprites.get(platform.id);
    if (!sprite) {
      return;
    }

    sprite.setPosition(platform.x + platform.width / 2, platform.y + platform.height / 2);
    sprite.setFillStyle(this.platformColor(platform));

    if (platform.kind === 'falling' && platform.fall) {
      const alpha = platform.fall.falling ? 0.45 : platform.fall.triggered ? 0.7 : 1;
      sprite.setAlpha(alpha);
    } else {
      sprite.setAlpha(1);
    }
  }

  private syncCheckpoint(checkpoint: CheckpointState): void {
    const sprite = this.checkpointSprites.get(checkpoint.id);
    sprite?.setTint(checkpoint.activated ? 0xd8ff74 : 0x91f275);
  }

  private syncCollectible(collectible: CollectibleState): void {
    const sprite = this.collectibleSprites.get(collectible.id);
    if (!sprite) {
      return;
    }
    sprite.setVisible(!collectible.collected);
    if (!collectible.collected) {
      sprite.setPosition(collectible.position.x, collectible.position.y);
    }
  }

  private syncRewardBlock(rewardBlock: RewardBlockState): void {
    const sprite = this.rewardBlockSprites.get(rewardBlock.id);
    const label = this.rewardBlockLabels.get(rewardBlock.id);
    if (!sprite || !label) {
      return;
    }

    const flashProgress = Phaser.Math.Clamp(rewardBlock.hitFlashMs / 180, 0, 1);
    const bumpOffset = flashProgress > 0 ? 10 * flashProgress : 0;
    const alpha = rewardBlock.used ? 0.35 : 1;

    sprite.setPosition(rewardBlock.x + rewardBlock.width / 2, rewardBlock.y + rewardBlock.height / 2 - bumpOffset);
    sprite.setFillStyle(this.rewardBlockColor(rewardBlock));
    sprite.setStrokeStyle(2, flashProgress > 0 ? 0xffffff : 0xf7f3d6, flashProgress > 0 ? 0.8 : 0.3);
    sprite.setAlpha(alpha);
    label.setPosition(rewardBlock.x + rewardBlock.width / 2, rewardBlock.y + rewardBlock.height / 2 - bumpOffset);
    label.setText(this.rewardBlockLabel(rewardBlock));
    label.setAlpha(alpha);
  }

  private syncRewardReveal(rewardReveal: RewardRevealState): void {
    let text = this.rewardRevealTexts.get(rewardReveal.id);
    if (!text) {
      text = this.add
        .text(rewardReveal.x, rewardReveal.y, this.rewardRevealText(rewardReveal), {
          fontFamily: 'Trebuchet MS',
          fontSize: '18px',
          color: this.rewardRevealColor(rewardReveal),
          fontStyle: 'bold',
          stroke: '#08100d',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(12);
      this.rewardRevealTexts.set(rewardReveal.id, text);
    }

    const alpha = Phaser.Math.Clamp(rewardReveal.timerMs / rewardReveal.durationMs, 0, 1);
    const floatOffset = (1 - alpha) * 24;
    text.setText(this.rewardRevealText(rewardReveal));
    text.setColor(this.rewardRevealColor(rewardReveal));
    text.setPosition(rewardReveal.x, rewardReveal.y - floatOffset);
    text.setAlpha(alpha);
  }

  private syncEnemy(enemy: EnemyState): void {
    const sprite = this.enemySprites.get(enemy.id);
    if (!sprite) {
      return;
    }
    sprite.setVisible(enemy.alive);
    if (enemy.alive) {
      sprite.setPosition(enemy.x, enemy.y);
      sprite.setFlipX(enemy.direction < 0);
      sprite.setTint(
        enemy.kind === 'charger' ? 0xffa16f : enemy.kind === 'flyer' ? 0xc9fdff : 0xffffff,
      );
      if (enemy.kind === 'charger' && enemy.charger?.state === 'windup') {
        sprite.setTint(0xffe38a);
      }
    }
  }

  private syncProjectile(projectile: ProjectileState): void {
    let sprite = this.projectileSprites.get(projectile.id);
    if (!projectile.alive) {
      sprite?.destroy();
      this.projectileSprites.delete(projectile.id);
      return;
    }

    if (!sprite) {
      sprite = this.add.sprite(projectile.x, projectile.y, 'projectile').setOrigin(0, 0);
      this.projectileSprites.set(projectile.id, sprite);
    }

    sprite.setPosition(projectile.x, projectile.y);
  }

  private platformColor(platform: PlatformState): number {
    switch (platform.kind) {
      case 'moving':
        return 0x8faec6;
      case 'falling':
        return 0xc78f59;
      case 'spring':
        return 0x8fd37c;
      default:
        return this.bridge.getSession().getState().stage.palette.ground;
    }
  }

  private rewardBlockColor(rewardBlock: RewardBlockState): number {
    if (rewardBlock.reward.kind === 'coins') {
      return 0xf5cf64;
    }

    switch (rewardBlock.reward.power) {
      case 'doubleJump':
        return 0x9df4b4;
      case 'shooter':
        return 0xffb56f;
      case 'invincible':
        return 0x92f7ff;
      case 'dash':
        return 0xf7f3d6;
    }
  }

  private rewardBlockLabel(rewardBlock: RewardBlockState): string {
    if (rewardBlock.reward.kind === 'coins') {
      return rewardBlock.remainingHits > 0 ? `C${rewardBlock.remainingHits}` : '--';
    }

    if (rewardBlock.used) {
      return '--';
    }

    switch (rewardBlock.reward.power) {
      case 'doubleJump':
        return 'DJ';
      case 'shooter':
        return 'SH';
      case 'invincible':
        return 'IV';
      case 'dash':
        return 'DA';
    }
  }

  private rewardRevealText(rewardReveal: RewardRevealState): string {
    if (rewardReveal.reward.kind === 'coins') {
      return 'COIN';
    }

    switch (rewardReveal.reward.power) {
      case 'doubleJump':
        return 'DOUBLE JUMP';
      case 'shooter':
        return 'SHOOTER';
      case 'invincible':
        return 'INVINCIBLE';
      case 'dash':
        return 'DASH';
    }
  }

  private rewardRevealColor(rewardReveal: RewardRevealState): string {
    if (rewardReveal.reward.kind === 'coins') {
      return '#f5cf64';
    }

    switch (rewardReveal.reward.power) {
      case 'doubleJump':
        return '#9df4b4';
      case 'shooter':
        return '#ffb56f';
      case 'invincible':
        return '#92f7ff';
      case 'dash':
        return '#f7f3d6';
    }
  }

  private syncPlayerAccessories(
    variantKey: keyof typeof PLAYER_POWER_VARIANTS,
    variant: (typeof PLAYER_POWER_VARIANTS)[keyof typeof PLAYER_POWER_VARIANTS],
    player: { x: number; y: number; width: number; height: number; facing: 1 | -1; dashTimerMs: number },
  ): void {
    const centerX = player.x + player.width / 2;
    const facingOffset = player.facing === 1 ? 1 : -1;
    switch (variantKey) {
      case 'doubleJump':
        this.playerHeadband
          .setPosition(centerX, player.y + 8)
          .setSize(18, 5)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerWingLeft
          .setPosition(player.x - 4, player.y + 18)
          .setSize(8, 16)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        this.playerWingRight
          .setPosition(player.x + player.width + 4, player.y + 18)
          .setSize(8, 16)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      case 'shooter':
        this.playerHeadband
          .setPosition(centerX, player.y + 13)
          .setSize(18, 6)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX + facingOffset * 12, player.y + 22)
          .setSize(12, 9)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      case 'invincible':
        this.playerHeadband
          .setPosition(centerX, player.y + 6)
          .setSize(20, 6)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX, player.y - 1)
          .setSize(10, 6)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        break;
      case 'dash':
        this.playerHeadband
          .setPosition(centerX, player.y + player.height - 7)
          .setSize(20, 5)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        this.playerAccent
          .setPosition(centerX - facingOffset * 14, player.y + 20)
          .setSize(player.dashTimerMs > 0 ? 16 : 10, 8)
          .setFillStyle(variant.accentColor)
          .setVisible(true);
        break;
      default:
        this.playerHeadband
          .setPosition(centerX, player.y + 10)
          .setSize(14, 4)
          .setFillStyle(variant.detailColor)
          .setVisible(true);
        break;
    }
  }
}
