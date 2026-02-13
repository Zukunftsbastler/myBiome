const STORAGE_KEY = 'mybiome_profile';

export interface ProfileData {
  unlockedScenarios: string[];
  completedObjectives: Record<string, string[]>; // scenarioId -> completed objective descriptions
  bestTick: Record<string, number>;              // scenarioId -> fastest completion tick
}

const DEFAULT_PROFILE: ProfileData = {
  unlockedScenarios: ['tutorial_garden'],
  completedObjectives: {},
  bestTick: {},
};

export class PlayerProfile {
  private data: ProfileData;

  constructor() {
    this.data = this.load();
  }

  private load(): ProfileData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProfileData>;
        return {
          unlockedScenarios: parsed.unlockedScenarios ?? DEFAULT_PROFILE.unlockedScenarios,
          completedObjectives: parsed.completedObjectives ?? {},
          bestTick: parsed.bestTick ?? {},
        };
      }
    } catch {
      // Corrupted data — reset
    }
    return { ...DEFAULT_PROFILE, unlockedScenarios: [...DEFAULT_PROFILE.unlockedScenarios] };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage full or unavailable — silently fail
    }
  }

  isScenarioUnlocked(scenarioId: string): boolean {
    return this.data.unlockedScenarios.includes(scenarioId);
  }

  unlockScenario(scenarioId: string): void {
    if (!this.data.unlockedScenarios.includes(scenarioId)) {
      this.data.unlockedScenarios.push(scenarioId);
      this.save();
    }
  }

  completeScenario(scenarioId: string, tick: number, objectiveLabels: string[]): void {
    this.data.completedObjectives[scenarioId] = objectiveLabels;
    const prev = this.data.bestTick[scenarioId];
    if (prev === undefined || tick < prev) {
      this.data.bestTick[scenarioId] = tick;
    }
    this.save();
  }

  isScenarioCompleted(scenarioId: string): boolean {
    return scenarioId in this.data.completedObjectives;
  }

  getBestTick(scenarioId: string): number | undefined {
    return this.data.bestTick[scenarioId];
  }

  getUnlockedScenarios(): readonly string[] {
    return this.data.unlockedScenarios;
  }

  reset(): void {
    this.data = { ...DEFAULT_PROFILE, unlockedScenarios: [...DEFAULT_PROFILE.unlockedScenarios] };
    this.save();
  }
}
