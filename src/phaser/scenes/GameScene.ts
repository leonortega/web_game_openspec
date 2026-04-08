import Phaser from 'phaser';
import type {
  CheckpointState,
  CollectibleState,
  EnemyState,
  HazardState,
  ProjectileState,
} from '../../game/simulation/state';
import { createHud } from '../../ui/hud/hud';
import { SceneBridge } from '../adapters/sceneBridge';
import { configureCamera } from '../view/camera/configureCamera';

export class GameScene extends Phaser.Scene {
  private bridge!: SceneBridge;
  private player!: Phaser.GameObjects.Rectangle;
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

    for (const platform of stage.platforms) {
      this.add
        .rectangle(
          platform.x + platform.width / 2,
          platform.y + platform.height / 2,
          platform.width,
          platform.height,
          stage.palette.ground,
        )
        .setOrigin(0.5);
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
  }

  update(_: number, delta: number): void {
    this.bridge.consumeFrame(delta);
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
    this.hud.root.remove();
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
    const space = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const r = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const esc = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

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
    });
  }

  private drawHazard(hazard: HazardState): void {
    if (hazard.kind === 'spikes') {
      this.add
        .rectangle(
          hazard.rect.x + hazard.rect.width / 2,
          hazard.rect.y + hazard.rect.height / 2,
          hazard.rect.width,
          hazard.rect.height,
          0xe75b5b,
        )
        .setOrigin(0.5);
      return;
    }

    const color = hazard.kind === 'lava' ? 0xff6a2e : 0x000000;
    this.add
      .rectangle(
        hazard.rect.x + hazard.rect.width / 2,
        hazard.rect.y + hazard.rect.height / 2,
        hazard.rect.width,
        hazard.rect.height,
        color,
      )
      .setOrigin(0.5);
  }

  private syncView(): void {
    const state = this.bridge.getSession().getState();
    const { player } = state;
    this.player.setPosition(player.x, player.y);
    this.player.setAlpha(player.invulnerableMs > 0 && Math.floor(player.invulnerableMs / 90) % 2 === 0 ? 0.45 : 1);

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
}
