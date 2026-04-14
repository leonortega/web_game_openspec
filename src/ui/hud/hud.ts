import { COLLECTIBLE_PRESENTATION } from '../../game/simulation/state';

type HudBindings = {
  root: HTMLDivElement;
  titleValue: HTMLSpanElement;
  coinsValue: HTMLSpanElement;
  healthValue: HTMLSpanElement;
  powerValue: HTMLSpanElement;
  runValue: HTMLSpanElement;
  segmentValue: HTMLSpanElement;
  message: HTMLDivElement;
};

export type HudViewModel = {
  stageName: string;
  stageIndex: number;
  stageCount: number;
  coins: string;
  health: number;
  powerLabel: string;
  runLabel: string;
  segmentLabel: string;
  message: string;
};

export const createHud = (mount: HTMLElement): HudBindings => {
  const root = document.createElement('div');
  root.className = 'hud-layer hud-layer-tight';
  root.innerHTML = `
    <div class="hud-scoreboard hud-scoreboard-tight">
      <div class="hud-top hud-bar">
        <div class="hud-card">
          <span class="hud-label">Stage</span>
          <span class="hud-value" data-role="title"></span>
        </div>
        <div class="hud-card">
          <span class="hud-label">${COLLECTIBLE_PRESENTATION.hudLabel}</span>
          <span class="hud-value" data-role="coins"></span>
        </div>
        <div class="hud-card">
          <span class="hud-label">Health</span>
          <span class="hud-value" data-role="health"></span>
        </div>
        <div class="hud-card">
          <span class="hud-label">Power</span>
          <span class="hud-value" data-role="power"></span>
        </div>
      </div>
    </div>
    <div class="hud-meta">
      <div class="hud-meta-line">
        <span class="hud-meta-label">Run</span>
        <span class="hud-meta-value" data-role="run"></span>
      </div>
      <div class="hud-meta-line">
        <span class="hud-meta-label">Segment</span>
        <span class="hud-meta-value" data-role="segment"></span>
      </div>
    </div>
    <div class="message-panel" data-role="message"></div>
  `;

  mount.appendChild(root);

  return {
    root,
    titleValue: root.querySelector('[data-role="title"]') as HTMLSpanElement,
    coinsValue: root.querySelector('[data-role="coins"]') as HTMLSpanElement,
    healthValue: root.querySelector('[data-role="health"]') as HTMLSpanElement,
    powerValue: root.querySelector('[data-role="power"]') as HTMLSpanElement,
    runValue: root.querySelector('[data-role="run"]') as HTMLSpanElement,
    segmentValue: root.querySelector('[data-role="segment"]') as HTMLSpanElement,
    message: root.querySelector('[data-role="message"]') as HTMLDivElement,
  };
};

export const updateHud = (hud: HudBindings, model: HudViewModel): void => {
  hud.titleValue.textContent = model.stageName;
  hud.coinsValue.textContent = model.coins;
  hud.healthValue.textContent = model.health.toString().padStart(2, '0');
  hud.powerValue.textContent = model.powerLabel;
  hud.runValue.textContent = model.runLabel;
  hud.segmentValue.textContent = model.segmentLabel;
  hud.message.textContent = model.message;
  hud.message.classList.toggle('visible', Boolean(model.message));
};
