export class WebRTCAudioInjectionService {
  constructor({ getPeers, getLocalStream }) { this.getPeers = getPeers; this.getLocalStream = getLocalStream; this.originalMicrophoneTrack = null; this.mode = 'real'; }
  captureOriginal() { this.originalMicrophoneTrack = this.getLocalStream()?.getAudioTracks?.()[0] || this.originalMicrophoneTrack; return this.originalMicrophoneTrack; }
  async replaceWith(track) {
    for (const peer of Object.values(this.getPeers())) {
      const sender = peer.getSenders().find((item) => item.track?.kind === 'audio');
      if (sender && track) await sender.replaceTrack(track);
    }
  }
  async useGeneratedAudio(track) { this.captureOriginal(); await this.replaceWith(track); this.mode = 'ai'; return this.mode; }
  async useRealMicrophone() { await this.replaceWith(this.captureOriginal()); this.mode = 'real'; return this.mode; }
}
