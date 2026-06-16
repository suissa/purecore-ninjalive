export class TranscriptStore {
  constructor() { this.events = []; }
  add(event) { this.events.push({ timestamp: Date.now(), ...event }); return this.events[this.events.length - 1]; }
  clear() { this.events = []; }
  all() { return [...this.events]; }
}
