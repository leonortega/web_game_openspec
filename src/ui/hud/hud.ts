type HudBindings = {
  root: HTMLDivElement;
  titleValue: HTMLSpanElement;
  crystalsValue: HTMLSpanElement;
  healthValue: HTMLSpanElement;
  stageValue: HTMLSpanElement;
  segmentValue: HTMLSpanElement;
  message: HTMLDivElement;
};

export type HudViewModel = {
  stageName: string;
  stageIndex: number;
  stageCount: number;
  targetMinutes: number;
  segmentTitle: string;
  crystals: number;
  health: number;
  message: string;
};

export const createHud = (mount: HTMLElement): HudBindings => {
  const root = document.createElement('div');
  root.className = 'hud-layer';
  root.innerHTML = `
    <div class="hud-top">
      <div class="hud-card">
        <span class="hud-label">Stage</span>
        <span class="hud-value" data-role="title"></span>
      </div>
      <div class="hud-card">
        <span class="hud-label">Crystals</span>
        <span class="hud-value" data-role="crystals"></span>
      </div>
      <div class="hud-card">
        <span class="hud-label">Health</span>
        <span class="hud-value" data-role="health"></span>
      </div>
    </div>
    <div class="message-panel" data-role="message"></div>
    <div class="hud-bottom">
      <div class="hud-card">
        <span class="hud-label">Progress</span>
        <span class="hud-value" data-role="stage"></span>
      </div>
      <div class="hud-card">
        <span class="hud-label">Segment</span>
        <span class="hud-value" data-role="segment"></span>
      </div>
      <div class="hud-card">
        <span class="hud-label">Controls</span>
        <span class="hud-value">Move: A/D or Arrows<br />Jump: Space / W / Up</span>
      </div>
    </div>
  `;

  mount.appendChild(root);

  return {
    root,
    titleValue: root.querySelector('[data-role="title"]') as HTMLSpanElement,
    crystalsValue: root.querySelector('[data-role="crystals"]') as HTMLSpanElement,
    healthValue: root.querySelector('[data-role="health"]') as HTMLSpanElement,
    stageValue: root.querySelector('[data-role="stage"]') as HTMLSpanElement,
    segmentValue: root.querySelector('[data-role="segment"]') as HTMLSpanElement,
    message: root.querySelector('[data-role="message"]') as HTMLDivElement,
  };
};

export const updateHud = (hud: HudBindings, model: HudViewModel): void => {
  hud.titleValue.textContent = `${model.stageName} (${model.targetMinutes}m+)`;
  hud.crystalsValue.textContent = `${model.crystals}`;
  hud.healthValue.textContent = `${'♥'.repeat(model.health) || '0'}`;
  hud.stageValue.textContent = `${model.stageIndex + 1} / ${model.stageCount}`;
  hud.segmentValue.textContent = model.segmentTitle;
  hud.message.textContent = model.message;
  hud.message.classList.toggle('visible', Boolean(model.message));
};
