export class RemoteAudioCaptureService {
  constructor({ onEvent = () => {} } = {}) { this.streams = new Map(); this.onEvent = onEvent; }
  register(userId, stream) { this.streams.set(userId, stream); this.onEvent('remote_audio_chunk_received', { userId, tracks: stream.getAudioTracks().length }); }
  unregister(userId) { this.streams.delete(userId); }
}
