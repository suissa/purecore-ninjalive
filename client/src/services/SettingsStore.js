export class SettingsStore {
  constructor(key = 'ninja_translation_settings') { this.key = key; }
  load(defaults = {}) { try { return { ...defaults, ...JSON.parse(localStorage.getItem(this.key) || '{}') }; } catch { return defaults; } }
  save(value) { localStorage.setItem(this.key, JSON.stringify(value)); return value; }
}
