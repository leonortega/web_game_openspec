import Phaser from 'phaser';
import type {
  CheckpointState,
  CollectibleState,
  EnemyState,
  PlatformState,
  ProjectileState,
} from '../../game/simulation/state';
import { createHud } from '../../ui/hud/hud';
import { SceneBridge } from '../adapters/sceneBridge';
import { SynthAudio } from '../audio/SynthAudio';
import { configureCamera } from '../view/camera/configureCamera';

export class GameScene extends Phaser.Scene {
  private bridge!: SceneBridge;

  private audio!: SynthAudio;

  private player!: Phaser.GameObjects.Rectangle;

  private platformSprites = new Map<string, Phaser.GameObjects.Rectangle>();

  private enemySprites = new Map<string, Phaser.GameObjects.Sprite>();

  private checkpointSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private collectibleSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private projectileSprites = new Map<string, Phaser.GameObjects.Sprite>();

  private exitSprite!: Phaser.GameObjects.Sprite;

  private hud = createHud(document.createElement('div'));

  constructor() {
    super('game');
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as SceneBridge;
    this.audio = new SynthAudio(this);
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

    this.player = this.add.rectangle(0, 0, 26, 42, 0xf5cf64).setOrigin(0, 0);

    for (const checkpoint of state.stageRuntime.checkpoints) {
      const sprite = this.add.sprite(checkpoint.rect.x, checkpoint.rect.y, 'checkpoint').setOrigin(0, 0);
      this.checkpointSprites.set(checkpoint.id, sprite);
    }

    for (const collectible of state.stageRuntime.collectibles) {
      const sprite = this.add.sprite(collectible.position.x, collectible.position.y, 'collectible');
      this.collectibleSprites.set(collectible.id, sprite);
    }

    for (const enemy of state.stageRuntime.enemies) {
      const sprite = this.add.sprite(enemy.x, enemy.y, enemy.kind).setOrigin(0, 0);
      this.enemySprites.set(enemy.id, sprite);
    }

    this.exitSprite = this.add.sprite(stage.exit.x, stage.exit.y, 'exit').setOrigin(0, 0).setTint(stage.palette.accent);

    this.setupInput();
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.syncView();
    this.bridge.syncHud(this.hud);
    this.audio.startStageMusic(stage.id);
  }

  update(_: number, delta: number): void {
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
    this.hud.root.remove();
    this.platformSprites.clear();
    this.enemySprites.clear();
    this.checkpointSprites.clear();
    this.collectibleSprites.clear();
    this.projectileSprites.clear();
  }

  private setupInput(): void {
    const cursors = this.input.keyboard?.createCursorKeys();
    const left = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const right = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    const up = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const shift = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    const space = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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

    r?.on('down', () => {
      this.bridge.getSession().restartStage();
      this.scene.restart();
    });

    esc?.on('down', () => {
      this.scene.start('menu');
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
    this.player.setPosition(player.x, player.y);
    this.player.setAlpha(player.invulnerableMs > 0 && Math.floor(player.invulnerableMs / 90) % 2 === 0 ? 0.45 : 1);
    this.player.setFillStyle(player.dashTimerMs > 0 ? 0xffffff : 0xf5cf64);

    for (const platform of state.stageRuntime.platforms) {
      this.syncPlatform(platform);
    }

    for (const checkpoint of state.stageRuntime.checkpoints) {
      this.syncCheckpoint(checkpoint);
    }

    for (const collectible of state.stageRuntime.collectibles) {
      this.syncCollectible(collectible);
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

    this.exitSprite.setAlpha(state.stageRuntime.exitReached ? 0.55 : 1);
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
}
