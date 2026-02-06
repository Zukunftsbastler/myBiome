import type { CellData, Entity, Genome } from '@core/types';

interface BarConfig {
  label: string;
  value: number;
  max: number;
  color: string;
}

export class Inspector {
  private root: HTMLElement;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'inspector hud__panel';

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'inspector__title';

    this.bodyEl = document.createElement('div');

    this.root.append(this.titleEl, this.bodyEl);
    container.appendChild(this.root);
  }

  show(cell: CellData, entity?: Entity, genome?: Genome): void {
    this.root.classList.add('inspector--visible');
    this.bodyEl.innerHTML = '';

    if (entity && genome) {
      this.showEntity(entity, genome, cell);
    } else {
      this.showCell(cell);
    }
  }

  hide(): void {
    this.root.classList.remove('inspector--visible');
  }

  update(cell: CellData, entity?: Entity, genome?: Genome): void {
    if (!this.root.classList.contains('inspector--visible')) return;
    this.show(cell, entity, genome);
  }

  // ── Cell View ──

  private showCell(cell: CellData): void {
    this.titleEl.textContent = `Cell (${cell.position.q}, ${cell.position.r})`;

    const bars: BarConfig[] = [
      { label: 'Water',    value: cell.water,             max: 1, color: '#4488cc' },
      { label: 'Nutrients',value: cell.nutrients,          max: 1, color: '#44aa44' },
      { label: 'Toxin',    value: cell.toxin,             max: 1, color: '#cc4444' },
      { label: 'Organic',  value: cell.organicSaturation, max: 1, color: '#886644' },
      { label: 'Compact',  value: cell.compaction,        max: 1, color: '#888888' },
      { label: 'Shade',    value: cell.shade,             max: 1, color: '#445566' },
      { label: 'Biofilm',  value: cell.biofilmIntegrity,  max: 1, color: '#66aacc' },
      { label: 'Occupy',   value: cell.occupancy,         max: 1, color: '#aa8866' },
    ];

    const section = this.createSection('Soil', bars);
    this.bodyEl.appendChild(section);
  }

  // ── Entity View ──

  private showEntity(entity: Entity, genome: Genome, cell: CellData): void {
    this.titleEl.textContent = `${genome.name} (${entity.type})`;

    // Vitals
    const vitals: BarConfig[] = [
      { label: 'HP',       value: entity.hp,         max: 100,            color: '#cc4444' },
      { label: 'Biomass',  value: entity.biomass,    max: genome.maxHeight, color: '#44aa44' },
      { label: 'Energy',   value: entity.energy,     max: 50,             color: '#ccaa44' },
      { label: 'Water',    value: entity.waterBuffer, max: 20,            color: '#4488cc' },
    ];
    this.bodyEl.appendChild(this.createSection('Vitals', vitals));

    // Info line
    const info = document.createElement('div');
    info.className = 'inspector__section';
    info.innerHTML = `<div class="inspector__section-title">Info</div>`;
    const infoText = document.createElement('div');
    infoText.style.cssText = 'font-size:10px;color:#aaa;';
    infoText.textContent = `Age: ${entity.age} | ID: ${entity.id} | Genome: ${entity.genomeId}`;
    info.appendChild(infoText);
    this.bodyEl.appendChild(info);

    // Genome traits
    const traits: BarConfig[] = [
      { label: 'Lignin',   value: genome.ligninInvestment,         max: 1, color: '#886644' },
      { label: 'Photo',    value: genome.photosynthesisEfficiency, max: 1, color: '#aacc44' },
      { label: 'N-Fix',    value: genome.nitrogenFixation,         max: 1, color: '#44ccaa' },
      { label: 'Drought',  value: genome.droughtResistance,        max: 1, color: '#cc8844' },
      { label: 'Toxicity', value: genome.toxicity,                 max: 1, color: '#cc4488' },
    ];
    this.bodyEl.appendChild(this.createSection('Traits', traits));

    // Cell summary
    const cellBars: BarConfig[] = [
      { label: 'Water',    value: cell.water,    max: 1, color: '#4488cc' },
      { label: 'Nutrients',value: cell.nutrients, max: 1, color: '#44aa44' },
    ];
    this.bodyEl.appendChild(this.createSection('Cell', cellBars));
  }

  // ── Helpers ──

  private createSection(title: string, bars: BarConfig[]): HTMLElement {
    const section = document.createElement('div');
    section.className = 'inspector__section';

    const titleEl = document.createElement('div');
    titleEl.className = 'inspector__section-title';
    titleEl.textContent = title;
    section.appendChild(titleEl);

    for (const bar of bars) {
      section.appendChild(this.createBar(bar));
    }
    return section;
  }

  private createBar(cfg: BarConfig): HTMLElement {
    const row = document.createElement('div');
    row.className = 'value-bar';

    const label = document.createElement('span');
    label.className = 'value-bar__label';
    label.textContent = cfg.label;

    const track = document.createElement('div');
    track.className = 'value-bar__track';

    const fill = document.createElement('div');
    fill.className = 'value-bar__fill';
    const pct = cfg.max > 0 ? Math.min(1, cfg.value / cfg.max) * 100 : 0;
    fill.style.width = `${pct}%`;
    fill.style.background = cfg.color;
    track.appendChild(fill);

    const value = document.createElement('span');
    value.className = 'value-bar__value';
    value.textContent = cfg.value.toFixed(2);

    row.append(label, track, value);
    return row;
  }
}
