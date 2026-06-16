export class AudioPlaybackQueueService {
  constructor({ audioContext, playToSpeakers = true } = {}) {
    this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    this.destination = this.audioContext.createMediaStreamDestination();
    this.queue = [];
    this.playing = false;
    this.playToSpeakers = playToSpeakers;
    this.currentSource = null;
    this.onStatus = () => {};
  }
  getGeneratedTrack() { return this.destination.stream.getAudioTracks()[0] || null; }
  async enqueue(arrayBuffer) { this.queue.push(arrayBuffer); if (!this.playing) await this.playNext(); }
  async playNext() {
    const item = this.queue.shift();
    if (!item) { this.playing = false; this.currentSource = null; this.onStatus('done'); return; }
    this.playing = true; this.onStatus('playing');
    const buffer = await this.audioContext.decodeAudioData(item.slice(0));
    const source = this.audioContext.createBufferSource();
    this.currentSource = source;
    source.buffer = buffer;
    source.connect(this.destination);
    if (this.playToSpeakers) source.connect(this.audioContext.destination);
    await new Promise((resolve) => { source.onended = resolve; source.start(); });
    if (this.currentSource === source) this.currentSource = null;
    return this.playNext();
  }
  clear() {
    this.queue = [];
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch {}
      this.currentSource = null;
    }
    this.playing = false;
    this.onStatus('cleared');
  }
}
