export class LatencyMetricsService {
  constructor(now = () => Date.now()) { this.now = now; this.sentences = new Map(); }
  start(id) { this.sentences.set(id, { start: this.now() }); }
  mark(id, key) { const item = this.sentences.get(id) || { start: this.now() }; item[key] = this.now(); this.sentences.set(id, item); }
  get(id) {
    const item = this.sentences.get(id) || {};
    return {
      time_to_first_translated_token: item.firstTranslatedToken && item.start ? item.firstTranslatedToken - item.start : null,
      time_to_first_audio: item.firstAudio && item.start ? item.firstAudio - item.start : null,
      total_sentence_latency: item.done && item.start ? item.done - item.start : null
    };
  }
}
