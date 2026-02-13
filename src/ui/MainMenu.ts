import type { ScenarioConfig } from '@core/types';
import { CAMPAIGN_SCENARIOS } from '@data/campaignScenarios';
import { SCENARIOS } from '@data/scenarios';
import { PlayerProfile } from '@core/profile/PlayerProfile';

export interface MainMenuCallbacks {
  onStartCampaign: (scenario: ScenarioConfig) => void;
  onStartSandbox: (biomeId: string, mapSize: number) => void;
}

export class MainMenu {
  private root: HTMLElement;
  private callbacks: MainMenuCallbacks | null = null;
  private profile: PlayerProfile;

  // Sub-panels
  private titleScreen!: HTMLElement;
  private campaignScreen!: HTMLElement;
  private sandboxScreen!: HTMLElement;

  constructor(container: HTMLElement, profile: PlayerProfile) {
    this.profile = profile;
    this.root = document.createElement('div');
    this.root.className = 'main-menu';
    container.appendChild(this.root);

    this.buildTitleScreen();
    this.buildCampaignScreen();
    this.buildSandboxScreen();

    this.showTitle();
  }

  setCallbacks(cb: MainMenuCallbacks): void {
    this.callbacks = cb;
  }

  show(): void {
    this.root.classList.add('main-menu--visible');
    this.showTitle();
  }

  hide(): void {
    this.root.classList.remove('main-menu--visible');
  }

  isVisible(): boolean {
    return this.root.classList.contains('main-menu--visible');
  }

  // ── Screens ──

  private showTitle(): void {
    this.titleScreen.style.display = 'flex';
    this.campaignScreen.style.display = 'none';
    this.sandboxScreen.style.display = 'none';
  }

  private showCampaign(): void {
    this.titleScreen.style.display = 'none';
    this.campaignScreen.style.display = 'flex';
    this.sandboxScreen.style.display = 'none';
    this.refreshCampaignList();
  }

  private showSandbox(): void {
    this.titleScreen.style.display = 'none';
    this.campaignScreen.style.display = 'none';
    this.sandboxScreen.style.display = 'flex';
  }

  // ── Title Screen ──

  private buildTitleScreen(): void {
    const screen = document.createElement('div');
    screen.className = 'main-menu__screen main-menu__title-screen';

    const title = document.createElement('h1');
    title.className = 'main-menu__title';
    title.textContent = 'myBiome';
    screen.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'main-menu__subtitle';
    subtitle.textContent = 'Ein Ökosystem-Simulator';
    screen.appendChild(subtitle);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'main-menu__btn-group';

    const campaignBtn = this.createMenuButton('Kampagne', () => this.showCampaign());
    const sandboxBtn = this.createMenuButton('Sandbox', () => this.showSandbox());
    const settingsBtn = this.createMenuButton('Einstellungen', () => {});
    settingsBtn.classList.add('main-menu__btn--disabled');
    settingsBtn.title = 'Kommt bald';

    btnGroup.append(campaignBtn, sandboxBtn, settingsBtn);
    screen.appendChild(btnGroup);

    this.titleScreen = screen;
    this.root.appendChild(screen);
  }

  // ── Campaign Screen ──

  private buildCampaignScreen(): void {
    const screen = document.createElement('div');
    screen.className = 'main-menu__screen main-menu__campaign-screen';
    screen.style.display = 'none';

    const header = document.createElement('div');
    header.className = 'main-menu__header';

    const backBtn = this.createMenuButton('< Zurück', () => this.showTitle());
    backBtn.classList.add('main-menu__btn--small');
    header.appendChild(backBtn);

    const heading = document.createElement('h2');
    heading.className = 'main-menu__heading';
    heading.textContent = 'Kampagne';
    header.appendChild(heading);

    screen.appendChild(header);

    const list = document.createElement('div');
    list.className = 'main-menu__level-list';
    list.id = 'campaign-level-list';
    screen.appendChild(list);

    this.campaignScreen = screen;
    this.root.appendChild(screen);
  }

  private refreshCampaignList(): void {
    const list = document.getElementById('campaign-level-list');
    if (!list) return;
    list.innerHTML = '';

    for (const scenario of CAMPAIGN_SCENARIOS) {
      const unlocked = this.profile.isScenarioUnlocked(scenario.id);
      const completed = this.profile.isScenarioCompleted(scenario.id);

      const card = document.createElement('div');
      card.className = 'main-menu__level-card';
      if (!unlocked) card.classList.add('main-menu__level-card--locked');
      if (completed) card.classList.add('main-menu__level-card--completed');

      const tierBadge = document.createElement('span');
      tierBadge.className = 'main-menu__level-tier';
      tierBadge.textContent = `Tier ${scenario.tier}`;
      card.appendChild(tierBadge);

      const name = document.createElement('div');
      name.className = 'main-menu__level-name';
      name.textContent = scenario.title;
      card.appendChild(name);

      const desc = document.createElement('div');
      desc.className = 'main-menu__level-desc';
      desc.textContent = scenario.description ?? '';
      card.appendChild(desc);

      if (completed) {
        const best = this.profile.getBestTick(scenario.id);
        if (best !== undefined) {
          const bestEl = document.createElement('div');
          bestEl.className = 'main-menu__level-best';
          bestEl.textContent = `Bestzeit: Tick ${best}`;
          card.appendChild(bestEl);
        }
      }

      if (unlocked) {
        const playBtn = this.createMenuButton('Starten', () => {
          this.callbacks?.onStartCampaign(scenario);
        });
        playBtn.classList.add('main-menu__btn--accent');
        card.appendChild(playBtn);
      }

      list.appendChild(card);
    }
  }

  // ── Sandbox Screen ──

  private buildSandboxScreen(): void {
    const screen = document.createElement('div');
    screen.className = 'main-menu__screen main-menu__sandbox-screen';
    screen.style.display = 'none';

    const header = document.createElement('div');
    header.className = 'main-menu__header';

    const backBtn = this.createMenuButton('< Zurück', () => this.showTitle());
    backBtn.classList.add('main-menu__btn--small');
    header.appendChild(backBtn);

    const heading = document.createElement('h2');
    heading.className = 'main-menu__heading';
    heading.textContent = 'Sandbox';
    header.appendChild(heading);

    screen.appendChild(header);

    const form = document.createElement('div');
    form.className = 'main-menu__sandbox-form';

    // Biome selector
    const biomeLabel = document.createElement('label');
    biomeLabel.className = 'main-menu__label';
    biomeLabel.textContent = 'Biom';
    form.appendChild(biomeLabel);

    const biomeSelect = document.createElement('select');
    biomeSelect.className = 'main-menu__select';
    biomeSelect.id = 'sandbox-biome';
    for (const [key, def] of Object.entries(SCENARIOS)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = def.name;
      biomeSelect.appendChild(opt);
    }
    form.appendChild(biomeSelect);

    // Map size selector
    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'main-menu__label';
    sizeLabel.textContent = 'Kartengröße';
    form.appendChild(sizeLabel);

    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'main-menu__select';
    sizeSelect.id = 'sandbox-size';
    for (const size of [3, 4, 5, 6, 7]) {
      const opt = document.createElement('option');
      opt.value = String(size);
      opt.textContent = `Radius ${size}`;
      if (size === 5) opt.selected = true;
      sizeSelect.appendChild(opt);
    }
    form.appendChild(sizeSelect);

    screen.appendChild(form);

    const startBtn = this.createMenuButton('Starten', () => {
      const biomeId = (document.getElementById('sandbox-biome') as HTMLSelectElement).value;
      const mapSize = parseInt((document.getElementById('sandbox-size') as HTMLSelectElement).value, 10);
      this.callbacks?.onStartSandbox(biomeId, mapSize);
    });
    startBtn.classList.add('main-menu__btn--accent');
    screen.appendChild(startBtn);

    this.sandboxScreen = screen;
    this.root.appendChild(screen);
  }

  // ── Helpers ──

  private createMenuButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'main-menu__btn';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  destroy(): void {
    this.root.remove();
  }
}
