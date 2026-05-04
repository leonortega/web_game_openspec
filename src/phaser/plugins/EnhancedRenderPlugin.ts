import * as Phaser from 'phaser';

export default class EnhancedRenderPlugin extends Phaser.Plugins.ScenePlugin {
  constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager) {
    super(scene, pluginManager, 'EnhancedRender');
    try {
      this.install();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('EnhancedRenderPlugin failed to initialize', err);
    }
  }

  private install(): void {
    const sceneAny = this.scene as any;

    // gpuSprite helper (uses native if available, otherwise falls back to regular sprite)
    if (!sceneAny.add.gpuSprite) {
      sceneAny.add.gpuSprite = (x: number, y: number, key: string) => {
        // Attempt to use any native SpriteGPULayer API if present (safe-guarded)
        const nativeGPULayer = (sceneAny.sys && sceneAny.sys.plugins && sceneAny.sys.plugins.get && sceneAny.sys.plugins.get('SpriteGPULayer')) || (window as any).SpriteGPULayer;
        if (nativeGPULayer && typeof nativeGPULayer.add === 'function') {
          try {
            return nativeGPULayer.add(sceneAny, x, y, key);
          } catch (e) {
            // fallthrough to fallback
          }
        }

        // Fallback: regular sprite, but track it in an internal group so future batching is possible.
        if (!sceneAny.__enhancedGpuGroup) {
          sceneAny.__enhancedGpuGroup = sceneAny.add.group({ runChildUpdate: false });
        }
        const s = sceneAny.add.sprite(x, y, key);
        try {
          sceneAny.__enhancedGpuGroup.add(s);
        } catch (e) {
          // ignore
        }
        return s;
      };
    }

    // Unified filter system facade: proxy calls to camera external filters when available
    try {
      if (!sceneAny.filters) sceneAny.filters = {};
      if (!sceneAny.filters.unified) sceneAny.filters.unified = {};

      const makeProxy = (name: string) => {
        return function (opts: any) {
          const cam = (sceneAny as Phaser.Scene).cameras?.main as any;
          if (cam && cam.filters && cam.filters.external && typeof cam.filters.external[name] === 'function') {
            return cam.filters.external[name](opts);
          }
          // eslint-disable-next-line no-console
          console.warn(`Unified filter '${name}' not present; no-op`);
          return null;
        };
      };

      const filterNames = ['addBlur', 'addGlow', 'addShadow', 'addBloom', 'addVignette', 'addWipe', 'addQuantize'];
      for (const n of filterNames) {
        if (typeof sceneAny.filters.unified[n] !== 'function') {
          sceneAny.filters.unified[n] = makeProxy(n);
        }
      }
    } catch (e) {
      // ignore
    }

    // Simple lighting shim: add setLighting to Sprite prototype if not present
    try {
      const SpriteProto: any = (Phaser.GameObjects as any).Sprite && (Phaser.GameObjects as any).Sprite.prototype;
      if (SpriteProto && !SpriteProto.setLighting) {
        SpriteProto.setLighting = function (enabled: boolean, opts?: { offsetX?: number; offsetY?: number; alpha?: number; color?: number; selfShadow?: boolean }) {
          const self: any = this as any;
          try {
            if (enabled) {
              if (!self.__lightingShadow) {
                const w = Math.max(self.displayWidth || self.width || 8, 8);
                const h = Math.max(self.displayHeight || self.height || 4, 4);
                const ox = (opts && opts.offsetX) || 4;
                const oy = (opts && opts.offsetY) || 8;
                const alpha = (opts && opts.alpha) || 0.34;
                const color = (opts && opts.color) || 0x000000;
                const shadow = self.scene.add.ellipse(self.x + ox, self.y + oy, w, h, color, alpha).setOrigin(self.originX || 0, self.originY || 0);
                shadow.setDepth((self.depth || 0) - 0.01);
                self.__lightingShadow = shadow;
                if (opts && opts.selfShadow && typeof self.setTint === 'function') {
                  self.__lightingOldTint = (self.tintTopLeft || undefined) as any;
                  try {
                    self.setTint(0xdddddd);
                  } catch (e) {
                    // ignore
                  }
                }
              }
            } else {
              if (self.__lightingShadow) {
                try {
                  self.__lightingShadow.destroy();
                } catch (e) {}
                self.__lightingShadow = undefined;
              }
              if (self.__lightingOldTint !== undefined && typeof self.clearTint === 'function') {
                try {
                  self.clearTint();
                } catch (e) {
                  // ignore
                }
              }
            }
          } catch (e) {
            // ignore
          }
          return self;
        };
      }
    } catch (e) {
      // ignore
    }

    const cleanup = () => {
      try {
        if (sceneAny.__enhancedGpuGroup) {
          sceneAny.__enhancedGpuGroup.clear(true);
          sceneAny.__enhancedGpuGroup = undefined;
        }
      } catch (e) {
        // ignore
      }
    };

    try {
      sceneAny.sys.events.on('shutdown', cleanup);
      sceneAny.sys.events.on('destroy', cleanup);
    } catch (e) {
      // ignore
    }
  }
}
